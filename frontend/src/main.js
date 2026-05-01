/**
 * Dev-Detective — main.js
 * Entry point / controller.
 *
 * Single responsibility: wire up ALL event listeners and orchestrate
 * calls between every module. Contains ZERO business logic and ZERO
 * DOM mutations — those live in their respective modules.
 *
 * Full dependency chain (load order in index.html):
 *   utils.js    → pure helpers          (no deps)
 *   api.js      → GitHub fetch          (no deps)
 *   storage.js  → localStorage          (no deps)
 *   toast.js    → notifications         (no deps)
 *   theme.js    → dark/light toggle     (needs storage)
 *   ui.js       → DOM rendering         (needs utils)
 *   history.js  → search dropdown       (needs storage, toast)
 *   main.js     → controller ← YOU ARE HERE
 */

'use strict';

import utils from './js/utils.js';
import api from './js/api.js';
import storage from './js/storage.js';
import toast from './js/toast.js';
import theme from './js/theme.js';
import ui from './js/ui.js';
import historyUI from './js/history.js';

/*
   DOM refs — interactive controls only.
   All other DOM work is delegated to ui.js or module inits.
   */
const searchInput  = document.getElementById('search-input');
const searchBtn    = document.getElementById('search-btn');
const themeToggle  = document.getElementById('theme-toggle');
const battleInput1 = document.getElementById('battle-input-1');
const battleInput2 = document.getElementById('battle-input-2');
const battleBtn    = document.getElementById('battle-btn');
const tabBtns      = document.querySelectorAll('.tab-btn');
const panels       = document.querySelectorAll('.panel');
const metricPills  = document.querySelectorAll('.pill');

//*Application state  (controller-level only)
const state = {
  metric: 'followers',
};

//* Tab switching 
tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.tab;

    tabBtns.forEach(b => {
      b.classList.toggle('active', b === btn);
      b.setAttribute('aria-selected', String(b === btn));
    });

    panels.forEach(panel => {
      panel.classList.toggle('hidden', panel.id !== `panel-${target}`);
    });
  });
});

//* Theme toggle 
themeToggle.addEventListener('click', () => {
  theme.toggle();
  const now = theme.current();
  toast.info(`${now === 'dark' ? '🌙 Dark' : '☀️ Light'} mode activated.`, { duration: 2000 });
});

//* Battle metric toggle  (Followers - Total Stars)
metricPills.forEach(pill => {
  pill.addEventListener('click', () => {
    metricPills.forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    state.metric = pill.dataset.metric;
  });
});

//* Search / Investigate
async function handleSearch() {
  const username = searchInput.value.trim();

  if (!username) {
    searchInput.focus();
    toast.warning('Enter a GitHub username to investigate.');
    return;
  }

  ui.setSearchLoading(true);
  ui.showState('state-loading');
  historyUI.close();

  try {
    const user  = await api.getUser(username);
    const repos  = await api.getRepos(user.repos_url, 5);

    ui.renderProfile(user);
    ui.renderRepos(repos);

    /* Persist */
    storage.addToHistory(username);
    storage.saveLastProfile(user, repos);

    toast.success(`Case file opened: @${user.login}`, { duration: 2500 });

  } catch (err) {
    ui.showError(err.message);
    toast.error(err.message, { duration: 5000 });
  } finally {
    ui.setSearchLoading(false);
  }
}

searchBtn.addEventListener('click', handleSearch);

searchInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') handleSearch();
});

searchInput.addEventListener('history:select', () => handleSearch());

//* Battle Mode
async function handleBattle() {
  const u1 = battleInput1.value.trim();
  const u2 = battleInput2.value.trim();

  if (!u1 || !u2) {
    ui.showBattleError('Enter both usernames to start the battle.');
    toast.warning('Two suspects required for a battle.');
    return;
  }

  if (u1.toLowerCase() === u2.toLowerCase()) {
    ui.showBattleError('Enter two different usernames to compare.');
    toast.warning('A developer cannot battle themselves.');
    return;
  }

  ui.setBattleLoading(true);

  try {
    const [data1, data2] = await Promise.all([
      api.getUserWithAllRepos(u1),
      api.getUserWithAllRepos(u2),
    ]);

    ui.renderBattle(data1, data2, state.metric);

  } catch (err) {
    ui.showBattleError(err.message);
    toast.error(err.message, { duration: 5000 });
  } finally {
    ui.setBattleLoading(false);
  }
}

battleBtn.addEventListener('click', handleBattle);

[battleInput1, battleInput2].forEach(input => {
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') handleBattle();
  });
});

/*
   Boot sequence
   Runs once on page load. Order matters.
*/
(function boot() {

  /* 1. Apply saved/system theme before first paint */
  theme.init();

  /* 2. Wire up search history dropdown */
  historyUI.init(searchInput);

  /* 3. Restore last session's profile (if recent and cached) */
  const cached = storage.getLastProfile();
  if (cached) {
    ui.renderProfile(cached.user);
    ui.renderRepos(cached.repos);
    searchInput.value = cached.user.login;
    toast.info(`Restored last case: @${cached.user.login}`, { duration: 3000 });
  } else {
    ui.showIdle();
  }

  /* 4. Focus search input */
  searchInput.focus();

  /* 5. Notify if localStorage is unavailable (private browsing etc.) */
  if (!storage.isAvailable()) {
    toast.warning('Storage unavailable — history and caching disabled.', { duration: 5000 });
  }

})();