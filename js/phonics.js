if (!requireProfile()) { /* redirecting to profile picker */ }

// Picture decks only — Letters/First Words have no picture to sound out, and Numbers'
// labels are digits, not words with an initial letter.
const PHONICS_DECK_KEYS = ["animals", "colors", "shapes", "vehicles", "food", "bodyParts", "emotions", "opposites"];
const ROUNDS = 10;
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

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
let target = null;       // the picture item this round
let targetDeckKey = null;
let targetLetter = "";
let missesThisRound = 0;
let lock = false;
let lastItemId = null;

function pickTarget() {
  const dk = PHONICS_DECK_KEYS[Math.floor(Math.random() * PHONICS_DECK_KEYS.length)];
  const items = DECKS[dk].items;
  let item = items[Math.floor(Math.random() * items.length)];
  if (item.id === lastItemId && items.length > 1) {
    item = items[Math.floor(Math.random() * items.length)];
  }
  lastItemId = item.id;
  targetDeckKey = dk;
  target = item;
  targetLetter = item.label.charAt(0).toUpperCase();
}

function buildLetterChoices() {
  const distractors = shuffle(ALPHABET.filter((l) => l !== targetLetter)).slice(0, 2);
  return shuffle([targetLetter, ...distractors]);
}

function newRound() {
  lock = false;
  missesThisRound = 0;
  pickTarget();
  roundEl.textContent = round;
  prompt.textContent = "What does it start with?";
  renderCardVisual(target, picStage);

  board.innerHTML = "";
  buildLetterChoices().forEach((letter) => {
    const btn = document.createElement("button");
    btn.className = "game-tile find-tile";
    btn.setAttribute("aria-label", letter);
    btn.textContent = letter;
    btn.addEventListener("click", () => chooseLetter(letter, btn));
    board.appendChild(btn);
  });

  setTimeout(() => speak(target.label), 250);
}

function chooseLetter(letter, btn) {
  if (lock) return;
  if (letter === targetLetter) {
    lock = true;
    score++;
    scoreEl.textContent = score;
    playTone("correct");
    speak(target.label + " starts with " + letter + "!");
    btn.style.background = "#6BCB77";
    recordItemResult(targetDeckKey, target.id, missesThisRound === 0);
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
  recordGameResult("phonics", "mixed", true, quality);
}

document.getElementById("repeatBtn").addEventListener("click", () => speak(target.label));
document.getElementById("playAgainBtn").addEventListener("click", () => {
  winBanner.style.display = "none";
  score = 0;
  round = 1;
  scoreEl.textContent = 0;
  newRound();
});

newRound();
initSessionTimer();
