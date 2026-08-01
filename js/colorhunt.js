if (!requireProfile()) { /* redirecting to profile picker */ }

// The Colors deck is just abstract swatches (no linked objects), so real-world color
// associations are authored here — this is what actually puts that deck to use in a game.
const COLOR_OBJECTS = {
  red: ["🍎", "🍓", "🌹", "🚒"],
  yellow: ["🍌", "⭐", "🌻", "🐤"],
  green: ["🐸", "🥦", "🌳", "🍀"],
  purple: ["🍇", "🍆", "🔮", "👾"],
  orange: ["🍊", "🥕", "🦊", "🎃"],
  pink: ["🌸", "🐷", "🦩", "🎀"],
  brown: ["🐻", "🌰", "🍫", "🦫"],
  black: ["🎩", "🦇", "🎱", "🕶️"],
};

const ROUNDS = 10;
const colorItems = DECKS.colors.items;

const scoreEl = document.getElementById("scoreCount");
const roundEl = document.getElementById("roundCount");
const roundTotalEl = document.getElementById("roundTotal");
const prompt = document.getElementById("prompt");
const picStage = document.getElementById("picStage");
const board = document.getElementById("board");
const winBanner = document.getElementById("winBanner");
const confettiHost = document.getElementById("confettiHost");

roundTotalEl.textContent = ROUNDS;

let score = 0;
let round = 1;
let target = null;         // a colors deck item (swatch + label)
let correctEmoji = null;
let missesThisRound = 0;
let lock = false;
let lastItemId = null;

function pickTarget() {
  let item = colorItems[Math.floor(Math.random() * colorItems.length)];
  if (item.id === lastItemId) {
    item = colorItems[Math.floor(Math.random() * colorItems.length)];
  }
  lastItemId = item.id;
  target = item;
  const objects = COLOR_OBJECTS[item.id];
  correctEmoji = objects[Math.floor(Math.random() * objects.length)];
}

function buildChoices() {
  const otherColors = colorItems.filter((it) => it.id !== target.id);
  const distractors = [];
  const usedColors = shuffle(otherColors).slice(0, 3);
  usedColors.forEach((c) => {
    const objects = COLOR_OBJECTS[c.id];
    distractors.push(objects[Math.floor(Math.random() * objects.length)]);
  });
  return shuffle([correctEmoji, ...distractors]);
}

function newRound() {
  lock = false;
  missesThisRound = 0;
  pickTarget();
  roundEl.textContent = round;
  prompt.textContent = "Find something " + target.label + "!";
  renderCardVisual(target, picStage);

  board.innerHTML = "";
  buildChoices().forEach((emoji) => {
    const btn = document.createElement("button");
    btn.className = "game-tile find-tile";
    btn.setAttribute("aria-label", emoji);
    btn.textContent = emoji;
    btn.addEventListener("click", () => chooseOption(emoji, btn));
    board.appendChild(btn);
  });

  setTimeout(() => speak("Find something " + target.label + "!"), 250);
}

function chooseOption(emoji, btn) {
  if (lock) return;
  if (emoji === correctEmoji) {
    lock = true;
    score++;
    scoreEl.textContent = score;
    playTone("correct");
    speak("Yes! That's " + target.label + "!");
    btn.style.background = "#6BCB77";
    recordItemResult("colors", target.id, missesThisRound === 0);
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
  recordGameResult("colorhunt", "colors", true, quality);
}

document.getElementById("repeatBtn").addEventListener("click", () => speak("Find something " + target.label + "!"));
document.getElementById("playAgainBtn").addEventListener("click", () => {
  winBanner.style.display = "none";
  score = 0;
  round = 1;
  scoreEl.textContent = 0;
  newRound();
});

newRound();
initSessionTimer();
