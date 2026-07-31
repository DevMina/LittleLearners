if (!requireProfile()) { /* redirecting to profile picker */ }

// Fixed to the Numbers deck, same as Count & Match — but this tests ordinality (what comes
// next) rather than cardinality (how many), so it's a genuinely different skill, not a
// re-skin of Count & Match.
const numbersDeck = DECKS.numbers;

const STAGES = [3, 4, 5];
const ROUNDS_PER_STAGE = 4;

const board = document.getElementById("board");
const prompt = document.getElementById("prompt");
const scoreEl = document.getElementById("scoreCount");
const roundEl = document.getElementById("roundCount");
const roundTotalEl = document.getElementById("roundTotal");
const stageLabel = document.getElementById("stageLabel");
const winBanner = document.getElementById("winBanner");
const confettiHost = document.getElementById("confettiHost");
const diffRow = document.getElementById("difficultyRow");

let score = 0;
let maxCount = STAGES[0];
let nextExpected = 1;
let missesThisRound = 0;
let roundLocked = false;

let autoMode = true;
let stageIndex = 0;
let roundInStage = 1;
let overallRound = 1;

function totalRoundsForRun() {
  return autoMode ? STAGES.length * ROUNDS_PER_STAGE : ROUNDS_PER_STAGE;
}

function updateStageLabel() {
  stageLabel.textContent = autoMode
    ? "Level " + (stageIndex + 1) + " of " + STAGES.length + " — up to " + maxCount
    : "Up to " + maxCount;
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

function newRound() {
  roundLocked = false;
  missesThisRound = 0;
  nextExpected = 1;
  roundEl.textContent = overallRound;
  prompt.textContent = "Tap them from smallest to biggest!";
  render();
  setTimeout(() => speak("Find number 1!"), 250);
}

function render() {
  const items = numbersDeck.items.slice(0, maxCount);
  const order = shuffle(items.slice());
  board.innerHTML = "";
  order.forEach((item) => {
    const btn = document.createElement("button");
    btn.className = "game-tile count-tile order-tile";
    btn.setAttribute("aria-label", item.label);
    btn.textContent = item.label;
    btn.addEventListener("click", () => tapNumber(item, btn));
    board.appendChild(btn);
  });
}

function tapNumber(item, btn) {
  if (roundLocked || btn.classList.contains("matched")) return;
  const value = parseInt(item.label, 10);
  if (value === nextExpected) {
    btn.classList.add("matched");
    playTone("correct");
    speak(item.label);
    nextExpected++;
    if (nextExpected > maxCount) {
      roundLocked = true;
      if (missesThisRound === 0) {
        score++;
        scoreEl.textContent = score;
      }
      for (let i = 1; i <= maxCount; i++) {
        recordItemResult("numbers", "n" + i, missesThisRound === 0);
      }
      setTimeout(() => {
        speak("You did it!");
        setTimeout(advance, 900);
      }, 500);
    } else {
      setTimeout(() => speak("Find number " + nextExpected + "!"), 550);
    }
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
  recordGameResult("order", "numbers", true, quality);
}

document.getElementById("repeatBtn").addEventListener("click", () => speak("Find number " + nextExpected + "!"));
document.getElementById("playAgainBtn").addEventListener("click", () => {
  winBanner.style.display = "none";
  if (autoMode) startAutoMode();
  else resetRun();
});

resetRun();
initSessionTimer();
