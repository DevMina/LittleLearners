if (!requireProfile()) { /* redirecting to profile picker */ }

const deckKey3 = qparam("deck", "animals");
const srcDeck3 = DECKS[deckKey3] || DECKS.animals;
const TOTAL_ROUNDS = 8;

const board = document.getElementById("board");
const prompt = document.getElementById("prompt");
const scoreEl = document.getElementById("scoreCount");
const roundEl = document.getElementById("roundCount");
const winBanner = document.getElementById("winBanner");
const confettiHost = document.getElementById("confettiHost");
const diffRow = document.getElementById("difficultyRow");
const deckCurrentBtn = document.getElementById("deckCurrentBtn");
const deckCurrentLabel = document.getElementById("deckCurrentLabel");
const deckCurrentDot = document.getElementById("deckCurrentDot");
const deckChangeBtn = document.getElementById("deckChangeBtn");
const deckModalOverlay = document.getElementById("deckModalOverlay");
const deckModalCloseBtn = document.getElementById("deckModalCloseBtn");
const deckGrid = document.getElementById("deckGrid");

deckCurrentLabel.textContent = srcDeck3.title;
deckCurrentDot.style.background = "var(--" + srcDeck3.color + ")";

Object.keys(DECKS).forEach((key) => {
  const tile = document.createElement("button");
  tile.className = "deck-tile " + DECKS[key].color + (key === deckKey3 ? " active" : "");
  tile.textContent = DECKS[key].title;
  tile.addEventListener("click", () => (location.href = "game-find.html?deck=" + key));
  deckGrid.appendChild(tile);
});

function openDeckModal() { deckModalOverlay.style.display = "flex"; }
function closeDeckModal() { deckModalOverlay.style.display = "none"; }

deckCurrentBtn.addEventListener("click", openDeckModal);
deckChangeBtn.addEventListener("click", openDeckModal);
deckModalCloseBtn.addEventListener("click", closeDeckModal);
deckModalOverlay.addEventListener("click", (e) => {
  if (e.target === deckModalOverlay) closeDeckModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeDeckModal();
});

let score = 0;
let round = 1;
let target = null;
let options = [];
let lock = false;
let numOptions = parseInt(localStorage.getItem("ll_find_difficulty") || "4", 10);
let missesThisRound = 0;
let recentMisses = []; // rolling window of misses-per-round, used for auto difficulty
let autoMode = true;
let lastTargetId = null;

function setDifficulty(n, fromAuto) {
  numOptions = n;
  localStorage.setItem("ll_find_difficulty", String(n));
  if (!fromAuto) { autoMode = false; recentMisses = []; }
  [...diffRow.querySelectorAll(".diff-btn")].forEach((b) => b.classList.toggle("active", parseInt(b.dataset.n, 10) === n));
  board.className = "game-board find-grid opts-" + n;
  round = 1;
  score = 0;
  scoreEl.textContent = 0;
  newRound();
}

function maybeAdjustDifficulty() {
  if (!autoMode) return;
  recentMisses.push(missesThisRound);
  if (recentMisses.length > 3) recentMisses.shift();
  if (recentMisses.length < 3) return;
  const avg = recentMisses.reduce((a, b) => a + b, 0) / recentMisses.length;
  if (avg <= 0.2 && numOptions < 6) {
    recentMisses = [];
    setDifficulty(numOptions + 2, true);
  } else if (avg >= 1.5 && numOptions > 2) {
    recentMisses = [];
    setDifficulty(numOptions - 2, true);
  }
}

diffRow.querySelectorAll(".diff-btn").forEach((b) => b.addEventListener("click", () => setDifficulty(parseInt(b.dataset.n, 10), false)));

function newRound() {
  lock = false;
  missesThisRound = 0;
  const n = Math.min(numOptions, srcDeck3.items.length);
  options = shuffle(srcDeck3.items).slice(0, n);
  target = options[Math.floor(Math.random() * options.length)];
  // avoid repeating the exact same target two rounds in a row (when the deck has more items to draw from)
  if (target.id === lastTargetId && srcDeck3.items.length > n) {
    options = shuffle(srcDeck3.items).slice(0, n);
    target = options[Math.floor(Math.random() * options.length)];
  }
  lastTargetId = target.id;
  roundEl.textContent = round;
  prompt.textContent = "Find the " + target.label;
  render();
  setTimeout(() => speak("Find the " + target.label), 250);
}

// Shapes deck items only carry a shape name (e.g. "circle"), no emoji/swatch — map that
// to a glyph so this game shows an actual shape instead of falling back to the word.
const SHAPE_GLYPHS = { circle: "⚫", square: "◼️", triangle: "▲", star: "⭐", heart: "❤️", diamond: "🔶" };

function render() {
  board.innerHTML = "";
  options.forEach((item) => {
    const btn = document.createElement("button");
    btn.className = "game-tile find-tile";
    btn.setAttribute("aria-label", item.label);
    if (item.emoji) btn.textContent = item.emoji;
    else if (item.shape) btn.textContent = SHAPE_GLYPHS[item.shape] || "●";
    else if (item.dots) renderMiniDots(btn, item);
    else if (item.swatch) btn.style.background = item.swatch;
    else btn.textContent = item.label;
    btn.addEventListener("click", () => choose(item, btn));
    board.appendChild(btn);
  });
}

function choose(item, btn) {
  if (lock) return;
  if (item.id === target.id) {
    lock = true;
    score++;
    scoreEl.textContent = score;
    playTone("correct");
    speak("Yes! " + item.label);
    btn.style.background = "#6BCB77";
    // First correct tap this round (no misses yet) = solid recall of this item.
    recordItemResult(deckKey3, item.id, missesThisRound === 0);
    setTimeout(() => {
      maybeAdjustDifficulty();
      if (round >= TOTAL_ROUNDS) {
        finish();
      } else {
        round++;
        newRound();
      }
    }, 700);
  } else {
    missesThisRound++;
    playTone("wrong");
    btn.classList.add("wrong");
    speak("Try again!");
    setTimeout(() => btn.classList.remove("wrong"), 400);
  }
}

function finish() {
  winBanner.style.display = "flex";
  document.getElementById("winStats").textContent = "You scored " + score + " out of " + TOTAL_ROUNDS + "!";
  playTone("win");
  confettiBurst(confettiHost);
  speak("All done! You scored " + score + " out of " + TOTAL_ROUNDS);
  const quality = score >= 7 ? 3 : score >= 5 ? 2 : 1;
  recordGameResult("find", deckKey3, true, quality);
}

document.getElementById("repeatBtn").addEventListener("click", () => speak("Find the " + target.label));
document.getElementById("playAgainBtn").addEventListener("click", () => {
  score = 0;
  round = 1;
  scoreEl.textContent = 0;
  winBanner.style.display = "none";
  newRound();
});

setDifficulty(numOptions, true);
initSessionTimer();
