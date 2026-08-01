if (!requireProfile()) { /* redirecting to profile picker */ }

// A simpler pre-literacy skill than Odd One Out (which needs picking 1-of-4) — here the
// child just judges whether two shown items match or not. Draws from several visual decks
// for variety, filtered by the "Decks shown on home screen" setting, same handling as
// Sort It!/Odd One Out/Starts With.
const SAMEDIFF_DECK_KEYS = ["animals", "food", "vehicles", "bodyParts", "shapes", "colors"];
const ROUNDS = 10;

function getSameDiffPool() {
  const enabled = getSettings().enabledDecks;
  if (!enabled || !enabled.length) return SAMEDIFF_DECK_KEYS;
  const filtered = SAMEDIFF_DECK_KEYS.filter((k) => enabled.includes(k));
  return filtered.length >= 1 ? filtered : SAMEDIFF_DECK_KEYS;
}

const scoreEl = document.getElementById("scoreCount");
const roundEl = document.getElementById("roundCount");
const roundTotalEl = document.getElementById("roundTotal");
const prompt = document.getElementById("prompt");
const boxA = document.getElementById("boxA");
const boxB = document.getElementById("boxB");
const sameBtn = document.getElementById("sameBtn");
const differentBtn = document.getElementById("differentBtn");
const winBanner = document.getElementById("winBanner");
const confettiHost = document.getElementById("confettiHost");

roundTotalEl.textContent = ROUNDS;

let score = 0;
let round = 1;
let itemA = null, itemB = null, deckKey = null;
let correctAnswer = null; // "same" | "different"
let missesThisRound = 0;
let lock = false;

function newRound() {
  lock = false;
  missesThisRound = 0;
  roundEl.textContent = round;

  const pool = getSameDiffPool();
  deckKey = pool[Math.floor(Math.random() * pool.length)];
  const items = DECKS[deckKey].items;
  const isSame = Math.random() < 0.5;

  if (isSame) {
    itemA = items[Math.floor(Math.random() * items.length)];
    itemB = itemA;
    correctAnswer = "same";
  } else {
    const shuffled = shuffle(items.slice());
    itemA = shuffled[0];
    itemB = shuffled[1];
    correctAnswer = "different";
  }

  prompt.textContent = "Same or different?";
  renderCardVisual(itemA, boxA);
  renderCardVisual(itemB, boxB);

  setTimeout(() => speak("Are these the same, or different?"), 250);
}

function chooseAnswer(answer, btn) {
  if (lock) return;
  if (answer === correctAnswer) {
    lock = true;
    score++;
    scoreEl.textContent = score;
    playTone("correct");
    speak("That's right!");
    recordItemResult(deckKey, itemA.id, missesThisRound === 0);
    setTimeout(advance, 900);
  } else {
    missesThisRound++;
    playTone("wrong");
    btn.classList.add("wrong");
    speak("Try again!");
    setTimeout(() => btn.classList.remove("wrong"), 400);
  }
}

sameBtn.addEventListener("click", () => chooseAnswer("same", sameBtn));
differentBtn.addEventListener("click", () => chooseAnswer("different", differentBtn));

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
  recordGameResult("samediff", "mixed", true, quality);
}

document.getElementById("repeatBtn").addEventListener("click", () => speak("Are these the same, or different?"));
document.getElementById("playAgainBtn").addEventListener("click", () => {
  winBanner.style.display = "none";
  score = 0;
  round = 1;
  scoreEl.textContent = 0;
  newRound();
});

newRound();
initSessionTimer();
