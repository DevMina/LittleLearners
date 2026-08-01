if (!requireProfile()) { /* redirecting to profile picker */ }

// The First Words (sight words) deck was sitting completely unused everywhere else in the
// app — this is the only game that actually puts it to work. The child hears the word
// spoken but never sees it written until they've picked — early sight-word reading is about
// recognizing the whole printed shape of a word, not sounding it out letter by letter.
const wordItems = DECKS.sightWords.items;
const ROUNDS = 10;

const scoreEl = document.getElementById("scoreCount");
const roundEl = document.getElementById("roundCount");
const roundTotalEl = document.getElementById("roundTotal");
const prompt = document.getElementById("prompt");
const board = document.getElementById("board");
const winBanner = document.getElementById("winBanner");
const confettiHost = document.getElementById("confettiHost");

roundTotalEl.textContent = ROUNDS;

let score = 0;
let round = 1;
let target = null;
let missesThisRound = 0;
let lock = false;
let lastItemId = null;

function pickTarget() {
  let item = wordItems[Math.floor(Math.random() * wordItems.length)];
  if (item.id === lastItemId && wordItems.length > 1) {
    item = wordItems[Math.floor(Math.random() * wordItems.length)];
  }
  lastItemId = item.id;
  target = item;
}

function buildChoices() {
  const pool = wordItems.filter((it) => it.id !== target.id);
  const distractors = shuffle(pool).slice(0, 3);
  return shuffle([target, ...distractors]);
}

function newRound() {
  lock = false;
  missesThisRound = 0;
  pickTarget();
  roundEl.textContent = round;
  prompt.textContent = "Which word is this?";

  board.innerHTML = "";
  buildChoices().forEach((item) => {
    const btn = document.createElement("button");
    btn.className = "game-tile find-tile word-tile";
    btn.setAttribute("aria-label", item.label);
    btn.textContent = item.label;
    btn.addEventListener("click", () => chooseOption(item, btn));
    board.appendChild(btn);
  });

  setTimeout(() => speak(target.label), 250);
}

function chooseOption(item, btn) {
  if (lock) return;
  if (item.id === target.id) {
    lock = true;
    score++;
    scoreEl.textContent = score;
    playTone("correct");
    speak("Yes! " + target.label + "!");
    btn.style.background = "#6BCB77";
    recordItemResult("sightWords", target.id, missesThisRound === 0);
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
  recordGameResult("read", "sightWords", true, quality);
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
