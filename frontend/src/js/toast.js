const toast = (() => {

  const MAX_STACK      = 4;
  const DEFAULT_DURATION = 3500;

  const ICONS = Object.freeze({
    success: '✔',
    error:   '✗',
    info:    'ℹ',
    warning: '⚠',
  });

  let container = null;
  const active  = [];

  function _ensureContainer() {
    if (container) return;

    container = document.createElement('div');
    container.id = 'toast-container';
    container.setAttribute('role', 'status');
    container.setAttribute('aria-live', 'polite');
    container.setAttribute('aria-atomic', 'false');
    container.setAttribute('aria-label', 'Notifications');
    document.body.appendChild(container);
  }

  //* Toast lifecycle
  /**
   * Build a single toast DOM element.
   * @param {string} message
   * @param {'success'|'error'|'info'|'warning'} type
   * @returns {HTMLDivElement}
   */
  function _buildElement(message, type) {
    const el = document.createElement('div');
    el.className = `toast toast--${type}`;
    el.setAttribute('role', type === 'error' ? 'alert' : 'status');

    const icon = document.createElement('span');
    icon.className       = 'toast__icon';
    icon.textContent     = ICONS[type] || ICONS.info;
    icon.setAttribute('aria-hidden', 'true');

    const msg = document.createElement('span');
    msg.className   = 'toast__msg';
    msg.textContent = message;

    const closeBtn = document.createElement('button');
    closeBtn.className       = 'toast__close';
    closeBtn.textContent     = '×';
    closeBtn.setAttribute('aria-label', 'Dismiss notification');

    const bar = document.createElement('div');
    bar.className = 'toast__bar';

    el.appendChild(icon);
    el.appendChild(msg);
    el.appendChild(closeBtn);
    el.appendChild(bar);

    return el;
  }

  //* Animate a toast out and remove it from DOM + active list.
  function _dismiss(entry) {
    const { el } = entry;
    if (!el || !el.isConnected) return;

    el.classList.add('toast--out');

    const idx = active.indexOf(entry);
    if (idx !== -1) active.splice(idx, 1);

    el.addEventListener('animationend', () => el.remove(), { once: true });

    // Fallback in case animationend doesn't fire
    setTimeout(() => { if (el.isConnected) el.remove(); }, 500);
  }

  // auto-dismiss countdown and animate the progress bar.
  function _startTimer(entry, duration) {
    const bar = entry.el.querySelector('.toast__bar');
    if (bar) {
      bar.style.animationDuration = `${duration}ms`;
      bar.classList.add('toast__bar--running');
    }

    entry.timerId = setTimeout(() => _dismiss(entry), duration);
  }

  //* Public API
  function show(message, options = {}) {
    _ensureContainer();

    const type     = options.type     || 'info';
    const duration = options.duration !== undefined ? options.duration : DEFAULT_DURATION;

    if (active.length >= MAX_STACK) {
      _dismiss(active[active.length - 1]);
    }

    const el    = _buildElement(String(message), type);
    const entry = { el, timerId: null };
    active.unshift(entry);

    container.prepend(el);

    requestAnimationFrame(() => el.classList.add('toast--in'));

    el.querySelector('.toast__close').addEventListener('click', () => {
      clearTimeout(entry.timerId);
      _dismiss(entry);
    });

    if (duration > 0) {
      el.addEventListener('mouseenter', () => {
        clearTimeout(entry.timerId);
        const bar = el.querySelector('.toast__bar');
        if (bar) bar.classList.remove('toast__bar--running');
      });

      el.addEventListener('mouseleave', () => {
        _startTimer(entry, Math.min(duration, 2000));
      });

      _startTimer(entry, duration);
    }

    return () => {
      clearTimeout(entry.timerId);
      _dismiss(entry);
    };
  }

  // Convenience typed wrappers
  const success = (msg, opts) => show(msg, { ...opts, type: 'success' });
  const error   = (msg, opts) => show(msg, { ...opts, type: 'error'   });
  const info    = (msg, opts) => show(msg, { ...opts, type: 'info'    });
  const warning = (msg, opts) => show(msg, { ...opts, type: 'warning' });

  // Dismiss all active toasts immediately
  function dismissAll() {
    [...active].forEach(entry => {
      clearTimeout(entry.timerId);
      _dismiss(entry);
    });
  }

  return Object.freeze({ show, success, error, info, warning, dismissAll });

})();