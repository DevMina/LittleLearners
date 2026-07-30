if (!requireProfile()) { /* redirecting to profile picker */ }

const deckKey3 = qparam("deck", "animals");
const srcDeck3 = DECKS[deckKey3] || DECKS.animals;

// Fixed curriculum: 10 rounds at 2 cards, then auto-advance to 10 rounds at 4, then 8, then
// 10 cards. Replaces the old performance-based auto-adjust with a simple, predictable ramp.
const STAGES = [2, 4, 8, 10];
const ROUNDS_PER_STAGE = 10;

const board = document.getElementById("board");
const prompt = document.getElementById("prompt");
const scoreEl = document.getElementById("scoreCount");
const roundEl = document.getElementById("roundCount");
const roundTotalEl = document.getElementById("roundTotal");
const stageLabel = document.getElementById("stageLabel");
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
let target = null;
let options = [];
let lock = false;
let missesThisRound = 0;
let lastTargetId = null;

// autoMode = true: run the full 4-stage ramp (2 → 4 → 8 → 10), 10 rounds each, 40 total.
// autoMode = false: parent locked a single card count — play 10 rounds at just that level.
let autoMode = true;
let stageIndex = 0;
let numOptions = STAGES[0];
let roundInStage = 1;
let overallRound = 1;

function totalRoundsForRun() {
  return autoMode ? STAGES.length * ROUNDS_PER_STAGE : ROUNDS_PER_STAGE;
}

function updateStageLabel() {
  stageLabel.textContent = autoMode
    ? "Level " + (stageIndex + 1) + " of " + STAGES.length + " — " + numOptions + " cards"
    : numOptions + " cards";
}

function refreshBoardClass() {
  board.className = "game-board find-grid opts-" + numOptions;
}

function highlightDiffButtons() {
  [...diffRow.querySelectorAll(".diff-btn[data-n]")].forEach((b) => {
    b.classList.toggle("active", !autoMode && parseInt(b.dataset.n, 10) === numOptions);
  });
  diffRow.querySelector(".diff-auto").classList.toggle("active", autoMode);
}

function startAutoMode() {
  autoMode = true;
  stageIndex = 0;
  numOptions = STAGES[0];
  resetRun();
}

function setDifficulty(n) {
  autoMode = false;
  numOptions = n;
  resetRun();
}

function resetRun() {
  roundInStage = 1;
  overallRound = 1;
  score = 0;
  scoreEl.textContent = 0;
  roundTotalEl.textContent = totalRoundsForRun();
  refreshBoardClass();
  highlightDiffButtons();
  updateStageLabel();
  newRound();
}

diffRow.querySelectorAll(".diff-btn[data-n]").forEach((b) => b.addEventListener("click", () => setDifficulty(parseInt(b.dataset.n, 10))));
diffRow.querySelector(".diff-auto").addEventListener("click", startAutoMode);

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
  roundEl.textContent = overallRound;
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
    setTimeout(() => advance(), 700);
  } else {
    missesThisRound++;
    playTone("wrong");
    btn.classList.add("wrong");
    speak("Try again!");
    setTimeout(() => btn.classList.remove("wrong"), 400);
  }
}

// Moves to the next round, advancing to the next stage (more cards) once the current stage's
// rounds are done — or finishing the whole run once every stage is complete.
function advance() {
  if (roundInStage >= ROUNDS_PER_STAGE) {
    if (autoMode && stageIndex < STAGES.length - 1) {
      stageIndex++;
      numOptions = STAGES[stageIndex];
      roundInStage = 1;
      overallRound++;
      refreshBoardClass();
      highlightDiffButtons();
      updateStageLabel();
      newRound();
    } else {
      finish();
    }
  } else {
    roundInStage++;
    overallRound++;
    newRound();
  }
}

function finish() {
  const total = totalRoundsForRun();
  winBanner.style.display = "flex";
  document.getElementById("winStats").textContent = "You scored " + score + " out of " + total + "!";
  playTone("win");
  confettiBurst(confettiHost);
  speak("All done! You scored " + score + " out of " + total);
  const fraction = score / total;
  const quality = fraction >= 0.85 ? 3 : fraction >= 0.6 ? 2 : 1;
  recordGameResult("find", deckKey3, true, quality);
}

document.getElementById("repeatBtn").addEventListener("click", () => speak("Find the " + target.label));
document.getElementById("playAgainBtn").addEventListener("click", () => {
  winBanner.style.display = "none";
  if (autoMode) startAutoMode();
  else resetRun();
});

resetRun();
initSessionTimer();
