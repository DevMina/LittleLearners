if (!requireProfile()) { /* redirecting to profile picker */ }

// Reuses the Letters deck (uppercase A-Z) as the source of truth and derives the lowercase
// form on the fly — this is a genuinely different skill from Tracing (motor formation) and
// Starts With (letter-to-sound), namely recognizing that "A" and "a" are the same letter.
const letterItems = DECKS.letters.items;
const ROUNDS = 10;

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
let target = null;       // uppercase deck item
let missesThisRound = 0;
let lock = false;
let lastItemId = null;

function pickTarget() {
  let item = letterItems[Math.floor(Math.random() * letterItems.length)];
  if (item.id === lastItemId) {
    item = letterItems[Math.floor(Math.random() * letterItems.length)];
  }
  lastItemId = item.id;
  target = item;
}

function buildChoices() {
  const pool = letterItems.filter((it) => it.id !== target.id);
  const distractors = shuffle(pool).slice(0, 3);
  return shuffle([target, ...distractors]);
}

function newRound() {
  lock = false;
  missesThisRound = 0;
  pickTarget();
  roundEl.textContent = round;
  prompt.textContent = "Find the little letter!";
  renderCardVisual(target, picStage);

  board.innerHTML = "";
  buildChoices().forEach((item) => {
    const lower = item.letter.toLowerCase();
    const btn = document.createElement("button");
    btn.className = "game-tile find-tile";
    btn.setAttribute("aria-label", lower);
    btn.textContent = lower;
    btn.addEventListener("click", () => chooseOption(item, btn));
    board.appendChild(btn);
  });

  setTimeout(() => speak(target.letter), 250);
}

function chooseOption(item, btn) {
  if (lock) return;
  if (item.id === target.id) {
    lock = true;
    score++;
    scoreEl.textContent = score;
    playTone("correct");
    speak(target.letter + " and " + item.letter.toLowerCase() + " — same letter!");
    btn.style.background = "#6BCB77";
    recordItemResult("letters", target.id, missesThisRound === 0);
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
  recordGameResult("case", "letters", true, quality);
}

document.getElementById("repeatBtn").addEventListener("click", () => speak(target.letter));
document.getElementById("playAgainBtn").addEventListener("click", () => {
  winBanner.style.display = "none";
  score = 0;
  round = 1;
  scoreEl.textContent = 0;
  newRound();
});

newRound();
initSessionTimer();
