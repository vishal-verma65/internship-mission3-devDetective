const ui = (() => {

  // Thin wrapper around getElementById that throws clearly when an expected element is missin/ 
  function _el(id) {
    const el = document.getElementById(id);
    if (!el) throw new Error(`[ui] Element #${id} not found in DOM.`);
    return el;
  }

  //Search / Investigate panel
  const search = {
    stateIdle:    _el('state-idle'),
    stateLoading: _el('state-loading'),
    stateError:   _el('state-error'),
    stateResult:  _el('state-result'),
    errorMsg:     _el('error-message'),
    btn:          _el('search-btn'),

    avatar:       _el('profile-avatar'),
    name:         _el('profile-name'),
    login:        _el('profile-login'),
    bio:          _el('profile-bio'),
    date:         _el('profile-date'),
    url:          _el('profile-url'),
    portfolioRow: _el('portfolio-row'),

    statRepos:     _el('stat-repos'),
    statFollowers: _el('stat-followers'),
    statFollowing: _el('stat-following'),

    repoList:  _el('repo-list'),
    reposBadge: _el('repos-badge'),
  };

  //Battle panel
  const battle = {
    loading:  _el('battle-loading'),
    error:    _el('battle-error'),
    errorMsg: _el('battle-error-message'),
    result:   _el('battle-result'),
    cards:    _el('battle-cards'),
    verdict:  _el('verdict-banner'),
    btn:      _el('battle-btn'),
  };

  /*
     State machine — search panel
     Only one of the four states is visible at a time.
  */
  const SEARCH_STATES = ['state-idle', 'state-loading', 'state-error', 'state-result'];

  /**
   * Show exactly one search-panel state, hide the rest.
   * @param {'state-idle'|'state-loading'|'state-error'|'state-result'} activeId
   */
  function showState(activeId) {
    SEARCH_STATES.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.toggle('hidden', id !== activeId);
    });
  }

  function showIdle() {
    showState('state-idle');
  }

  function setSearchLoading(on) {
    search.btn.classList.toggle('loading', on);
    search.btn.disabled = on;
  }

  function showError(msg) {
    search.errorMsg.textContent = utils.sanitize(msg);
    showState('state-error');
  }


  //* Profile card renderer */

  function renderProfile(user) {
    /* Avatar */
    search.avatar.src = user.avatar_url ?? '';
    search.avatar.alt = `${user.login}'s avatar`;

    /* Identity */
    search.name.textContent  = utils.sanitize(user.name || user.login);
    search.login.textContent = `@${user.login}`;
    search.login.href        = user.html_url ?? '#';

    /* Bio */
    search.bio.textContent = utils.sanitize(user.bio) || 'No bio on file.';

    /* Join date */
    search.date.textContent = user.created_at
      ? utils.formatDate(user.created_at)
      : 'Unknown';

    /* Stats */
    search.statRepos.textContent     = utils.compactNumber(user.public_repos ?? 0);
    search.statFollowers.textContent = utils.compactNumber(user.followers    ?? 0);
    search.statFollowing.textContent = utils.compactNumber(user.following    ?? 0);

    /* Portfolio URL */
    const blogUrl = utils.ensureProtocol(user.blog ?? '');
    if (blogUrl) {
      search.url.href        = blogUrl;
      search.url.textContent = utils.sanitize(user.blog);
      search.portfolioRow.classList.remove('hidden');
    } else {
      search.portfolioRow.classList.add('hidden');
    }

    showState('state-result');
  }


  //* Repository list renderer

  function renderRepos(repos) {
    /* Clear previous results */
    search.repoList.innerHTML = '';
    search.reposBadge.textContent = repos.length ? `${repos.length} shown` : '—';

    if (!repos.length) {
      _appendEmptyRepoMessage();
      return;
    }

    const fragment = document.createDocumentFragment();
    repos.forEach(repo => fragment.appendChild(_buildRepoItem(repo)));
    search.repoList.appendChild(fragment);
  }

  function _buildRepoItem(repo) {
    const li = document.createElement('li');
    li.className = 'repo-item';

    /* ── Left column ── */
    const main = document.createElement('div');
    main.className = 'repo-main';

    const nameLink = document.createElement('a');
    nameLink.className  = 'repo-name';
    nameLink.href       = repo.html_url ?? '#';
    nameLink.target     = '_blank';
    nameLink.rel        = 'noopener noreferrer';
    nameLink.title      = repo.name;
    nameLink.textContent = repo.name;

    const desc = document.createElement('span');
    desc.className   = 'repo-desc';
    desc.textContent = utils.truncate(repo.description, 80) || 'No description.';

    main.appendChild(nameLink);
    main.appendChild(desc);

    /* ── Right column ── */
    const meta = document.createElement('div');
    meta.className = 'repo-meta';

    const stars = document.createElement('span');
    stars.className   = 'repo-stars';
    stars.textContent = `★ ${utils.compactNumber(repo.stargazers_count ?? 0)}`;

    const updated = document.createElement('span');
    updated.className   = 'repo-updated';
    updated.textContent = `Updated ${utils.formatDate(repo.pushed_at || repo.updated_at)}`;

    meta.appendChild(stars);
    meta.appendChild(updated);

    li.appendChild(main);
    li.appendChild(meta);
    return li;
  }

  function _appendEmptyRepoMessage() {
    const p = document.createElement('p');
    p.className = 'empty-repo-message';
    p.textContent = 'No public repositories found.';
    search.repoList.appendChild(p);
  }


  //*Battle mode renderers

  function setBattleLoading(on) {
    battle.loading.classList.toggle('hidden', !on);
    battle.error.classList.add('hidden');
    if (on) battle.result.classList.add('hidden');
    battle.btn.disabled = on;
  }

  function showBattleError(msg) {
    battle.errorMsg.textContent = utils.sanitize(msg);
    battle.error.classList.remove('hidden');
    battle.loading.classList.add('hidden');
    battle.result.classList.add('hidden');
  }

  function renderBattle(challenger1, challenger2, metric) {
    const score1 = _battleScore(challenger1, metric);
    const score2 = _battleScore(challenger2, metric);
    const metricLabel = metric === 'stars' ? 'Total Stars' : 'Followers';

    const tied   = score1 === score2;
    const winner = tied ? null : (score1 > score2 ? 1 : 2);

    const stars1 = utils.totalStars(challenger1.repos);
    const stars2 = utils.totalStars(challenger2.repos);

    const fragment = document.createDocumentFragment();
    fragment.appendChild(_buildBattleCard(challenger1.user, score1, stars1, challenger1.repos.length, winner === 1, winner === 2, metricLabel));
    fragment.appendChild(_buildBattleCard(challenger2.user, score2, stars2, challenger2.repos.length, winner === 2, winner === 1, metricLabel));

    battle.cards.innerHTML = '';
    battle.cards.appendChild(fragment);

    _renderVerdict(challenger1.user, challenger2.user, score1, score2, tied, winner, metricLabel);

    battle.loading.classList.add('hidden');
    battle.result.classList.remove('hidden');
  }

  //*Calculate the battle score for a challenger based on the chosen metric.
  function _battleScore(data, metric) {
    return metric === 'stars'
      ? utils.totalStars(data.repos)
      : (data.user.followers ?? 0);
  }

  function _buildBattleCard(user, score, totalStars, repoCount, isWinner, isLoser, metricLabel) {
    const card = document.createElement('div');
    card.className = `battle-card${isWinner ? ' winner' : isLoser ? ' loser' : ''}`;

    const strip = document.createElement('div');
    strip.className = 'battle-card-strip';
    card.appendChild(strip);

    const inner = document.createElement('div');
    inner.className = 'battle-card-inner';

    const avatar = document.createElement('img');
    avatar.className = 'bc-avatar';
    avatar.src    = user.avatar_url ?? '';
    avatar.alt    = `${user.login}'s avatar`;
    avatar.width  = 80;
    avatar.height = 80;

    const name = document.createElement('p');
    name.className   = 'bc-name';
    name.textContent = utils.sanitize(user.name || user.login);

    const login = document.createElement('p');
    login.className   = 'bc-login';
    login.textContent = `@${user.login}`;

    const statsGrid = document.createElement('div');
    statsGrid.className = 'bc-stats-grid';

    const statItems = [
      { label: 'Followers', value: utils.compactNumber(user.followers ?? 0) },
      { label: 'Following', value: utils.compactNumber(user.following ?? 0) },
      { label: '★ Stars',   value: utils.compactNumber(totalStars) },
      { label: '📁 Repos',  value: utils.compactNumber(repoCount) },
      { label: '📦 Gists',  value: utils.compactNumber(user.public_gists ?? 0) },
      { label: metricLabel, value: utils.compactNumber(score), highlight: true },
    ];

    statItems.forEach(({ label, value, highlight }) => {
      const item = document.createElement('div');
      item.className = 'bc-stat-item' + (highlight ? ' bc-stat-highlight' : '');

      const val = document.createElement('span');
      val.className   = 'bc-stat-val';
      val.textContent = value;

      const lbl = document.createElement('span');
      lbl.className   = 'bc-stat-lbl';
      lbl.textContent = label;

      item.appendChild(val);
      item.appendChild(lbl);
      statsGrid.appendChild(item);
    });

    inner.appendChild(avatar);
    inner.appendChild(name);
    inner.appendChild(login);
    inner.appendChild(statsGrid);

    card.appendChild(inner);
    return card;
  }


  //*results banner renderer

  function _renderVerdict(user1, user2, score1, score2, tied, winner, metricLabel) {
    battle.verdict.innerHTML = '';
    battle.verdict.className = 'verdict-banner' + (tied ? ' verdict-tie' : winner === 1 ? ' verdict-p1' : ' verdict-p2');

    const textEl = document.createElement('p');
    textEl.className = 'verdict-text';

    const subEl = document.createElement('p');
    subEl.className = 'verdict-sub';

    if (tied) {
      textEl.textContent = '⚖️ Dead tie — equally matched!';
      subEl.textContent  = `Both scored ${utils.compactNumber(score1)} ${metricLabel.toLowerCase()}`;
    } else {
      const winUser = winner === 1 ? user1 : user2;
      const margin  = Math.abs(score1 - score2);
      textEl.textContent = `🏆 ${utils.sanitize(winUser.name || winUser.login)} wins!`;
      subEl.textContent  = `leads by ${utils.compactNumber(margin)} ${metricLabel.toLowerCase()}`;
    }

    battle.verdict.appendChild(textEl);
    battle.verdict.appendChild(subEl);
  }

  return Object.freeze({
    // Search panel
    showState,
    showIdle,
    setSearchLoading,
    showError,
    renderProfile,
    renderRepos,
    
    // Battle panel
    setBattleLoading,
    showBattleError,
    renderBattle,
  });

})();