if (!requireProfile()) { /* redirecting to profile picker */ }

// Words grouped by rhyming sound rather than topic, so this lives outside DECKS/data.js.
// Each family has 2-3 words; a round always needs at least 2 words per family so there's
// a real rhyming partner for the target.
const RHYME_FAMILIES = [
  [{ word: "Cat", emoji: "🐱" }, { word: "Hat", emoji: "🎩" }, { word: "Bat", emoji: "🦇" }],
  [{ word: "Dog", emoji: "🐶" }, { word: "Frog", emoji: "🐸" }, { word: "Log", emoji: "🪵" }],
  [{ word: "Sun", emoji: "☀️" }, { word: "Bun", emoji: "🥯" }],
  [{ word: "Pig", emoji: "🐷" }, { word: "Twig", emoji: "🌿" }],
  [{ word: "Car", emoji: "🚗" }, { word: "Star", emoji: "⭐" }, { word: "Jar", emoji: "🫙" }],
  [{ word: "Bee", emoji: "🐝" }, { word: "Tree", emoji: "🌳" }, { word: "Key", emoji: "🔑" }],
  [{ word: "Moon", emoji: "🌙" }, { word: "Spoon", emoji: "🥄" }, { word: "Balloon", emoji: "🎈" }],
  [{ word: "Cake", emoji: "🎂" }, { word: "Snake", emoji: "🐍" }],
  [{ word: "House", emoji: "🏠" }, { word: "Mouse", emoji: "🐭" }],
  [{ word: "King", emoji: "🤴" }, { word: "Ring", emoji: "💍" }],
];

const ROUNDS = 10;

const scoreEl = document.getElementById("scoreCount");
const roundEl = document.getElementById("roundCount");
const roundTotalEl = document.getElementById("roundTotal");
const prompt = document.getElementById("prompt");
const picStage = document.getElementById("picStage");
const targetWordEl = document.getElementById("targetWord");
const board = document.getElementById("board");
const winBanner = document.getElementById("winBanner");
const confettiHost = document.getElementById("confettiHost");

roundTotalEl.textContent = ROUNDS;

let score = 0;
let round = 1;
let target = null;         // { word, emoji, id }
let correctAnswer = null;
let missesThisRound = 0;
let lock = false;
let lastFamilyIndex = -1;

function pickTarget() {
  let famIndex = Math.floor(Math.random() * RHYME_FAMILIES.length);
  if (famIndex === lastFamilyIndex) {
    famIndex = (famIndex + 1) % RHYME_FAMILIES.length;
  }
  lastFamilyIndex = famIndex;
  const family = RHYME_FAMILIES[famIndex];
  const indices = shuffle(family.map((_, i) => i)).slice(0, 2);
  target = { ...family[indices[0]], id: famIndex + "-" + indices[0] };
  correctAnswer = { ...family[indices[1]], id: famIndex + "-" + indices[1] };
}

function buildChoices() {
  const otherWords = [];
  RHYME_FAMILIES.forEach((family, fi) => {
    if (fi === lastFamilyIndex) return;
    family.forEach((w, wi) => otherWords.push({ ...w, id: fi + "-" + wi }));
  });
  const distractors = shuffle(otherWords).slice(0, 3);
  return shuffle([correctAnswer, ...distractors]);
}

function newRound() {
  lock = false;
  missesThisRound = 0;
  pickTarget();
  roundEl.textContent = round;
  prompt.textContent = "Which one rhymes with " + target.word + "?";
  renderCardVisual({ emoji: target.emoji }, picStage);
  targetWordEl.textContent = target.word;

  board.innerHTML = "";
  buildChoices().forEach((item) => {
    const btn = document.createElement("button");
    btn.className = "game-tile find-tile rhyme-tile";
    btn.setAttribute("aria-label", item.word);
    btn.innerHTML = `<span class="rhyme-emoji">${item.emoji}</span><span class="rhyme-word">${item.word}</span>`;
    btn.addEventListener("click", () => chooseOption(item, btn));
    board.appendChild(btn);
  });

  setTimeout(() => speak("Which one rhymes with " + target.word + "?"), 250);
}

function chooseOption(item, btn) {
  if (lock) return;
  if (item.id === correctAnswer.id) {
    lock = true;
    score++;
    scoreEl.textContent = score;
    playTone("correct");
    speak(correctAnswer.word + " rhymes with " + target.word + "!");
    btn.style.background = "#6BCB77";
    setTimeout(advance, 900);
  } else {
    missesThisRound++;
    playTone("wrong");
    btn.classList.add("wrong");
    speak("Try again!");
    setTimeout(() => btn.classList.remove("wrong"), 400);
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
  recordGameResult("rhyme", "rhyme", true, quality);
}

document.getElementById("repeatBtn").addEventListener("click", () => speak("Which one rhymes with " + target.word + "?"));
document.getElementById("playAgainBtn").addEventListener("click", () => {
  winBanner.style.display = "none";
  score = 0;
  round = 1;
  scoreEl.textContent = 0;
  newRound();
});

newRound();
initSessionTimer();
