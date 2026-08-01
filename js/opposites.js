if (!requireProfile()) { /* redirecting to profile picker */ }

// The Opposites deck is laid out as consecutive pairs (big/small, up/down, hot/cold...),
// so a word's opposite is always its neighbor: even index -> index+1, odd index -> index-1.
const ROUNDS = 10;
const oppItems = DECKS.opposites.items;

function opposite(item) {
  const i = oppItems.findIndex((it) => it.id === item.id);
  const pairIndex = i % 2 === 0 ? i + 1 : i - 1;
  return oppItems[pairIndex];
}

const scoreEl = document.getElementById("scoreCount");
const roundEl = document.getElementById("roundCount");
const roundTotalEl = document.getElementById("roundTotal");
const prompt = document.getElementById("prompt");
const picStage = document.getElementById("picStage");
const board = document.getElementById("board");
const winBanner = document.getElementById("winBanner");
const confettiHost = document.getElementById("confettiHost");

roundTotalEl.textContent = ROUNDS;

let score = 0;
let round = 1;
let target = null;
let correctAnswer = null;
let missesThisRound = 0;
let lock = false;
let lastItemId = null;

function pickTarget() {
  let item = oppItems[Math.floor(Math.random() * oppItems.length)];
  if (item.id === lastItemId) {
    item = oppItems[Math.floor(Math.random() * oppItems.length)];
  }
  lastItemId = item.id;
  target = item;
  correctAnswer = opposite(item);
}

function buildChoices() {
  const pool = oppItems.filter((it) => it.id !== target.id && it.id !== correctAnswer.id);
  const distractors = shuffle(pool).slice(0, 3);
  return shuffle([correctAnswer, ...distractors]);
}

function newRound() {
  lock = false;
  missesThisRound = 0;
  pickTarget();
  roundEl.textContent = round;
  prompt.textContent = "What's the opposite of " + target.label + "?";
  renderCardVisual(target, picStage);

  board.innerHTML = "";
  buildChoices().forEach((item) => {
    const btn = document.createElement("button");
    btn.className = "game-tile find-tile";
    btn.setAttribute("aria-label", item.label);
    btn.textContent = item.emoji;
    btn.addEventListener("click", () => chooseOption(item, btn));
    board.appendChild(btn);
  });

  setTimeout(() => speak("What's the opposite of " + target.label + "?"), 250);
}

function chooseOption(item, btn) {
  if (lock) return;
  if (item.id === correctAnswer.id) {
    lock = true;
    score++;
    scoreEl.textContent = score;
    playTone("correct");
    speak(correctAnswer.label + "! Great job!");
    btn.style.background = "#6BCB77";
    recordItemResult("opposites", target.id, missesThisRound === 0);
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
  if (round >= ROUNDS) {
    finish();
  } else {
    round++;
    newRound();
  }
}

function finish() {
  winBanner.style.display = "flex";
  document.getElementById("winStats").textContent = "You scored " + score + " out of " + ROUNDS + "!";
  playTone("win");
  confettiBurst(confettiHost);
  speak("All done! You scored " + score + " out of " + ROUNDS);
  const fraction = score / ROUNDS;
  const quality = fraction >= 0.85 ? 3 : fraction >= 0.6 ? 2 : 1;
  recordGameResult("opposites", "pairs", true, quality);
}

document.getElementById("repeatBtn").addEventListener("click", () => speak("What's the opposite of " + target.label + "?"));
document.getElementById("playAgainBtn").addEventListener("click", () => {
  winBanner.style.display = "none";
  score = 0;
  round = 1;
  scoreEl.textContent = 0;
  newRound();
});

newRound();
initSessionTimer();
