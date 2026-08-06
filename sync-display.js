function syncEnabled() { return /^https:\/\//i.test(String(CONFIG.firebaseDatabaseUrl || '').trim()); }
function dbUrl(path) { return `${String(CONFIG.firebaseDatabaseUrl).replace(/\/$/,'')}/events/${encodeURIComponent(CONFIG.eventId)}/${path}.json`; }
async function dbRequest(path, options = {}) {
  if (!syncEnabled()) return null;
  try {
    const response = await fetch(dbUrl(path), Object.assign({ headers: {'Content-Type':'application/json'} }, options));
    if (!response.ok) throw new Error(`Database request failed: ${response.status}`);
    return await response.json();
  } catch (error) { console.warn(error); return null; }
}

async function recordSession() {
  const payload = {
    nickname: state.displayName, mode: state.mode, createdAt: {'.sv':'timestamp'},
    lastSeen: {'.sv':'timestamp'}, completedCount: Math.max(0,state.completed.length-1)
  };
  addLocalEvent('session', payload, state.sessionId);
  await dbRequest(`sessions/${encodeURIComponent(state.sessionId)}`, {method:'PUT', body:JSON.stringify(payload)});
}
async function recordChallenge(activityId) {
  const payload = {sessionId:state.sessionId, activityId, mode:state.mode, timestamp:{'.sv':'timestamp'}};
  addLocalEvent('challenge', Object.assign({}, payload, {timestamp:Date.now()}));
  await dbRequest('challengeEvents', {method:'POST', body:JSON.stringify(payload)});
  if (syncEnabled()) await dbRequest(`sessions/${encodeURIComponent(state.sessionId)}`, {method:'PATCH', body:JSON.stringify({lastSeen:{'.sv':'timestamp'},completedCount:Math.max(0,state.completed.length-1)})});
}
async function recordWin(bingoCount) {
  const payload = {sessionId:state.sessionId,nickname:state.displayName,mode:state.mode,bingoCount,timestamp:{'.sv':'timestamp'}};
  addLocalEvent('win', Object.assign({}, payload, {timestamp:Date.now()}));
  await dbRequest('wins', {method:'POST',body:JSON.stringify(payload)});
}

function addLocalEvent(type, payload, id = uid()) {
  try {
    const events = JSON.parse(localStorage.getItem(LOCAL_EVENTS_KEY) || '{"sessions":{},"challenges":[],"wins":[]}');
    if (type === 'session') events.sessions[id] = payload;
    if (type === 'challenge') events.challenges.push(Object.assign({id}, payload));
    if (type === 'win') events.wins.push(Object.assign({id}, payload));
    events.challenges = events.challenges.slice(-500); events.wins = events.wins.slice(-100);
    localStorage.setItem(LOCAL_EVENTS_KEY, JSON.stringify(events));
  } catch { /* local display stats are optional */ }
}

function renderDisplay() {
  document.body.innerHTML = `<main class="display-page">
    <section class="display-brand">
      <img class="display-logo" src="assets/inclusive-health-logo.png?v=20260806-8" alt="Inclusive Health">
      <p>Scan to join</p>
      <h1>Big Day of Play<br>Fitness Bingo</h1>
      <div class="qr-wrap"><img src="assets/play-qr.svg?v=20260806-5" alt="QR code to open the Big Day of Play bingo game"></div>
      <div class="play-url">${escapeHtml(CONFIG.playUrl)}</div>
    </section>
    <section class="display-feed">
      <span class="display-status">${syncEnabled() ? '● LIVE' : '○ DEMO / LOCAL'}</span>
      <h2>Today’s movement celebration</h2>
      <div class="display-stats">
        <div class="display-stat"><b id="display-players">0</b><span>Players</span></div>
        <div class="display-stat"><b id="display-moves">0</b><span>Squares completed</span></div>
        <div class="display-stat"><b id="display-bingos">0</b><span>Bingos</span></div>
      </div>
      <div id="winners-list" class="winners-list"><div class="empty-feed">The next bingo celebration could be yours! 🎉</div></div>
    </section>
    <button class="fullscreen-btn" id="fullscreen-btn" aria-label="Toggle fullscreen">⛶</button>
  </main>`;
  document.getElementById('fullscreen-btn').addEventListener('click', () => document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.());
  refreshDisplay(true);
  displayPoll = setInterval(() => refreshDisplay(false), 4000);
}

async function refreshDisplay(initial) {
  let sessions = {}, challenges = [], wins = [];
  if (syncEnabled()) {
    const [remoteSessions, remoteChallenges, remoteWins] = await Promise.all([dbRequest('sessions'),dbRequest('challengeEvents'),dbRequest('wins')]);
    sessions = remoteSessions || {}; challenges = Object.entries(remoteChallenges || {}).map(([id,v]) => Object.assign({id},v));
    wins = Object.entries(remoteWins || {}).map(([id,v]) => Object.assign({id},v));
  } else {
    try {
      const events = JSON.parse(localStorage.getItem(LOCAL_EVENTS_KEY) || '{}');
      sessions = events.sessions || {}; challenges = events.challenges || []; wins = events.wins || [];
    } catch { /* no local events yet */ }
  }
  wins.sort((a,b) => Number(b.timestamp || 0) - Number(a.timestamp || 0));
  document.getElementById('display-players').textContent = Object.keys(sessions).length;
  document.getElementById('display-moves').textContent = challenges.length;
  document.getElementById('display-bingos').textContent = wins.length;
  const list = document.getElementById('winners-list');
  list.innerHTML = wins.length ? wins.slice(0,7).map((win,index) => `<div class="winner-row"><span class="medal">${index===0?'🏆':'🎉'}</span><div><strong>${escapeHtml(win.nickname || 'Anonymous Player')}</strong><small>${win.mode === 'challenge' ? 'Challenge Bingo' : 'Family Fitness Bingo'} · Bingo ${Number(win.bingoCount || 1)}</small></div></div>`).join('') : '<div class="empty-feed">The next bingo celebration could be yours! 🎉</div>';
  const unseen = wins.filter(win => win.id && !knownRemoteWins.has(win.id));
  wins.forEach(win => win.id && knownRemoteWins.add(win.id));
  if (!initial && unseen.length) showDisplayCelebration(unseen[0]);
}

function showDisplayCelebration(win) {
  launchConfetti(320); celebrationSound();
  const overlay = document.createElement('div'); overlay.className = 'display-celebration';
  overlay.innerHTML = `<div class="display-celebration-card"><div class="big">🎉</div><h2>BINGO!</h2><p>${escapeHtml(win.nickname || 'Anonymous Player')} completed a bingo!</p></div>`;
  document.body.appendChild(overlay); setTimeout(() => overlay.remove(), 6500);
}

window.addEventListener('beforeunload', () => { clearTimer(); if (displayPoll) clearInterval(displayPoll); });
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('./sw.js').catch(() => {});

const params = new URLSearchParams(location.search);
if (params.get('display') === '1') renderDisplay(); else if (state.started) renderGame(); else renderWelcome();
