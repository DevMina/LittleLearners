const deckKey = qparam("deck", "animals");
const deck = DECKS[deckKey] || DECKS.animals;
let order = deck.items.map((_, i) => i);
let idx = 0;

const flashcard = document.getElementById("flashcard");
const cardLabel = document.getElementById("cardLabel");
const deckTitle = document.getElementById("deckTitle");
const dotsEl = document.getElementById("progressDots");

deckTitle.textContent = deck.title;
document.title = "Little Learners – " + deck.title;

function buildDots() {
  dotsEl.innerHTML = "";
  order.forEach((_, i) => {
    const d = document.createElement("span");
    dotsEl.appendChild(d);
  });
}

function render() {
  const item = deck.items[order[idx]];
  flashcard.classList.remove("flashcard");
  void flashcard.offsetWidth;
  flashcard.classList.add("flashcard");
  renderCardVisual(item, flashcard);
  cardLabel.textContent = item.label;
  [...dotsEl.children].forEach((d, i) => d.classList.toggle("active", i === idx));
  speak(item.label);

  const justCompleted = markCardSeen(deckKey, item.id, deck.items.length);
  if (justCompleted) {
    setTimeout(() => {
      playTone("win");
      const host = document.createElement("div");
      host.className = "confetti-host";
      document.querySelector(".card-stage").prepend(host);
      confettiBurst(host);
      speak("You've seen the whole " + deck.title + " deck! Great job!");
    }, 600);
  }
}

function goTo(delta) {
  idx = (idx + delta + order.length) % order.length;
  render();
}

document.getElementById("prevBtn").addEventListener("click", () => goTo(-1));
document.getElementById("nextBtn").addEventListener("click", () => goTo(1));
document.getElementById("speakBtn").addEventListener("click", () => speak(deck.items[order[idx]].label));
flashcard.addEventListener("click", () => speak(deck.items[order[idx]].label));

document.getElementById("shuffleBtn").addEventListener("click", () => {
  order = shuffle(order);
  idx = 0;
  render();
});

// swipe support
let touchStartX = null;
flashcard.addEventListener("touchstart", (e) => (touchStartX = e.touches[0].clientX));
flashcard.addEventListener("touchend", (e) => {
  if (touchStartX === null) return;
  const dx = e.changedTouches[0].clientX - touchStartX;
  if (Math.abs(dx) > 40) goTo(dx < 0 ? 1 : -1);
  touchStartX = null;
});

buildDots();
render();
initSessionTimer();
