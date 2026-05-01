import storage from './storage.js';
import toast from './toast.js';

const historyUI = (() => {

  let _inputEl    = null;  
  let _dropdown   = null; 
  let _isOpen     = false;

  function init(inputEl) {
    if (!inputEl) return;
    _inputEl = inputEl;

    _buildDropdown();
    _attachListeners();
  }

  //*dom construction
  function _buildDropdown() {
    _dropdown = document.createElement('div');
    _dropdown.id        = 'history-dropdown';
    _dropdown.className = 'history-dropdown hidden';
    _dropdown.setAttribute('role', 'listbox');
    _dropdown.setAttribute('aria-label', 'Recent searches');

    const wrapper = _inputEl.closest('.search-wrapper') || _inputEl.parentElement;
    wrapper.style.position = 'relative';
    wrapper.appendChild(_dropdown);
  }


  function _attachListeners() {
    _inputEl.addEventListener('focus', () => {
      if (storage.getHistory().length) open();
    });

    _inputEl.addEventListener('input', () => {
      const q = _inputEl.value.trim().toLowerCase();
      if (q) {
        _render(storage.getHistory().filter(u => u.toLowerCase().includes(q)));
      } else {
        _render(storage.getHistory());
      }
      if (storage.getHistory().length) open();
    });

    _inputEl.addEventListener('keydown', _handleKeyNav);

    document.addEventListener('click', e => {
      if (!_dropdown.contains(e.target) && e.target !== _inputEl) close();
    });
    
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') close();
    });
  }


  function _handleKeyNav(e) {
    if (!_isOpen) return;

    const items = [..._dropdown.querySelectorAll('.history-item')];
    const focused = _dropdown.querySelector('.history-item--focused');
    let idx = items.indexOf(focused);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      idx = Math.min(idx + 1, items.length - 1);
      _setFocus(items, idx);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      idx = Math.max(idx - 1, 0);
      _setFocus(items, idx);
    } else if (e.key === 'Enter' && focused) {
      e.preventDefault();
      _selectItem(focused.dataset.username);
    }
  }

  function _setFocus(items, idx) {
    items.forEach(el => el.classList.remove('history-item--focused'));
    if (items[idx]) {
      items[idx].classList.add('history-item--focused');
      items[idx].scrollIntoView({ block: 'nearest' });
    }
  }


  function _render(usernames) {
    _dropdown.innerHTML = '';

    if (!usernames.length) {
      close();
      return;
    }

    const header = document.createElement('div');
    header.className   = 'history-header';

    const label = document.createElement('span');
    label.textContent = 'RECENT';
    label.className   = 'history-header__label';

    const clearBtn = document.createElement('button');
    clearBtn.textContent = 'Clear all';
    clearBtn.className   = 'history-header__clear';
    clearBtn.addEventListener('click', e => {
      e.stopPropagation();
      storage.clearHistory();
      close();
      toast.info('Search history cleared.');
    });

    header.appendChild(label);
    header.appendChild(clearBtn);
    _dropdown.appendChild(header);

    const list = document.createElement('ul');
    list.className = 'history-list';

    usernames.forEach(username => {
      const li = document.createElement('li');
      li.className              = 'history-item';
      li.setAttribute('role',  'option');
      li.dataset.username       = username;

      const icon = document.createElement('span');
      icon.className   = 'history-item__icon';
      icon.textContent = '🕐';
      icon.setAttribute('aria-hidden', 'true');

      const name = document.createElement('span');
      name.className   = 'history-item__name';
      name.textContent = username;

      const del = document.createElement('button');
      del.className   = 'history-item__del';
      del.textContent = '×';
      del.setAttribute('aria-label', `Remove ${username} from history`);
      del.addEventListener('click', e => {
        e.stopPropagation();
        storage.removeFromHistory(username);
        _render(storage.getHistory());
        if (!storage.getHistory().length) close();
      });

      li.appendChild(icon);
      li.appendChild(name);
      li.appendChild(del);

      li.addEventListener('click', () => _selectItem(username));

      list.appendChild(li);
    });

    _dropdown.appendChild(list);
  }


  function _selectItem(username) {
    _inputEl.value = username;
    close();

    _inputEl.dispatchEvent(new CustomEvent('history:select', {
      bubbles: true,
      detail: { username },
    }));
  }

  function open() {
    _render(
      _inputEl.value.trim()
        ? storage.getHistory().filter(u =>
            u.toLowerCase().includes(_inputEl.value.trim().toLowerCase()))
        : storage.getHistory()
    );
    _dropdown.classList.remove('hidden');
    _isOpen = true;
  }

  function close() {
    _dropdown.classList.add('hidden');
    _isOpen = false;
  }

  return Object.freeze({ init, open, close });

})();

export default historyUI;