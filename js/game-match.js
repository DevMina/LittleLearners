if (!requireProfile()) { /* redirecting to profile picker */ }

const deckKey2 = qparam("deck", "animals");
const srcDeck = DECKS[deckKey2] || DECKS.animals;
const PAIR_COUNT = Math.min(8, srcDeck.items.length);

const board = document.getElementById("board");
const movesEl = document.getElementById("movesCount");
const pairsEl = document.getElementById("pairsCount");
const pairsTotalEl = document.getElementById("pairsTotal");
const winBanner = document.getElementById("winBanner");
const confettiHost = document.getElementById("confettiHost");
const deckPicker = document.getElementById("deckPicker");

pairsTotalEl.textContent = PAIR_COUNT;

// Deck picker — every deck is playable here, not just the one linked from home
Object.keys(DECKS).forEach((key) => {
  const btn = document.createElement("button");
  btn.className = "word-chip" + (key === deckKey2 ? " active-chip" : "");
  btn.textContent = DECKS[key].title;
  btn.addEventListener("click", () => (location.href = "game-match.html?deck=" + key));
  deckPicker.appendChild(btn);
});

let cards = [];
let flipped = [];
let matched = 0;
let moves = 0;
let lock = false;
let lastCardSetIds = null;

function setup() {
  let picks = shuffle(srcDeck.items).slice(0, PAIR_COUNT);
  // avoid dealing the exact same card set as last time, when the deck has more to draw from
  if (srcDeck.items.length > PAIR_COUNT) {
    let attempts = 0;
    while (lastCardSetIds && sameIdSet(picks, lastCardSetIds) && attempts < 5) {
      picks = shuffle(srcDeck.items).slice(0, PAIR_COUNT);
      attempts++;
    }
  }
  lastCardSetIds = picks.map((p) => p.id).sort();
  cards = shuffle(picks.concat(picks)).map((item, i) => ({ item, i, matched: false }));
  matched = 0;
  moves = 0;
  flipped = [];
  movesEl.textContent = "0";
  pairsEl.textContent = "0";
  winBanner.style.display = "none";
  render();
}

function sameIdSet(picks, ids) {
  const a = picks.map((p) => p.id).sort();
  if (a.length !== ids.length) return false;
  return a.every((v, i) => v === ids[i]);
}

function render() {
  board.innerHTML = "";
  cards.forEach((c, i) => {
    const btn = document.createElement("button");
    const stateClass = c.matched ? " matched" : (flipped.includes(i) ? " flipped" : " hidden-face");
    btn.className = "game-tile" + stateClass;
    btn.setAttribute("aria-label", c.matched || flipped.includes(i) ? c.item.label : "Hidden card");
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
      if (matched === PAIR_COUNT) setTimeout(win, 400);
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
  document.getElementById("winStats").textContent = "You matched all " + PAIR_COUNT + " pairs in " + moves + " moves!";
  playTone("win");
  confettiBurst(confettiHost);
  speak("Great job! You found them all!");
  const quality = moves <= PAIR_COUNT * 1.3 ? 3 : moves <= PAIR_COUNT * 2 ? 2 : 1;
  recordGameResult("match", deckKey2, true, quality);
}

document.getElementById("restartBtn").addEventListener("click", setup);
document.getElementById("playAgainBtn").addEventListener("click", setup);

setup();
initSessionTimer();
