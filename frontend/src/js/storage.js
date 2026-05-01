const storage = (() => {

  const PREFIX = 'dd:';
  const MAX_HISTORY = 8; 

  const KEYS = Object.freeze({
    HISTORY: `${PREFIX}history`,
    LAST_PROFILE: `${PREFIX}last_profile`,
    THEME: `${PREFIX}theme`,
  });

  function _isAvailable() {
    try {
      const test = `${PREFIX}_test`;
      localStorage.setItem(test, '1');
      localStorage.removeItem(test);
      return true;
    } catch (_) {
      return false;
    }
  }

  const _available = _isAvailable();

  /**
   * Read and JSON-parse a localStorage value.
   * Returns `fallback` on any error.
   **/
  function _get(key, fallback) {
    if (!_available) return fallback;
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (_) {
      return fallback;
    }
  }

  /**
   * JSON-stringify and write a value to localStorage.
   * Silently swallows errors (quota exceeded, etc.).
   */
  function _set(key, value) {
    if (!_available) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (_) { /* non-fatal */ }
  }

  /**
   * Remove a key from localStorage.
   */
  function _remove(key) {
    if (!_available) return;
    try { localStorage.removeItem(key); } catch (_) { /* non-fatal */ }
  }

  //* Search history

  function getHistory() {
    return _get(KEYS.HISTORY, []);
  }

  function addToHistory(username) {
    const name = String(username).trim().toLowerCase();
    if (!name) return;

    const history = getHistory().filter(u => u.toLowerCase() !== name);
    history.unshift(username.trim());   // keep original casing
    _set(KEYS.HISTORY, history.slice(0, MAX_HISTORY));
  }

  function removeFromHistory(username) {
    const filtered = getHistory().filter(
      u => u.toLowerCase() !== username.toLowerCase()
    );
    _set(KEYS.HISTORY, filtered);
  }

  // Wipe the entire search history.
  function clearHistory() {
    _remove(KEYS.HISTORY);
  }

  /* 
     Last profile cache
     Lets us restore the most-recent result on page load so users
     don't have to re-search if they close and reopen the tab.
   */

  function saveLastProfile(user, repos) {
    const slim = {
      login:        user.login,
      name:         user.name,
      avatar_url:   user.avatar_url,
      html_url:     user.html_url,
      bio:          user.bio,
      blog:         user.blog,
      created_at:   user.created_at,
      public_repos: user.public_repos,
      followers:    user.followers,
      following:    user.following,
    };
    _set(KEYS.LAST_PROFILE, { user: slim, repos, savedAt: Date.now() });
  }

  function getLastProfile() {
    const data = _get(KEYS.LAST_PROFILE, null);
    if (!data) return null;

    const TEN_MIN = 10 * 60 * 1000;
    if (Date.now() - data.savedAt > TEN_MIN) {
      _remove(KEYS.LAST_PROFILE);
      return null;
    }
    return { user: data.user, repos: data.repos };
  }

  /** Clear the cached last profile. */
  function clearLastProfile() {
    _remove(KEYS.LAST_PROFILE);
  }

  //*Theme preference
  function saveTheme(theme) {
    _set(KEYS.THEME, theme);
  }

  function getSavedTheme() {
    return _get(KEYS.THEME, null);
  }

  //* Diagnostics / dev-aid
  function clearAll() {
    Object.values(KEYS).forEach(_remove);
  }

  function isAvailable() { return _available; }

  return Object.freeze({
    
    // History
    getHistory,
    addToHistory,
    removeFromHistory,
    clearHistory,
    
    // Last profile
    saveLastProfile,
    getLastProfile,
    clearLastProfile,
    
    // Theme
    saveTheme,
    getSavedTheme,
    
    // Meta
    isAvailable,
    clearAll,
    KEYS,
  });

})();

export default storage;