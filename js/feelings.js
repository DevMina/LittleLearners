if (!requireProfile()) { /* redirecting to profile picker */ }

// A short everyday scenario for each feeling in the deck — the child hears/reads the
// situation and picks the matching face, rather than just matching a word to a face.
const SCENARIOS = {
  happy: "You got a new toy!",
  sad: "Your ice cream fell on the ground.",
  angry: "Someone took your toy.",
  scared: "You heard a loud thunder!",
  sleepy: "It's time for bed.",
  surprised: "Surprise! It's a party for you!",
  silly: "You're making a funny face!",
  excited: "We're going to the park!",
};

const ROUNDS = 10;
const feelingItems = DECKS.emotions.items;

const scoreEl = document.getElementById("scoreCount");
const roundEl = document.getElementById("roundCount");
const roundTotalEl = document.getElementById("roundTotal");
const prompt = document.getElementById("prompt");
const board = document.getElementById("board");
const winBanner = document.getElementById("winBanner");
const confettiHost = document.getElementById("confettiHost");

roundTotalEl.textContent = ROUNDS;

let score = 0;
let round = 1;
let target = null;
let missesThisRound = 0;
let lock = false;
let lastItemId = null;

function pickTarget() {
  let item = feelingItems[Math.floor(Math.random() * feelingItems.length)];
  if (item.id === lastItemId) {
    item = feelingItems[Math.floor(Math.random() * feelingItems.length)];
  }
  lastItemId = item.id;
  target = item;
}

function buildChoices() {
  const pool = feelingItems.filter((it) => it.id !== target.id);
  const distractors = shuffle(pool).slice(0, 3);
  return shuffle([target, ...distractors]);
}

function newRound() {
  lock = false;
  missesThisRound = 0;
  pickTarget();
  roundEl.textContent = round;
  const scenario = SCENARIOS[target.id] || "How do you feel?";
  prompt.textContent = scenario;

  board.innerHTML = "";
  buildChoices().forEach((item) => {
    const btn = document.createElement("button");
    btn.className = "game-tile find-tile";
    btn.setAttribute("aria-label", item.label);
    btn.textContent = item.emoji;
    btn.addEventListener("click", () => chooseOption(item, btn));
    board.appendChild(btn);
  });

  setTimeout(() => speak(scenario), 250);
}

function chooseOption(item, btn) {
  if (lock) return;
  if (item.id === target.id) {
    lock = true;
    score++;
    scoreEl.textContent = score;
    playTone("correct");
    speak("That's " + target.label + "!");
    btn.style.background = "#6BCB77";
    recordItemResult("emotions", target.id, missesThisRound === 0);
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
  recordGameResult("feelings", "emotions", true, quality);
}

document.getElementById("repeatBtn").addEventListener("click", () => speak(SCENARIOS[target.id] || "How do you feel?"));
document.getElementById("playAgainBtn").addEventListener("click", () => {
  winBanner.style.display = "none";
  score = 0;
  round = 1;
  scoreEl.textContent = 0;
  newRound();
});

newRound();
initSessionTimer();
