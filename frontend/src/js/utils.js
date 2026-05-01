const utils = (() => {

  const MONTHS = Object.freeze([
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ]);

  //* Date helpers
  /**
   * Convert an ISO 8601 date string into "DD Mon YYYY" format.
   * Always uses UTC to avoid timezone-related off-by-one-day issues.

   * utils.formatDate('2009-04-06T23:28:51Z'); // → "6 Apr 2009"
   */
  function formatDate(iso) {
    if (!iso) return 'Unknown date';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return 'Invalid date';
    return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
  }

  /**
   * How long ago was a date? Returns a concise relative string.
   * Useful for "last active" displays.
   * utils.timeAgo('2024-01-01T00:00:00Z'); // → "~4 months ago"  (approx)
   */
  function timeAgo(iso) {
    if (!iso) return '';
    const secs = Math.floor((Date.now() - new Date(iso)) / 1000);
    if (secs < 60)               return 'just now';
    if (secs < 3_600)            return `${Math.floor(secs / 60)} min ago`;
    if (secs < 86_400)           return `${Math.floor(secs / 3_600)} hr ago`;
    if (secs < 86_400 * 30)      return `${Math.floor(secs / 86_400)} days ago`;
    if (secs < 86_400 * 365)     return `${Math.floor(secs / (86_400 * 30))} months ago`;
    return `${Math.floor(secs / (86_400 * 365))} years ago`;
  }

  //* Number helpers
  /**
   * Compact-format a large integer with one decimal place.

   * utils.compactNumber(0);         // → "0"
   * utils.compactNumber(999);       // → "999"
   * utils.compactNumber(1234);      // → "1.2k"
   * utils.compactNumber(1_500_000); // → "1.5m"
   */
  function compactNumber(n) {
    const num = Number(n) || 0;
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}m`;
    if (num >= 1_000)     return `${(num / 1_000).toFixed(1)}k`;
    return String(num);
  }

  //*  Repository helpers
  /**
   * Sum stargazers_count across an array of GitHub repo objects.
   * utils.totalStars([{ stargazers_count: 100 }, { stargazers_count: 42 }]); // → 142
   */
  function totalStars(repos) {
    if (!Array.isArray(repos)) return 0;
    return repos.reduce((acc, r) => acc + (Number(r.stargazers_count) || 0), 0);
  }

  /**
   * Return the top N repos sorted by stargazers_count (descending).
   * utils.topByStars(allRepos, 3); // → 3 repos with most stars
   */
  function topByStars(repos, n = 5) {
    if (!Array.isArray(repos)) return [];
    return [...repos]
      .sort((a, b) => (b.stargazers_count || 0) - (a.stargazers_count || 0))
      .slice(0, n);
  }

  /**
   * Strip leading/trailing whitespace and return a guaranteed string.
   * Treats null / undefined as empty string.
   *
   * utils.sanitize(null); // → ""
   * utils.sanitize('  hi  '); // → "hi"
   */
  function sanitize(value) {
    return String(value ?? '').trim();
  }

  //* String helpers
  /**
   * Ensure a URL string has a protocol prefix.
   * GitHub's `blog` field often omits "https://".
   *
   * utils.ensureProtocol('example.com'); // → "https://example.com"
   * utils.ensureProtocol('https://example.com') // → "https://example.com"
   */
  function ensureProtocol(url) {
    const s = sanitize(url);
    if (!s) return '';
    return /^https?:\/\//i.test(s) ? s : `https://${s}`;
  }

  /**
   * Truncate a string to `max` characters, appending "…" if clipped.
   * utils.truncate('Hello World', 8); // → "Hello Wo…"
   */
  function truncate(str, max = 80) {
    const s = sanitize(str);
    return s.length > max ? `${s.slice(0, max)}…` : s;
  }

  return Object.freeze({
    // Date
    formatDate,
    timeAgo,
    // Number
    compactNumber,
    // Repos
    totalStars,
    topByStars,
    // String
    sanitize,
    ensureProtocol,
    truncate,
  });

})();

export default utils;