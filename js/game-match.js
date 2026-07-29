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
const deckCurrentBtn = document.getElementById("deckCurrentBtn");
const deckCurrentLabel = document.getElementById("deckCurrentLabel");
const deckCurrentDot = document.getElementById("deckCurrentDot");
const deckChangeBtn = document.getElementById("deckChangeBtn");
const deckModalOverlay = document.getElementById("deckModalOverlay");
const deckModalCloseBtn = document.getElementById("deckModalCloseBtn");
const deckGrid = document.getElementById("deckGrid");

pairsTotalEl.textContent = PAIR_COUNT;

// Collapsed deck picker — shows the active category as a chip; tapping it or the
// shuffle button opens a modal grid with every deck, still playable from here.
deckCurrentLabel.textContent = srcDeck.title;
deckCurrentDot.style.background = "var(--" + srcDeck.color + ")";

Object.keys(DECKS).forEach((key) => {
  const tile = document.createElement("button");
  tile.className = "deck-tile " + DECKS[key].color + (key === deckKey2 ? " active" : "");
  tile.textContent = DECKS[key].title;
  tile.addEventListener("click", () => (location.href = "game-match.html?deck=" + key));
  deckGrid.appendChild(tile);
});

function openDeckModal() { deckModalOverlay.style.display = "flex"; }
function closeDeckModal() { deckModalOverlay.style.display = "none"; }

deckCurrentBtn.addEventListener("click", openDeckModal);
deckChangeBtn.addEventListener("click", openDeckModal);
deckModalCloseBtn.addEventListener("click", closeDeckModal);
deckModalOverlay.addEventListener("click", (e) => {
  if (e.target === deckModalOverlay) closeDeckModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeDeckModal();
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

// Shapes deck items only carry a shape name (e.g. "circle"), no emoji/swatch — map that
// to a glyph so the memory game shows an actual shape instead of falling back to the word.
const SHAPE_GLYPHS = { circle: "⚫", square: "◼️", triangle: "▲", star: "⭐", heart: "❤️", diamond: "🔶" };

function render() {
  board.innerHTML = "";
  cards.forEach((c, i) => {
    const btn = document.createElement("button");
    const stateClass = c.matched ? " matched" : (flipped.includes(i) ? " flipped" : " hidden-face");
    const isSwatch = !!c.item.swatch;
    btn.className = "game-tile" + stateClass + (isSwatch && (c.matched || flipped.includes(i)) ? " swatch-tile" : "");
    btn.setAttribute("aria-label", c.matched || flipped.includes(i) ? c.item.label : "Hidden card");
    if (c.matched || flipped.includes(i)) {
      if (c.item.emoji) btn.textContent = c.item.emoji;
      else if (c.item.shape) btn.textContent = SHAPE_GLYPHS[c.item.shape] || "●";
      else if (c.item.dots) renderMiniDots(btn, c.item);
      else if (c.item.swatch) {
        btn.style.background = c.item.swatch;
        if (c.matched) {
          const badge = document.createElement("span");
          badge.className = "swatch-match-badge";
          badge.textContent = "✓";
          btn.appendChild(badge);
        }
      }
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
