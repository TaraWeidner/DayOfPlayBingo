function openChallenge(id) {
  const item = cardActivities().find(a => a.id === id);
  if (!item) return;
  clearTimer();
  activeActivityId = id;
  activeTimerRemaining = item.seconds || 0;
  const completed = state.completed.includes(id);
  const modal = document.createElement('div');
  modal.className = 'modal-backdrop';
  modal.id = 'challenge-modal';
  modal.innerHTML = `<section class="modal" role="dialog" aria-modal="true" aria-labelledby="challenge-title">
    <div class="modal-handle"></div>
    <button class="modal-close" type="button" aria-label="Close challenge">×</button>
    <div class="challenge-icon" aria-hidden="true">${item.icon}</div>
    <h2 id="challenge-title">${escapeHtml(item.name)}</h2>
    <p class="challenge-instruction">${escapeHtml(item.instruction)}</p>
    ${state.showMods ? `<div class="modification"><strong>Make it work for you</strong>${escapeHtml(item.modification)}</div>` : `<button class="ghost-btn show-mod-btn" type="button">Show a modification</button><div class="modification hidden"><strong>Make it work for you</strong>${escapeHtml(item.modification)}</div>`}
    ${item.seconds ? timerMarkup(item.seconds) : `<div class="timer-box"><span class="timer-readout">${item.reps || '✓'}</span><strong>${item.reps ? 'repetitions' : 'Complete at your pace'}</strong></div>`}
    <div class="modal-actions">
      ${completed ? '<div class="completed-message">✓ You completed this square!</div><button class="secondary-btn undo-btn" type="button">Undo completion</button>' : '<button class="primary-btn complete-btn" type="button">I completed it! ✓</button>'}
      <button class="ghost-btn close-secondary" type="button">Back to my card</button>
    </div>
  </section>`;
  document.body.appendChild(modal);
  modal.querySelector('.modal-close').addEventListener('click', closeChallenge);
  modal.querySelector('.close-secondary').addEventListener('click', closeChallenge);
  modal.addEventListener('click', event => { if (event.target === modal) closeChallenge(); });
  modal.querySelector('.show-mod-btn')?.addEventListener('click', event => {
    event.currentTarget.classList.add('hidden');
    modal.querySelector('.modification').classList.remove('hidden');
  });
  modal.querySelector('.complete-btn')?.addEventListener('click', () => completeActivity(item.id));
  modal.querySelector('.undo-btn')?.addEventListener('click', () => undoActivity(item.id));
  if (item.seconds) bindTimerControls(item.seconds);
}

function timerMarkup(seconds) {
  return `<div class="timer-box">
    <span class="timer-readout" id="timer-readout">${formatTime(seconds)}</span>
    <div class="timer-actions">
      <button class="secondary-btn" id="timer-start" type="button">Start timer</button>
      <button class="ghost-btn" id="timer-reset" type="button">Reset</button>
    </div>
  </div>`;
}

function bindTimerControls(seconds) {
  document.getElementById('timer-start').addEventListener('click', event => {
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null; event.currentTarget.textContent = 'Resume'; return; }
    if (activeTimerRemaining <= 0) activeTimerRemaining = seconds;
    event.currentTarget.textContent = 'Pause';
    timerInterval = setInterval(() => {
      activeTimerRemaining -= 1;
      updateTimerReadout();
      if (activeTimerRemaining <= 0) {
        clearTimer(false);
        event.currentTarget.textContent = 'Done!';
        event.currentTarget.disabled = true;
        gentleTone();
        navigator.vibrate?.([100,60,100]);
      }
    }, 1000);
  });
  document.getElementById('timer-reset').addEventListener('click', () => {
    clearTimer(false); activeTimerRemaining = seconds; updateTimerReadout();
    const start = document.getElementById('timer-start'); start.disabled = false; start.textContent = 'Start timer';
  });
}

function updateTimerReadout() {
  const element = document.getElementById('timer-readout');
  if (element) element.textContent = formatTime(Math.max(0, activeTimerRemaining));
}
function formatTime(seconds) { return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2,'0')}`; }
function clearTimer(reset = true) { if (timerInterval) clearInterval(timerInterval); timerInterval = null; if (reset) activeTimerRemaining = 0; }
function closeChallenge() { clearTimer(); document.getElementById('challenge-modal')?.remove(); activeActivityId = null; }

function completeActivity(id) {
  if (!state.completed.includes(id)) state.completed.push(id);
  const before = new Set(state.wonLines);
  const allWon = calculateWonLines();
  const newLines = allWon.filter(index => !before.has(index));
  state.wonLines = allWon;
  saveState();
  closeChallenge();
  recordChallenge(id);
  if (newLines.length) {
    recordWin(allWon.length);
    const highlight = [...new Set(newLines.flatMap(lineIndex => LINES[lineIndex]))];
    renderGame(highlight);
    setTimeout(() => showCelebration(allWon.length, state.completed.length === 25), 180);
  } else {
    renderGame();
    showToast('Square completed! Keep moving ✨');
    gentleTone();
  }
}

function undoActivity(id) {
  if (id === 'free') return;
  state.completed = state.completed.filter(item => item !== id);
  state.wonLines = calculateWonLines();
  saveState();
  closeChallenge();
  renderGame();
  showToast('Square reopened.');
}

function calculateWonLines() {
  const completed = new Set(state.completed);
  const card = cardActivities();
  return LINES.map((line, index) => line.every(position => completed.has(card[position]?.id)) ? index : -1).filter(index => index >= 0);
}

function showCelebration(bingoCount, blackout) {
  launchConfetti(220);
  celebrationSound();
  navigator.vibrate?.([140,70,140,70,260]);
  const overlay = document.createElement('div');
  overlay.className = 'celebration';
  overlay.innerHTML = `<section class="celebration-card" role="dialog" aria-modal="true">
    <span class="celebration-emoji">${blackout ? '🏆' : '🎉'}</span>
    <h2>${blackout ? 'FULL CARD!' : 'BINGO!'}</h2>
    <p>${blackout ? `Incredible work, ${escapeHtml(state.nickname)} — you completed every square!` : `${escapeHtml(state.nickname)}, you completed bingo number ${bingoCount}!`}</p>
    <div class="celebration-actions">
      <button class="primary-btn keep-playing" type="button">${blackout ? 'Admire my winning card' : 'Keep playing for another bingo'}</button>
      <button class="ghost-btn show-card" type="button">Show my winning card</button>
    </div>
  </section>`;
  document.body.appendChild(overlay);
  overlay.querySelector('.keep-playing').addEventListener('click', () => { overlay.remove(); renderGame(); });
  overlay.querySelector('.show-card').addEventListener('click', () => { overlay.remove(); renderGame(); window.scrollTo({top:0,behavior:'smooth'}); });
}

function openMenu() {
  clearTimer();
  const modal = document.createElement('div');
  modal.className = 'modal-backdrop';
  modal.id = 'game-menu';
  modal.innerHTML = `<section class="modal" role="dialog" aria-modal="true" aria-labelledby="menu-title">
    <div class="modal-handle"></div><button class="modal-close" type="button" aria-label="Close menu">×</button>
    <h2 id="menu-title">Game menu</h2>
    <p class="challenge-instruction">Your progress is saved on this phone.</p>
    <div class="modal-actions">
      <button class="secondary-btn sound-toggle" type="button">${state.sound ? '🔊 Turn sounds off' : '🔇 Turn sounds on'}</button>
      <button class="secondary-btn mods-toggle" type="button">${state.showMods ? 'Hide modifications by default' : 'Show modifications by default'}</button>
      <button class="ghost-btn welcome-btn" type="button">Back to welcome screen</button>
      <button class="danger-btn reset-btn" type="button">Start a brand-new card</button>
    </div>
  </section>`;
  document.body.appendChild(modal);
  const close = () => modal.remove();
  modal.querySelector('.modal-close').addEventListener('click', close);
  modal.addEventListener('click', event => { if (event.target === modal) close(); });
  modal.querySelector('.sound-toggle').addEventListener('click', () => { state.sound = !state.sound; saveState(); close(); openMenu(); });
  modal.querySelector('.mods-toggle').addEventListener('click', () => { state.showMods = !state.showMods; saveState(); close(); openMenu(); });
  modal.querySelector('.welcome-btn').addEventListener('click', () => { close(); renderWelcome(); });
  modal.querySelector('.reset-btn').addEventListener('click', () => {
    if (confirm('Start a new card? Your current completed squares will be cleared.')) {
      const keep = { nickname: state.nickname, mode: state.mode, showMods: state.showMods, sound: state.sound, privateWin: state.privateWin };
      state = Object.assign(defaultState(), keep); saveState(); close(); renderWelcome();
    }
  });
}
