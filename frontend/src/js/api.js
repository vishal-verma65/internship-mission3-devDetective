const api = (() => {

  const BASE_URL   = 'https://api.github.com';
  const REPO_LIMIT = 5; 
  const ALL_LIMIT  = 100;

  async function _fetch(url, notFoundMsg) {
    let res;
    try {
      res = await fetch(url);
    } catch (networkErr) {
      throw new Error('Network error — check your connection and try again.');
    }

    if (!res.ok) {
      if (res.status === 403) {
        const remaining = res.headers.get('X-RateLimit-Remaining');
        if (remaining === '0') {
          throw new Error('GitHub API rate limit reached. Please wait a minute and try again.');
        }
      }
      if (res.status === 404 && notFoundMsg) throw new Error(notFoundMsg);
      throw new Error(`GitHub API error — status ${res.status}.`);
    }

    return res.json();
  }

  async function getUser(username) {
    const trimmed = username.trim();
    if (!trimmed) throw new Error('Username cannot be empty.');

    return _fetch(
      `${BASE_URL}/users/${encodeURIComponent(trimmed)}`,
      `No suspect found with alias "${trimmed}". Double-check the username.`
    );
  }

  async function getRepos(reposUrl, limit = REPO_LIMIT) {
    const url = `${reposUrl}?sort=pushed&direction=desc&per_page=${limit}`;
    return _fetch(url, 'Could not retrieve repositories.');
  }

  async function getUserWithAllRepos(username) {
    const user = await getUser(username);

    let repos = [];
    try {
      const url = `${user.repos_url}?per_page=${ALL_LIMIT}&sort=pushed`;
      repos = await _fetch(url);
    } catch (_) {
      /* Non-fatal — repos stay empty */
    }

    return { user, repos };
  }

  return Object.freeze({ getUser, getRepos, getUserWithAllRepos });

})();

export default api;