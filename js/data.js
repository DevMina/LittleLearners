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
      { id: "monkey", label: "Monkey", emoji: "🐒" },
      { id: "horse", label: "Horse", emoji: "🐴" },
      { id: "pig", label: "Pig", emoji: "🐷" },
      { id: "sheep", label: "Sheep", emoji: "🐑" },
      { id: "rabbit", label: "Rabbit", emoji: "🐰" },
      { id: "tiger", label: "Tiger", emoji: "🐯" },
      { id: "zebra", label: "Zebra", emoji: "🦓" },
      { id: "giraffe", label: "Giraffe", emoji: "🦒" },
      { id: "penguin", label: "Penguin", emoji: "🐧" },
      { id: "owl", label: "Owl", emoji: "🦉" },
    ],
  },
  colors: {
    title: "Colors",
    color: "grape",
    items: [
      { id: "red", label: "Red", swatch: "#FF6B6B" },
      { id: "yellow", label: "Yellow", swatch: "#FFD93D" },
      { id: "green", label: "Green", swatch: "#6BCB77" },
      { id: "purple", label: "Purple", swatch: "#9B72CF" },
      { id: "orange", label: "Orange", swatch: "#FF9F45" },
      { id: "pink", label: "Pink", swatch: "#FF8FB1" },
      { id: "brown", label: "Brown", swatch: "#A9714B" },
      { id: "black", label: "Black", swatch: "#3A3A3A" },
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
    color: "teal",
    items: "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((l) => ({
      id: "l" + l,
      label: l,
      letter: l,
    })),
  },
  vehicles: {
    title: "Vehicles",
    color: "magenta",
    items: [
      { id: "car", label: "Car", emoji: "🚗" },
      { id: "bus", label: "Bus", emoji: "🚌" },
      { id: "truck", label: "Truck", emoji: "🚚" },
      { id: "train", label: "Train", emoji: "🚂" },
      { id: "plane", label: "Airplane", emoji: "✈️" },
      { id: "boat", label: "Boat", emoji: "⛵" },
      { id: "bike", label: "Bike", emoji: "🚲" },
      { id: "helicopter", label: "Helicopter", emoji: "🚁" },
    ],
  },
  food: {
    title: "Food",
    color: "orange",
    items: [
      { id: "apple", label: "Apple", emoji: "🍎" },
      { id: "banana", label: "Banana", emoji: "🍌" },
      { id: "bread", label: "Bread", emoji: "🍞" },
      { id: "milk", label: "Milk", emoji: "🥛" },
      { id: "cheese", label: "Cheese", emoji: "🧀" },
      { id: "egg", label: "Egg", emoji: "🥚" },
      { id: "carrot", label: "Carrot", emoji: "🥕" },
      { id: "cookie", label: "Cookie", emoji: "🍪" },
    ],
  },
  bodyParts: {
    title: "Body Parts",
    color: "rose",
    items: [
      { id: "head", label: "Head", emoji: "🧑" },
      { id: "eye", label: "Eye", emoji: "👁️" },
      { id: "nose", label: "Nose", emoji: "👃" },
      { id: "ear", label: "Ear", emoji: "👂" },
      { id: "hand", label: "Hand", emoji: "✋" },
      { id: "foot", label: "Foot", emoji: "🦶" },
      { id: "mouth", label: "Mouth", emoji: "👄" },
      { id: "tummy", label: "Tummy", emoji: "🫃" },
    ],
  },
  emotions: {
    title: "Feelings",
    color: "peach",
    items: [
      { id: "happy", label: "Happy", emoji: "😄" },
      { id: "sad", label: "Sad", emoji: "😢" },
      { id: "angry", label: "Angry", emoji: "😠" },
      { id: "scared", label: "Scared", emoji: "😨" },
      { id: "sleepy", label: "Sleepy", emoji: "😴" },
      { id: "surprised", label: "Surprised", emoji: "😲" },
      { id: "silly", label: "Silly", emoji: "🤪" },
      { id: "excited", label: "Excited", emoji: "🤩" },
    ],
  },
  opposites: {
    title: "Opposites",
    color: "olive",
    items: [
      { id: "big", label: "Big", emoji: "🐘" },
      { id: "small", label: "Small", emoji: "🐜" },
      { id: "up", label: "Up", emoji: "⬆️" },
      { id: "down", label: "Down", emoji: "⬇️" },
      { id: "hot", label: "Hot", emoji: "🔥" },
      { id: "cold", label: "Cold", emoji: "❄️" },
      { id: "fast", label: "Fast", emoji: "🐆" },
      { id: "slow", label: "Slow", emoji: "🐢" },
      { id: "full", label: "Full", emoji: "🥤" },
      { id: "empty", label: "Empty", emoji: "🫙" },
    ],
  },
  sightWords: {
    title: "First Words",
    color: "tan",
    items: ["I", "see", "a", "the", "like", "go", "big", "no", "yes", "up"].map((w) => ({
      id: "sw_" + w,
      label: w,
      letter: w,
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
    if (item.letter.length > 2) s.classList.add("card-letter-word");
    s.textContent = item.letter;
    el.appendChild(s);
  }
}
