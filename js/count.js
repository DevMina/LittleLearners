if (!requireProfile()) { /* redirecting to profile picker */ }

// Fixed to the Numbers deck — this game is specifically about connecting a counted
// quantity to its numeral, not a general "find the card" game, so there's no deck picker.
const numbersDeck = DECKS.numbers;

// Fun, varied objects to count — deliberately separate from any one deck's items so
// rounds stay visually fresh regardless of which flashcard decks a parent has enabled.
const COUNT_GLYPHS = ["🐟", "🍎", "⭐", "🎈", "🍪", "🚗", "🐰", "🌸", "🐝", "🍇"];

// Fixed curriculum, same shape as Find It!: 5 rounds counting up to 3, then 5 rounds up to
// 5, then 5 rounds up to 10 — or a parent can lock a single max count instead.
const STAGES = [3, 5, 10];
const ROUNDS_PER_STAGE = 5;

const board = document.getElementById("board");
const prompt = document.getElementById("prompt");
const countReadout = document.getElementById("countReadout");
const scoreEl = document.getElementById("scoreCount");
const roundEl = document.getElementById("roundCount");
const roundTotalEl = document.getElementById("roundTotal");
const stageLabel = document.getElementById("stageLabel");
const winBanner = document.getElementById("winBanner");
const confettiHost = document.getElementById("confettiHost");
const diffRow = document.getElementById("difficultyRow");

let score = 0;
let target = null;      // the numbers-deck item this round's count should match
let glyph = "🐟";
let phase = "count";     // "count" -> tap-and-count, "choose" -> pick the numeral
let taps = 0;
let choiceLock = false;
let missesThisRound = 0;
let lastTargetId = null;

let autoMode = true;
let stageIndex = 0;
let maxCount = STAGES[0];
let roundInStage = 1;
let overallRound = 1;

function totalRoundsForRun() {
  return autoMode ? STAGES.length * ROUNDS_PER_STAGE : ROUNDS_PER_STAGE;
}

function updateStageLabel() {
  stageLabel.textContent = autoMode
    ? "Level " + (stageIndex + 1) + " of " + STAGES.length + " — counting up to " + maxCount
    : "Counting up to " + maxCount;
}

function highlightDiffButtons() {
  [...diffRow.querySelectorAll(".diff-btn[data-n]")].forEach((b) => {
    b.classList.toggle("active", !autoMode && parseInt(b.dataset.n, 10) === maxCount);
  });
  diffRow.querySelector(".diff-auto").classList.toggle("active", autoMode);
}

function startAutoMode() {
  autoMode = true;
  stageIndex = 0;
  maxCount = STAGES[0];
  resetRun();
}

function setDifficulty(n) {
  autoMode = false;
  maxCount = n;
  resetRun();
}

function resetRun() {
  roundInStage = 1;
  overallRound = 1;
  score = 0;
  scoreEl.textContent = 0;
  roundTotalEl.textContent = totalRoundsForRun();
  highlightDiffButtons();
  updateStageLabel();
  newRound();
}

diffRow.querySelectorAll(".diff-btn[data-n]").forEach((b) => b.addEventListener("click", () => setDifficulty(parseInt(b.dataset.n, 10))));
diffRow.querySelector(".diff-auto").addEventListener("click", startAutoMode);

function eligibleNumbers() {
  return numbersDeck.items.filter((it) => it.dots <= maxCount);
}

function newRound() {
  phase = "count";
  taps = 0;
  choiceLock = false;
  missesThisRound = 0;
  glyph = COUNT_GLYPHS[Math.floor(Math.random() * COUNT_GLYPHS.length)];

  const pool = eligibleNumbers();
  target = pool[Math.floor(Math.random() * pool.length)];
  if (target.id === lastTargetId && pool.length > 1) {
    target = pool[Math.floor(Math.random() * pool.length)];
  }
  lastTargetId = target.id;

  roundEl.textContent = overallRound;
  prompt.textContent = "Tap each one and count!";
  countReadout.style.display = "block";
  countReadout.textContent = "0";
  renderCountPhase();
  setTimeout(() => speak("Let's count!"), 250);
}

function renderCountPhase() {
  board.className = "game-board count-board";
  board.innerHTML = "";
  for (let i = 0; i < target.dots; i++) {
    const btn = document.createElement("button");
    btn.className = "game-tile count-tile";
    btn.setAttribute("aria-label", glyph);
    btn.textContent = glyph;
    btn.addEventListener("click", () => tapObject(btn));
    board.appendChild(btn);
  }
}

function tapObject(btn) {
  if (phase !== "count" || btn.classList.contains("matched")) return;
  btn.classList.add("matched");
  taps++;
  countReadout.textContent = taps;
  playTone("correct");
  speak(String(taps));
  if (taps >= target.dots) {
    setTimeout(() => {
      speak("Great! You counted " + target.dots + "!");
      setTimeout(startChoosePhase, 1300);
    }, 500);
  }
}

function startChoosePhase() {
  phase = "choose";
  countReadout.style.display = "none";
  prompt.textContent = "How many did we count?";

  const pool = eligibleNumbers();
  const n = Math.min(4, pool.length);
  let options = shuffle(pool.filter((it) => it.id !== target.id)).slice(0, Math.max(0, n - 1));
  options.push(target);
  options = shuffle(options);

  board.className = "game-board find-grid opts-" + Math.max(2, options.length);
  board.innerHTML = "";
  options.forEach((item) => {
    const btn = document.createElement("button");
    btn.className = "game-tile find-tile";
    btn.setAttribute("aria-label", item.label);
    btn.textContent = item.label;
    btn.addEventListener("click", () => chooseNumeral(item, btn));
    board.appendChild(btn);
  });

  setTimeout(() => speak("How many did we count?"), 250);
}

function chooseNumeral(item, btn) {
  if (choiceLock) return;
  if (item.id === target.id) {
    choiceLock = true;
    score++;
    scoreEl.textContent = score;
    playTone("correct");
    speak("Yes! That's " + item.label + "!");
    btn.style.background = "#6BCB77";
    recordItemResult("numbers", item.id, missesThisRound === 0);
    setTimeout(() => advance(), 800);
  } else {
    missesThisRound++;
    playTone("wrong");
    btn.classList.add("wrong");
    speak("Try again!");
    setTimeout(() => btn.classList.remove("wrong"), 400);
  }
}

function advance() {
  if (roundInStage >= ROUNDS_PER_STAGE) {
    if (autoMode && stageIndex < STAGES.length - 1) {
      stageIndex++;
      maxCount = STAGES[stageIndex];
      roundInStage = 1;
      overallRound++;
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
  recordGameResult("count", "numbers", true, quality);
}

document.getElementById("repeatBtn").addEventListener("click", () => {
  if (phase === "count") speak("Let's count!");
  else speak("How many did we count?");
});
document.getElementById("playAgainBtn").addEventListener("click", () => {
  winBanner.style.display = "none";
  if (autoMode) startAutoMode();
  else resetRun();
});

resetRun();
initSessionTimer();
