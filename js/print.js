const deckPicker = document.getElementById("deckPicker");
const printSheet = document.getElementById("printSheet");
const initialDeck = qparam("deck", "animals");

Object.keys(DECKS).forEach((key) => {
  const btn = document.createElement("button");
  btn.className = "word-chip";
  btn.textContent = DECKS[key].title;
  btn.dataset.deck = key;
  btn.addEventListener("click", () => selectDeck(key));
  deckPicker.appendChild(btn);
});

function markActiveChip(key) {
  [...deckPicker.children].forEach((b) => b.classList.toggle("active-chip", b.dataset.deck === key));
}

function cardInnerHTML(item) {
  if (item.emoji) return `<div class="print-emoji">${item.emoji}</div>`;
  if (item.swatch) return `<div class="print-swatch" style="background:${item.swatch}"></div>`;
  if (item.dots) return `<div class="print-number">${item.label}</div>`;
  if (item.shape) return `<div class="print-emoji">${shapeGlyph(item.shape)}</div>`;
  if (item.letter) return `<div class="print-letter">${item.letter}</div>`;
  return "";
}

function shapeGlyph(shape) {
  const map = { circle: "⚫", square: "◼️", triangle: "▲", star: "⭐", heart: "❤️", diamond: "🔶" };
  return map[shape] || "●";
}

function selectDeck(key) {
  markActiveChip(key);
  const deck = DECKS[key];
  printSheet.innerHTML = `<div class="print-heading">Little Learners — ${deck.title}</div><div class="print-grid"></div>`;
  const grid = printSheet.querySelector(".print-grid");
  deck.items.forEach((item) => {
    const card = document.createElement("div");
    card.className = "print-card";
    card.innerHTML = cardInnerHTML(item) + `<div class="print-label">${item.label}</div>`;
    grid.appendChild(card);
  });
}

document.getElementById("printBtn").addEventListener("click", () => window.print());

selectDeck(DECKS[initialDeck] ? initialDeck : "animals");
