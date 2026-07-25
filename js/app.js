// ---------- Shared utilities ----------

// Speak a word aloud using the Web Speech API, tuned for a friendly, slow, clear voice.
// Honors the parent-configured voice/rate/volume in settings.
function speak(text) {
  try {
    if (!("speechSynthesis" in window)) return;
    const s = typeof getSettings === "function" ? getSettings() : DEFAULT_SETTINGS;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = s.rate || 0.85;
    u.pitch = 1.15;
    u.volume = s.volume ?? 1;
    if (s.voiceName) {
      const v = window.speechSynthesis.getVoices().find((x) => x.name === s.voiceName);
      if (v) u.voice = v;
    }
    window.speechSynthesis.speak(u);
  } catch (e) {
    /* speech not available, fail silently */
  }
}

// ---------- Sound effects (generated tones, no audio assets needed) ----------
let _actx = null;
function _audioCtx() {
  if (!_actx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) _actx = new AC();
  }
  return _actx;
}

function playTone(kind) {
  const s = typeof getSettings === "function" ? getSettings() : DEFAULT_SETTINGS;
  if (!s.sfx) return;
  const ctx = _audioCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  const notes = {
    correct: [523.25, 659.25, 783.99],   // C5 E5 G5 - happy little arpeggio
    wrong: [220, 196],                   // gentle low blip, not harsh
    win: [523.25, 659.25, 783.99, 1046.5], // C5 E5 G5 C6
    tap: [660],
  }[kind] || [440];

  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    const start = now + i * 0.11;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.18 * (s.volume ?? 1), start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.28);
    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + 0.3);
  });
}

// ---------- Session timer ----------
// Shows a friendly "time's up" overlay after the parent-configured number of minutes.
function initSessionTimer() {
  const s = getSettings();
  if (!s.sessionMinutes || s.sessionMinutes <= 0) return;
  setTimeout(() => {
    const overlay = document.createElement("div");
    overlay.className = "win-banner";
    overlay.innerHTML = `
      <div class="win-card">
        <h2>⏰ Time's up!</h2>
        <p>Great playing! Time to take a break.</p>
        <button class="play-again-btn" onclick="location.href='index.html'">Back to home</button>
      </div>`;
    document.body.appendChild(overlay);
    speak("Time's up! Great playing.");
  }, s.sessionMinutes * 60 * 1000);
}

// Bounce the mascot to celebrate or greet
function mascotBounce(el, mood) {
  if (!el) return;
  el.classList.remove("mascot-bounce", "mascot-cheer");
  void el.offsetWidth; // restart animation
  el.classList.add(mood === "cheer" ? "mascot-cheer" : "mascot-bounce");
}

// Lightweight confetti burst using DOM nodes (no external libraries)
function confettiBurst(container) {
  const colors = ["#FF6B6B", "#FFD93D", "#6BCB77", "#5FC9F3", "#9B72CF", "#FF9F45"];
  for (let i = 0; i < 28; i++) {
    const p = document.createElement("span");
    p.className = "confetti-piece";
    p.style.left = 50 + (Math.random() * 60 - 30) + "%";
    p.style.background = colors[i % colors.length];
    p.style.setProperty("--dx", (Math.random() * 200 - 100) + "px");
    p.style.setProperty("--rot", Math.random() * 720 - 360 + "deg");
    p.style.animationDelay = Math.random() * 0.15 + "s";
    container.appendChild(p);
    setTimeout(() => p.remove(), 1400);
  }
}

// Fisher-Yates shuffle
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Read a query param from the current URL
function qparam(name, fallback) {
  const v = new URLSearchParams(window.location.search).get(name);
  return v || fallback;
}
