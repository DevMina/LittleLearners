if (!requireProfile()) { /* redirecting to profile picker */ }

const STARTERS = [
  "I", "you", "we", "see", "like", "want", "have",
  "a", "the", "my",
  "big", "small", "no", "yes", "not",
  "and", "is",
  "go", "up", "down",
];
const NOUN_SOURCE_DECKS = ["animals", "food", "vehicles"];

const strip = document.getElementById("sentenceStrip");
const placeholder = document.getElementById("placeholder");
const starterBank = document.getElementById("starterBank");
const nounBank = document.getElementById("nounBank");

let sentence = [];

function addWord(word, emoji) {
  sentence.push({ word, emoji });
  playTone("tap");
  render();
}

function render() {
  strip.innerHTML = "";
  if (sentence.length === 0) {
    strip.appendChild(placeholder);
    return;
  }
  sentence.forEach((w, i) => {
    const chip = document.createElement("button");
    chip.className = "sentence-chip";
    chip.innerHTML = (w.emoji ? w.emoji + " " : "") + w.word;
    chip.addEventListener("click", () => {
      sentence.splice(i, 1);
      render();
    });
    strip.appendChild(chip);
  });
}

document.getElementById("clearBtn").addEventListener("click", () => {
  sentence = [];
  render();
});

document.getElementById("sayBtn").addEventListener("click", () => {
  if (sentence.length === 0) return;
  speak(sentence.map((w) => w.word).join(" "));
});

// Build starter word bank
STARTERS.forEach((w) => {
  const btn = document.createElement("button");
  btn.className = "word-chip";
  btn.textContent = w;
  btn.addEventListener("click", () => addWord(w));
  starterBank.appendChild(btn);
});

// Build noun bank from a handful of existing decks
NOUN_SOURCE_DECKS.forEach((key) => {
  const deck = DECKS[key];
  if (!deck) return;
  deck.items.slice(0, 6).forEach((item) => {
    const btn = document.createElement("button");
    btn.className = "word-chip";
    btn.innerHTML = (item.emoji || "") + " " + item.label;
    btn.addEventListener("click", () => addWord(item.label.toLowerCase(), item.emoji));
    nounBank.appendChild(btn);
  });
});

render();
initSessionTimer();
