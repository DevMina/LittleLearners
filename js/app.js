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

// ---------- "Today's session" home-screen shortcut ----------
// Picks one deck + one game so a parent can tap a single button instead of choosing every
// time. Prefers a deck that has a weak item (ties this into the mastery/review system);
// otherwise falls back to whichever enabled deck has been played least. The game type
// rotates daily for variety, and is stable across taps on the same day.
function pickTodaysSession() {
  const settings = getSettings();
  const enabledDecks = settings.enabledDecks && settings.enabledDecks.length ? settings.enabledDecks : Object.keys(DECKS);

  let deckKey;
  const weak = typeof getWeakItems === "function" ? getWeakItems(enabledDecks, 1) : [];
  if (weak.length > 0) {
    deckKey = weak[0].deckKey;
  } else {
    const progress = getProgress();
    const totals = {};
    enabledDecks.forEach((k) => (totals[k] = 0));
    Object.entries(progress.games || {}).forEach(([key, g]) => {
      const dk = key.split(":")[1];
      if (dk in totals) totals[dk] += g.plays;
    });
    const minPlays = Math.min(...enabledDecks.map((k) => totals[k]));
    const leastPlayed = enabledDecks.filter((k) => totals[k] === minPlays);
    deckKey = leastPlayed[Math.floor(Math.random() * leastPlayed.length)];
  }

  const dayIndex = Math.floor(Date.now() / 86400000);
  const rotation = [
    { page: "cards.html", label: "Flashcards" },
    { page: "game-find.html", label: "Find It!" },
    { page: "game-match.html", label: "Memory Match" },
  ];
  const pick = rotation[dayIndex % rotation.length];
  return { url: pick.page + "?deck=" + deckKey, deckKey, gameLabel: pick.label };
}

// ---------- iOS "Add to Home Screen" hint ----------
// Safari never fires beforeinstallprompt, so iPhone/iPad parents never see the normal
// install button. Detect iOS Safari running in the browser (not already installed) and
// show a small, dismissible instruction card instead.
function isIOSSafariBrowserTab() {
  const ua = window.navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
  const isStandalone = window.navigator.standalone === true || window.matchMedia("(display-mode: standalone)").matches;
  return isIOS && !isStandalone;
}

function initIOSInstallHint(cardEl) {
  if (!cardEl) return;
  if (!isIOSSafariBrowserTab()) return;
  if (localStorage.getItem("ll_ios_hint_dismissed")) return;
  cardEl.style.display = "flex";
  const dismissBtn = cardEl.querySelector("[data-ios-hint-dismiss]");
  if (dismissBtn) {
    dismissBtn.addEventListener("click", () => {
      localStorage.setItem("ll_ios_hint_dismissed", "1");
      cardEl.style.display = "none";
    });
  }
}

// ---------- Service worker registration (runs on every page, not just index.html) ----------
function initServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", async () => {
    try {
      const reg = await navigator.serviceWorker.register("service-worker.js");
      // Ask immediately rather than waiting for the browser's own (sometimes hours-delayed)
      // background check — this is what makes a freshly deployed version show up promptly.
      reg.update().catch(() => {});
    } catch (e) {
      /* registration can fail offline, on file://, etc. — safe to ignore */
    }
  });

  // skipWaiting()+clients.claim() hands control to the new worker immediately, but a tab
  // that's already open is still running the OLD html/js/css it loaded into memory — taking
  // control of future requests doesn't retroactively refresh what's already rendered. That
  // used to trigger a silent, unannounced reload, which could yank a mid-game toddler off the
  // screen with zero warning. Show a small toast instead, so a parent can refresh on their own
  // terms — it still auto-refreshes after a short grace period so nobody gets stuck forever.
  let reloadedForUpdate = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (reloadedForUpdate) return;
    reloadedForUpdate = true;
    showUpdateToast();
  });
}
initServiceWorker();

function showUpdateToast() {
  if (document.getElementById("updateToast")) return;
  const toast = document.createElement("div");
  toast.id = "updateToast";
  toast.className = "update-toast";
  toast.innerHTML = '<span>✨ New version ready!</span><button class="update-toast-btn" id="updateToastBtn">Refresh</button>';
  document.body.appendChild(toast);
  document.getElementById("updateToastBtn").addEventListener("click", () => window.location.reload());
  // Grace period so an ignored toast doesn't leave the tab running stale code indefinitely
  setTimeout(() => {
    if (document.getElementById("updateToast")) window.location.reload();
  }, 10000);
}

document.addEventListener("DOMContentLoaded", () => {
  const yearEl = document.getElementById("footerYear");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
});

// ---------- "More below" scroll cue ----------
// A subtle bottom fade + bouncing chevron that appears only when there's more
// page content to scroll to, and disappears once the bottom is reached (or if
// the page never had enough content to scroll in the first place). Runs on
// every page since they all load app.js.
function initScrollCue() {
  const cue = document.createElement("div");
  cue.className = "scroll-cue";
  cue.setAttribute("aria-hidden", "true");
  cue.innerHTML =
    '<span class="scroll-cue-chevron">' +
    '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
    '<path d="M5 9l7 7 7-7" stroke="#1F3A5F" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>' +
    "</svg></span>";
  document.body.appendChild(cue);

  const THRESHOLD = 16; // px of remaining scroll still counted as "at the bottom"
  let ticking = false;

  function measure() {
    ticking = false;
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const atBottom = window.scrollY >= scrollable - THRESHOLD;
    const hasMore = scrollable > THRESHOLD && !atBottom;
    cue.classList.toggle("visible", hasMore);
  }

  function requestMeasure() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(measure);
  }

  requestMeasure();
  window.addEventListener("scroll", requestMeasure, { passive: true });
  window.addEventListener("resize", requestMeasure);
  window.addEventListener("load", requestMeasure);
  // Many pages build their content (tiles, cards, lists) with JS after
  // DOMContentLoaded, which changes page height without firing scroll/resize.
  setTimeout(requestMeasure, 300);
  new MutationObserver(requestMeasure).observe(document.body, { childList: true, subtree: true });
}
document.addEventListener("DOMContentLoaded", initScrollCue);

// ---------- Session timer ----------
// Shows a friendly "time's up" overlay after the parent-configured number of minutes,
// with the option to snooze for 5 more minutes instead of only stopping outright.
function initSessionTimer() {
  const s = getSettings();
  if (!s.sessionMinutes || s.sessionMinutes <= 0) return;

  function scheduleTimeUp(ms) {
    setTimeout(showTimeUpOverlay, ms);
  }

  function showTimeUpOverlay() {
    const overlay = document.createElement("div");
    overlay.className = "win-banner";
    overlay.innerHTML = `
      <div class="win-card">
        <h2>⏰ Time's up!</h2>
        <p>Great playing! Time to take a break.</p>
        <button class="play-again-btn" id="sessionSnoozeBtn">+5 more minutes</button>
        <button class="icon-btn" style="margin-top:10px;" onclick="location.href='index.html'">Back to home</button>
      </div>`;
    document.body.appendChild(overlay);
    speak("Time's up! Great playing.");
    document.getElementById("sessionSnoozeBtn").addEventListener("click", () => {
      overlay.remove();
      scheduleTimeUp(5 * 60 * 1000);
    });
  }

  scheduleTimeUp(s.sessionMinutes * 60 * 1000);
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
  const colors = ["#FF6B6B", "#FFD93D", "#6BCB77", "#FF8FB1", "#9B72CF", "#FF9F45"];
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

// Compact dot-counting view for the Numbers deck inside small game tiles (Memory Match /
// Find It), mirroring the big flashcard's dots. Uses ink navy rather than green/yellow so it
// stays visible against every tile background state (hidden/flipped/matched all differ).
function renderMiniDots(container, item) {
  const wrap = document.createElement("div");
  wrap.className = "mini-dots-wrap";
  const grid = document.createElement("div");
  grid.className = "mini-dots";
  for (let i = 0; i < item.dots; i++) grid.appendChild(document.createElement("span"));
  const label = document.createElement("div");
  label.className = "mini-dots-label";
  label.textContent = item.label;
  wrap.appendChild(grid);
  wrap.appendChild(label);
  container.appendChild(wrap);
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
