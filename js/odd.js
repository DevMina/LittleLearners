if (!requireProfile()) { /* redirecting to profile picker */ }

// Same concrete-object pool as Sort It! — "3 animals and 1 vehicle" reads as a clean
// visual-discrimination task; mixing in adjective decks (Feelings, Opposites) wouldn't.
const ODD_DECK_KEYS = ["animals", "food", "vehicles", "bodyParts"];
const ROUNDS = 10;

// Same enabledDecks handling as Sort It! — needs at least 2 categories (one to match, one
// to be the odd one out), so falls back to the full pool if too few are enabled.
function getOddPool() {
  const enabled = getSettings().enabledDecks;
  if (!enabled || !enabled.length) return ODD_DECK_KEYS;
  const filtered = ODD_DECK_KEYS.filter((k) => enabled.includes(k));
  return filtered.length >= 2 ? filtered : ODD_DECK_KEYS;
}

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
let options = [];        // 4 items this round: 3 from sameDeckKey, 1 from oddDeckKey
let oddItem = null;
let oddDeckKey = null;
let missesThisRound = 0;
let lock = false;
let lastSameDeckKey = null;

function newRound() {
  lock = false;
  missesThisRound = 0;

  let sameDeckKey = getOddPool()[Math.floor(Math.random() * getOddPool().length)];
  if (sameDeckKey === lastSameDeckKey && getOddPool().length > 1) {
    sameDeckKey = getOddPool()[Math.floor(Math.random() * getOddPool().length)];
  }
  lastSameDeckKey = sameDeckKey;

  const otherDecks = getOddPool().filter((k) => k !== sameDeckKey);
  oddDeckKey = otherDecks[Math.floor(Math.random() * otherDecks.length)];

  const sameItems = shuffle(DECKS[sameDeckKey].items).slice(0, 3);
  oddItem = DECKS[oddDeckKey].items[Math.floor(Math.random() * DECKS[oddDeckKey].items.length)];
  options = shuffle([...sameItems, oddItem]);

  roundEl.textContent = round;
  prompt.textContent = "Which one is different?";
  render();
  setTimeout(() => speak("Which one is different?"), 250);
}

function render() {
  board.innerHTML = "";
  options.forEach((item) => {
    const btn = document.createElement("button");
    btn.className = "game-tile find-tile";
    btn.setAttribute("aria-label", item.label);
    btn.textContent = item.emoji;
    btn.addEventListener("click", () => choose(item, btn));
    board.appendChild(btn);
  });
}

function choose(item, btn) {
  if (lock) return;
  if (item.id === oddItem.id) {
    lock = true;
    score++;
    scoreEl.textContent = score;
    playTone("correct");
    speak("Yes! The " + oddItem.label + " is different!");
    btn.style.background = "#6BCB77";
    recordItemResult(oddDeckKey, oddItem.id, missesThisRound === 0);
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
  recordGameResult("odd", "mixed", true, quality);
}

document.getElementById("repeatBtn").addEventListener("click", () => speak("Which one is different?"));
document.getElementById("playAgainBtn").addEventListener("click", () => {
  winBanner.style.display = "none";
  score = 0;
  round = 1;
  scoreEl.textContent = 0;
  newRound();
});

newRound();
initSessionTimer();
