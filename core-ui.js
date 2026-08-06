let state = loadState();
let timerInterval = null;
let activeTimerRemaining = 0;
let activeActivityId = null;
let displayPoll = null;
let knownRemoteWins = new Set();

function activity(id, name, icon, instruction, modification, seconds = null, reps = null) {
  return { id, name, icon: ICONS[icon] || '✨', instruction, modification, seconds, reps, free: false };
}

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,10)}`;
}

function safeText(value, max = 30) {
  return String(value || '').replace(/[<>]/g, '').trim().slice(0, max);
}

function shuffle(items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function defaultState() {
  return {
    sessionId: uid(), nickname: '', displayName: '', mode: 'family', privateWin: false,
    showMods: true, sound: true, started: false, cardIds: [], completed: ['free'],
    wonLines: [], createdAt: Date.now(), lastUpdated: Date.now()
  };
}

function loadState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return parsed && parsed.sessionId ? Object.assign(defaultState(), parsed) : defaultState();
  } catch { return defaultState(); }
}

function saveState() {
  state.lastUpdated = Date.now();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getPool(mode = state.mode) { return mode === 'challenge' ? CHALLENGE : FAMILY; }

function cardActivities() {
  const lookup = new Map([...FAMILY, ...CHALLENGE, FREE_SPACE].map(item => [item.id, item]));
  return state.cardIds.map(id => lookup.get(id)).filter(Boolean);
}

function startNewGame(form) {
  const data = new FormData(form);
  const nickname = safeText(data.get('nickname'));
  if (!nickname) { showToast('Choose a nickname to start.'); return; }
  const mode = data.get('mode') === 'challenge' ? 'challenge' : 'family';
  const pool = shuffle(getPool(mode));
  const cardIds = [...pool.slice(0,12).map(a => a.id), 'free', ...pool.slice(12,24).map(a => a.id)];
  state = {
    sessionId: uid(), nickname, displayName: data.get('privateWin') ? 'Anonymous Player' : nickname,
    mode, privateWin: Boolean(data.get('privateWin')), showMods: Boolean(data.get('showMods')),
    sound: Boolean(data.get('sound')), started: true, cardIds, completed: ['free'], wonLines: [],
    createdAt: Date.now(), lastUpdated: Date.now()
  };
  saveState();
  recordSession();
  renderGame();
}

function renderWelcome() {
  APP.innerHTML = `
    <main class="shell">
      <div class="brandbar">
        <img class="brand-logo" src="assets/inclusive-health-logo.png" alt="Inclusive Health logo">
        <div class="brand-copy">
          <p class="eyebrow">Inclusive Health presents</p>
          <h1>Big Day of Play <span class="rainbow-word">${rainbow('Bingo')}</span></h1>
          <p class="subtitle">Scan. Move. Play. Complete a bingo right on your phone.</p>
        </div>
      </div>
      <section class="panel welcome-panel">
        <span class="intro-badge">🎉 No app or account needed</span>
        <form id="welcome-form">
          <label class="field-label" for="nickname">Choose a fun nickname</label>
          <input class="text-input" id="nickname" name="nickname" maxlength="30" autocomplete="nickname" placeholder="RainbowRunner" value="${escapeHtml(state.nickname)}" required>

          <span class="field-label">Choose your card</span>
          <div class="mode-grid">
            <label class="mode-option">
              <input type="radio" name="mode" value="family" ${state.mode !== 'challenge' ? 'checked' : ''}>
              <span class="mode-card">
                <span class="mode-title">🌟 Family Fitness</span>
                <p class="mode-description">Approachable activities for kids, families, and anyone who wants a gentler card.</p>
              </span>
            </label>
            <label class="mode-option">
              <input type="radio" name="mode" value="challenge" ${state.mode === 'challenge' ? 'checked' : ''}>
              <span class="mode-card">
                <span class="mode-title">🔥 Challenge Card</span>
                <p class="mode-description">Slightly longer and higher-repetition activities for adults and older kids.</p>
              </span>
            </label>
          </div>

          <div class="settings">
            <label class="check-row">
              <input type="checkbox" name="showMods" ${state.showMods ? 'checked' : ''}>
              <span><strong>Show movement modifications</strong><small>Every activity includes a seated, supported, or lower-impact option.</small></span>
            </label>
            <label class="check-row">
              <input type="checkbox" name="sound" ${state.sound ? 'checked' : ''}>
              <span><strong>Celebration sounds</strong><small>Your phone may also vibrate when you complete a bingo.</small></span>
            </label>
            <label class="check-row">
              <input type="checkbox" name="privateWin" ${state.privateWin ? 'checked' : ''}>
              <span><strong>Keep my public celebration private</strong><small>The event screen will show “Anonymous Player” instead of your nickname.</small></span>
            </label>
          </div>

          <button class="primary-btn" type="submit">Start my bingo card ✨</button>
          ${state.started ? '<button class="ghost-btn" id="resume-btn" type="button" style="width:100%;margin-top:10px">Resume my current card</button>' : ''}
        </form>
        <p class="safety-note">Choose movements that feel safe for your body. Modifications count. Stop if you feel pain, dizzy, faint, or unwell.</p>
      </section>
    </main>`;

  document.getElementById('welcome-form').addEventListener('submit', event => {
    event.preventDefault();
    startNewGame(event.currentTarget);
  });
  document.getElementById('resume-btn')?.addEventListener('click', renderGame);
}

function renderGame(highlight = []) {
  const card = cardActivities();
  if (!state.started || card.length !== 25) { renderWelcome(); return; }
  const completedCount = Math.max(0, state.completed.length - 1);
  const bingoCount = calculateWonLines().length;
  const progress = Math.round((completedCount / 24) * 100);
  const modeLabel = state.mode === 'challenge' ? 'Challenge Bingo · Adults & Older Kids' : 'Family Fitness Bingo';

  APP.innerHTML = `
    <main class="game-shell">
      <header class="game-topbar">
        <img class="game-logo" src="assets/inclusive-health-logo.png" alt="Inclusive Health">
        <div class="game-title"><h1>Big Day of Play</h1><p>${escapeHtml(state.nickname)} · ${modeLabel}</p></div>
        <button class="icon-btn" id="home-btn" type="button" aria-label="Game menu">☰</button>
      </header>
      <section class="status-row" aria-label="Game progress">
        <div class="stat-pill"><b>${completedCount}</b><span>Squares done</span></div>
        <div class="stat-pill"><b>${bingoCount}</b><span>Bingos</span></div>
        <div class="stat-pill"><b>${progress}%</b><span>Card complete</span></div>
      </section>
      <div class="progress-track" aria-hidden="true"><div class="progress-fill" style="width:${progress}%"></div></div>
      <div class="bingo-head" aria-hidden="true">${'BINGO'.split('').map(letter => `<div class="bingo-letter">${letter}</div>`).join('')}</div>
      <section class="bingo-grid" aria-label="Fitness bingo card">
        ${card.map((item, index) => squareMarkup(item, index, highlight)).join('')}
      </section>
      <footer class="game-footer">
        Tap a square for instructions. Complete any row, column, or diagonal. Modifications always count.
        <div class="local-badge">${syncEnabled() ? '● Event display connected' : '○ Progress saved on this device'}</div>
      </footer>
    </main>`;

  document.querySelectorAll('.bingo-square').forEach(button => button.addEventListener('click', () => openChallenge(button.dataset.id)));
  document.getElementById('home-btn').addEventListener('click', openMenu);
}

function squareMarkup(item, index, highlight) {
  const completed = state.completed.includes(item.id);
  const classes = ['bingo-square'];
  if (completed) classes.push('completed');
  if (item.free) classes.push('free-space');
  if (highlight.includes(index)) classes.push('winning');
  return `<button type="button" class="${classes.join(' ')}" data-id="${item.id}" aria-label="${escapeHtml(item.name)}${completed ? ', completed' : ''}">
    <span class="activity-icon" aria-hidden="true">${item.icon}</span>
    <span class="activity-name">${escapeHtml(item.name)}</span>
    <span class="tap-hint">${completed ? 'Completed' : item.free ? 'Already yours!' : 'Tap to open'}</span>
  </button>`;
}
