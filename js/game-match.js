const deckKey2 = qparam("deck", "animals");
const srcDeck = DECKS[deckKey2] || DECKS.animals;

const board = document.getElementById("board");
const movesEl = document.getElementById("movesCount");
const pairsEl = document.getElementById("pairsCount");
const winBanner = document.getElementById("winBanner");
const confettiHost = document.getElementById("confettiHost");

let cards = [];
let flipped = [];
let matched = 0;
let moves = 0;
let lock = false;

function setup() {
  const picks = shuffle(srcDeck.items).slice(0, 8);
  cards = shuffle(picks.concat(picks)).map((item, i) => ({ item, i, matched: false }));
  matched = 0;
  moves = 0;
  flipped = [];
  movesEl.textContent = "0";
  pairsEl.textContent = "0";
  winBanner.style.display = "none";
  render();
}

function render() {
  board.innerHTML = "";
  cards.forEach((c, i) => {
    const btn = document.createElement("button");
    btn.className = "game-tile" + (c.matched ? " matched" : "") + (flipped.includes(i) ? " flipped" : " hidden-face");
    if (c.matched || flipped.includes(i)) {
      if (c.item.emoji) btn.textContent = c.item.emoji;
      else if (c.item.swatch) { btn.style.background = c.item.swatch; }
      else btn.textContent = c.item.label;
    } else {
      btn.textContent = "?";
    }
    btn.addEventListener("click", () => flip(i));
    board.appendChild(btn);
  });
}

function flip(i) {
  if (lock || flipped.includes(i) || cards[i].matched) return;
  flipped.push(i);
  render();
  if (flipped.length === 2) {
    moves++;
    movesEl.textContent = moves;
    lock = true;
    const [a, b] = flipped;
    if (cards[a].item.id === cards[b].item.id) {
      cards[a].matched = true;
      cards[b].matched = true;
      matched++;
      pairsEl.textContent = matched;
      playTone("correct");
      speak(cards[a].item.label);
      flipped = [];
      lock = false;
      render();
      if (matched === 8) setTimeout(win, 400);
    } else {
      playTone("wrong");
      setTimeout(() => {
        flipped = [];
        lock = false;
        render();
      }, 700);
    }
  }
}

function win() {
  winBanner.style.display = "flex";
  document.getElementById("winStats").textContent = "You matched all 8 pairs in " + moves + " moves!";
  playTone("win");
  confettiBurst(confettiHost);
  speak("Great job! You found them all!");
  const quality = moves <= 10 ? 3 : moves <= 16 ? 2 : 1;
  recordGameResult("match", deckKey2, true, quality);
}

document.getElementById("restartBtn").addEventListener("click", setup);
document.getElementById("playAgainBtn").addEventListener("click", setup);

setup();
initSessionTimer();
