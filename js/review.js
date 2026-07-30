if (!requireProfile()) { /* redirecting to profile picker */ }

const reviewStage = document.getElementById("reviewStage");
const emptyState = document.getElementById("emptyState");
const doneBanner = document.getElementById("doneBanner");
const flashcard = document.getElementById("flashcard");
const cardLabel = document.getElementById("cardLabel");
const deckBadge = document.getElementById("deckBadge");
const dotsEl = document.getElementById("progressDots");

const enabledDecks = getSettings().enabledDecks;
const queue = getWeakItems(enabledDecks, 12);
let idx = 0;
let gotItCount = 0;

function buildDots() {
  dotsEl.innerHTML = "";
  queue.forEach(() => dotsEl.appendChild(document.createElement("span")));
}

function render() {
  const entry = queue[idx];
  flashcard.classList.remove("flashcard");
  void flashcard.offsetWidth;
  flashcard.classList.add("flashcard");
  renderCardVisual(entry.item, flashcard);
  cardLabel.textContent = entry.item.label;
  deckBadge.textContent = "from " + (DECKS[entry.deckKey] ? DECKS[entry.deckKey].title : entry.deckKey);
  [...dotsEl.children].forEach((d, i) => d.classList.toggle("active", i === idx));
  speak(entry.item.label);
}

function mark(correct) {
  const entry = queue[idx];
  recordItemResult(entry.deckKey, entry.item.id, correct);
  if (correct) {
    gotItCount++;
    playTone("correct");
  } else {
    playTone("tap");
  }
  advance();
}

function advance() {
  idx++;
  if (idx >= queue.length) {
    finish();
  } else {
    render();
  }
}

function finish() {
  reviewStage.style.display = "none";
  doneBanner.style.display = "flex";
  document.getElementById("doneStats").textContent =
    "You reviewed " + queue.length + " word" + (queue.length === 1 ? "" : "s") + " and nailed " + gotItCount + " of them!";
  playTone("win");
  speak("Great reviewing!");
}

if (queue.length === 0) {
  emptyState.style.display = "flex";
} else {
  reviewStage.style.display = "flex";
  buildDots();
  render();
  document.getElementById("stillTrickyBtn").addEventListener("click", () => mark(false));
  document.getElementById("gotItBtn").addEventListener("click", () => mark(true));
  document.getElementById("speakBtn").addEventListener("click", () => speak(queue[idx].item.label));
}
