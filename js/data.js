// ---------- Deck data ----------
// Every deck item has: id, label (spoken + shown), emoji or draw type, color theme
const DECKS = {
  animals: {
    title: "Animals",
    color: "coral",
    items: [
      { id: "cat", label: "Cat", emoji: "🐱" },
      { id: "dog", label: "Dog", emoji: "🐶" },
      { id: "cow", label: "Cow", emoji: "🐮" },
      { id: "duck", label: "Duck", emoji: "🦆" },
      { id: "fish", label: "Fish", emoji: "🐟" },
      { id: "bird", label: "Bird", emoji: "🐦" },
      { id: "elephant", label: "Elephant", emoji: "🐘" },
      { id: "lion", label: "Lion", emoji: "🦁" },
      { id: "bear", label: "Bear", emoji: "🐻" },
      { id: "frog", label: "Frog", emoji: "🐸" },
    ],
  },
  colors: {
    title: "Colors",
    color: "grape",
    items: [
      { id: "red", label: "Red", swatch: "#FF6B6B" },
      { id: "blue", label: "Blue", swatch: "#5FC9F3" },
      { id: "yellow", label: "Yellow", swatch: "#FFD93D" },
      { id: "green", label: "Green", swatch: "#6BCB77" },
      { id: "purple", label: "Purple", swatch: "#9B72CF" },
      { id: "orange", label: "Orange", swatch: "#FF9F45" },
      { id: "pink", label: "Pink", swatch: "#FF8FB1" },
      { id: "brown", label: "Brown", swatch: "#A9714B" },
    ],
  },
  numbers: {
    title: "Numbers",
    color: "grass",
    items: Array.from({ length: 10 }, (_, i) => ({
      id: "n" + (i + 1),
      label: String(i + 1),
      dots: i + 1,
    })),
  },
  shapes: {
    title: "Shapes",
    color: "sun",
    items: [
      { id: "circle", label: "Circle", shape: "circle" },
      { id: "square", label: "Square", shape: "square" },
      { id: "triangle", label: "Triangle", shape: "triangle" },
      { id: "star", label: "Star", shape: "star" },
      { id: "heart", label: "Heart", shape: "heart" },
      { id: "diamond", label: "Diamond", shape: "diamond" },
    ],
  },
  letters: {
    title: "Letters",
    color: "sky",
    items: "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((l) => ({
      id: "l" + l,
      label: l,
      letter: l,
    })),
  },
};

// Render a visual for any card item into a container element
function renderCardVisual(item, el) {
  el.innerHTML = "";
  if (item.emoji) {
    const s = document.createElement("div");
    s.className = "card-emoji";
    s.textContent = item.emoji;
    el.appendChild(s);
  } else if (item.swatch) {
    const s = document.createElement("div");
    s.className = "card-swatch";
    s.style.background = item.swatch;
    el.appendChild(s);
  } else if (item.dots) {
    const wrap = document.createElement("div");
    wrap.className = "card-dots";
    for (let i = 0; i < item.dots; i++) {
      const d = document.createElement("span");
      wrap.appendChild(d);
    }
    el.appendChild(wrap);
    const n = document.createElement("div");
    n.className = "card-number";
    n.textContent = item.label;
    el.appendChild(n);
  } else if (item.shape) {
    const s = document.createElement("div");
    s.className = "card-shape shape-" + item.shape;
    el.appendChild(s);
  } else if (item.letter) {
    const s = document.createElement("div");
    s.className = "card-letter";
    s.textContent = item.letter;
    el.appendChild(s);
  }
}
