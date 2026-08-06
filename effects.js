function rainbow(word) { return [...word].map(letter => `<span>${letter}</span>`).join(''); }
function escapeHtml(value) { return String(value ?? '').replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char])); }

function showToast(message) {
  const toast = document.createElement('div'); toast.className = 'toast'; toast.textContent = message; TOASTS.appendChild(toast);
  setTimeout(() => toast.remove(), 2800);
}

function gentleTone() {
  if (!state.sound) return;
  playNotes([523.25,659.25], .11);
}
function celebrationSound() {
  if (!state.sound) return;
  playNotes([523.25,659.25,783.99,1046.5], .14);
}
function playNotes(notes, length) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    notes.forEach((frequency, index) => {
      const oscillator = ctx.createOscillator(); const gain = ctx.createGain();
      oscillator.type = 'sine'; oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(.0001, ctx.currentTime + index * length);
      gain.gain.exponentialRampToValueAtTime(.16, ctx.currentTime + index * length + .02);
      gain.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime + index * length + length);
      oscillator.connect(gain).connect(ctx.destination);
      oscillator.start(ctx.currentTime + index * length); oscillator.stop(ctx.currentTime + index * length + length + .03);
    });
    setTimeout(() => ctx.close(), notes.length * length * 1000 + 300);
  } catch { /* Audio is a bonus. */ }
}

function launchConfetti(count = 160) {
  const ctx = CONFETTI.getContext('2d');
  const ratio = window.devicePixelRatio || 1;
  CONFETTI.width = innerWidth * ratio; CONFETTI.height = innerHeight * ratio;
  CONFETTI.style.width = `${innerWidth}px`; CONFETTI.style.height = `${innerHeight}px`;
  ctx.scale(ratio, ratio);
  const colors = ['#ef476f','#ff8c1a','#ffd447','#4da816','#087fce','#7d3fb2','#ec3d93'];
  const pieces = Array.from({length: count}, () => ({
    x: Math.random() * innerWidth, y: -20 - Math.random() * innerHeight * .25,
    vx: (Math.random() - .5) * 5, vy: 2 + Math.random() * 5, size: 5 + Math.random() * 8,
    spin: Math.random() * Math.PI, speed: (Math.random() - .5) * .28, color: colors[Math.floor(Math.random()*colors.length)]
  }));
  const start = performance.now();
  function frame(now) {
    ctx.clearRect(0,0,innerWidth,innerHeight);
    pieces.forEach(piece => {
      piece.x += piece.vx; piece.y += piece.vy; piece.vy += .035; piece.spin += piece.speed;
      ctx.save(); ctx.translate(piece.x,piece.y); ctx.rotate(piece.spin); ctx.fillStyle = piece.color;
      ctx.fillRect(-piece.size/2,-piece.size/3,piece.size,piece.size*.65); ctx.restore();
    });
    if (now - start < 4200) requestAnimationFrame(frame); else ctx.clearRect(0,0,innerWidth,innerHeight);
  }
  requestAnimationFrame(frame);
}
