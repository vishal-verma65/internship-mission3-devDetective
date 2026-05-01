const theme = (() => {

  const THEMES   = Object.freeze(['dark', 'light']);
  const DEFAULT  = 'dark';
  const ROOT     = document.documentElement;   // <html>

  function _validate(value) {
    return THEMES.includes(value) ? value : DEFAULT;
  }

  function _systemPreference() {
    return window.matchMedia('(prefers-color-scheme: light)').matches
      ? 'light'
      : 'dark';
  }

  function _apply(value) {
    ROOT.setAttribute('data-theme', value);

    document.querySelectorAll('[data-theme-toggle]').forEach(btn => {
      const next = value === 'dark' ? 'light' : 'dark';
      btn.setAttribute('aria-label', `Switch to ${next} mode`);
      btn.setAttribute('data-theme-next', next);

      const icon = btn.querySelector('.theme-icon');
      if (icon) icon.textContent = value === 'dark' ? '☀️' : '🌙';
    });

    window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: value } }));
  }


  function init() {
    const saved  = storage.getSavedTheme();
    const active = saved ? _validate(saved) : _systemPreference();
    _apply(active);

    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', e => {
      if (!storage.getSavedTheme()) {
        _apply(e.matches ? 'light' : 'dark');
      }
    });
  }

  function current() {
    return _validate(ROOT.getAttribute('data-theme'));
  }

  function set(value) {
    const validated = _validate(value);
    storage.saveTheme(validated);
    _apply(validated);
  }

  function toggle() {
    set(current() === 'dark' ? 'light' : 'dark');
  }

  function resetToSystem() {
    storage.saveTheme(null);   
    _apply(_systemPreference());
  }

  return Object.freeze({ init, current, set, toggle, resetToSystem });

})();