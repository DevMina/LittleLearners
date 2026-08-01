if (!requireProfile()) { /* redirecting to profile picker */ }

// Two visually distinct groups of objects side by side — the child taps whichever side
// answers the question ("more" or "fewer", asked randomly each round). This is a genuinely
// different skill from Count & Match (which tests 1:1 counting to a numeral): quantity
// *comparison* without necessarily counting each side exactly.
const OBJECT_EMOJI = ["🍎", "⭐", "🎈", "🐟", "🍪", "🚗", "🐰", "🌸", "🐝", "🍇"];
const STAGES = [3, 5, 7];
const ROUNDS_PER_STAGE = 5;

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
let countA = 0, countB = 0;
let askingMore = true; // true = "which has more", false = "which has fewer"
let lock = false;
let missesThisRound = 0;

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
  lock = false;
  missesThisRound = 0;
  roundEl.textContent = overallRound;

  // Never let the two sides tie — there must always be a clear answer.
  countA = Math.floor(Math.random() * maxCount) + 1;
  do {
    countB = Math.floor(Math.random() * maxCount) + 1;
  } while (countB === countA);

  const emojiPool = shuffle(OBJECT_EMOJI.slice());
  const emojiA = emojiPool[0];
  const emojiB = emojiPool[1];

  askingMore = Math.random() < 0.5;
  prompt.textContent = askingMore ? "Which side has more?" : "Which side has fewer?";

  board.innerHTML = "";
  [{ count: countA, emoji: emojiA, side: "A" }, { count: countB, emoji: emojiB, side: "B" }].forEach((group) => {
    const btn = document.createElement("button");
    btn.className = "moreless-side";
    btn.setAttribute("aria-label", (group.side === "A" ? "Left side" : "Right side") + ", " + group.count + " items");
    const wrap = document.createElement("div");
    wrap.className = "moreless-objects";
    wrap.textContent = group.emoji.repeat(group.count);
    btn.appendChild(wrap);
    btn.addEventListener("click", () => chooseSide(group.side, btn));
    board.appendChild(btn);
  });

  setTimeout(() => speak(prompt.textContent), 250);
}

function chooseSide(side, btn) {
  if (lock) return;
  const correctSide = (askingMore ? countA > countB : countA < countB) ? "A" : "B";
  if (side === correctSide) {
    lock = true;
    score++;
    scoreEl.textContent = score;
    playTone("correct");
    speak("That's right!");
    btn.classList.add("correct");
    setTimeout(advance, 900);
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
  recordGameResult("moreless", "numbers", true, quality);
}

document.getElementById("repeatBtn").addEventListener("click", () => speak(prompt.textContent));
document.getElementById("playAgainBtn").addEventListener("click", () => {
  winBanner.style.display = "none";
  if (autoMode) startAutoMode();
  else resetRun();
});

resetRun();
initSessionTimer();
