if (!requireProfile()) { /* redirecting to profile picker */ }

// Only decks of concrete, "is-a-thing" objects make sense to sort against each other —
// categorizing an emoji as "a feeling or an opposite" doesn't read the same way "a fish or
// an apple" does. This is a different skill from every other game: categorization, not
// recall or counting.
const SORT_DECK_KEYS = ["animals", "food", "vehicles", "bodyParts"];
const ROUNDS = 10;

const scoreEl = document.getElementById("scoreCount");
const roundEl = document.getElementById("roundCount");
const roundTotalEl = document.getElementById("roundTotal");
const prompt = document.getElementById("prompt");
const sortItem = document.getElementById("sortItem");
const sortBins = document.getElementById("sortBins");
const winBanner = document.getElementById("winBanner");
const confettiHost = document.getElementById("confettiHost");

roundTotalEl.textContent = ROUNDS;

let catA, catB;
let score = 0;
let round = 1;
let target = null;
let targetDeckKey = null;
let missesThisRound = 0;
let lock = false;
let lastItemId = null;

function pickCategoryPair() {
  const pool = shuffle(SORT_DECK_KEYS.slice());
  catA = pool[0];
  catB = pool[1];
}

function renderBins() {
  sortBins.innerHTML = "";
  [catA, catB].forEach((key) => {
    const deck = DECKS[key];
    const bin = document.createElement("button");
    bin.className = "sort-bin";
    bin.dataset.deck = key;
    bin.innerHTML =
      '<span class="sort-bin-emoji">' + deck.items[0].emoji + "</span>" + deck.title;
    bin.addEventListener("click", () => chooseBin(key, bin));
    sortBins.appendChild(bin);
  });
}

function newPair() {
  pickCategoryPair();
  score = 0;
  round = 1;
  scoreEl.textContent = 0;
  winBanner.style.display = "none";
  renderBins();
  newRound();
}

function newRound() {
  lock = false;
  missesThisRound = 0;
  targetDeckKey = Math.random() < 0.5 ? catA : catB;
  const items = DECKS[targetDeckKey].items;
  target = items[Math.floor(Math.random() * items.length)];
  if (target.id === lastItemId && items.length > 1) {
    target = items[Math.floor(Math.random() * items.length)];
  }
  lastItemId = target.id;
  roundEl.textContent = round;
  sortItem.textContent = target.emoji;
  prompt.textContent = "Where does it go?";
  [...sortBins.children].forEach((b) => b.classList.remove("correct", "wrong"));
  setTimeout(() => speak(target.label), 250);
}

function chooseBin(binDeckKey, binEl) {
  if (lock) return;
  if (binDeckKey === targetDeckKey) {
    lock = true;
    score++;
    scoreEl.textContent = score;
    playTone("correct");
    speak("Yes! That's " + DECKS[targetDeckKey].title.toLowerCase() + "!");
    binEl.classList.add("correct");
    recordItemResult(targetDeckKey, target.id, missesThisRound === 0);
    setTimeout(advance, 800);
  } else {
    missesThisRound++;
    playTone("wrong");
    binEl.classList.add("wrong");
    speak("Try again!");
    setTimeout(() => binEl.classList.remove("wrong"), 400);
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
  recordGameResult("sort", catA + "-" + catB, true, quality);
}

document.getElementById("newPairBtn").addEventListener("click", newPair);
document.getElementById("playAgainBtn").addEventListener("click", newPair);

newPair();
initSessionTimer();
