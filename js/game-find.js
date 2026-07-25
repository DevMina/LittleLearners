const deckKey3 = qparam("deck", "animals");
const srcDeck3 = DECKS[deckKey3] || DECKS.animals;
const TOTAL_ROUNDS = 8;

const board = document.getElementById("board");
const prompt = document.getElementById("prompt");
const scoreEl = document.getElementById("scoreCount");
const roundEl = document.getElementById("roundCount");
const winBanner = document.getElementById("winBanner");
const confettiHost = document.getElementById("confettiHost");
const diffRow = document.getElementById("difficultyRow");

let score = 0;
let round = 1;
let target = null;
let options = [];
let lock = false;
let numOptions = parseInt(localStorage.getItem("ll_find_difficulty") || "4", 10);

function setDifficulty(n) {
  numOptions = n;
  localStorage.setItem("ll_find_difficulty", String(n));
  [...diffRow.querySelectorAll(".diff-btn")].forEach((b) => b.classList.toggle("active", parseInt(b.dataset.n, 10) === n));
  board.className = "game-board find-grid opts-" + n;
  round = 1;
  score = 0;
  scoreEl.textContent = 0;
  newRound();
}

diffRow.querySelectorAll(".diff-btn").forEach((b) => b.addEventListener("click", () => setDifficulty(parseInt(b.dataset.n, 10))));

function newRound() {
  lock = false;
  const n = Math.min(numOptions, srcDeck3.items.length);
  options = shuffle(srcDeck3.items).slice(0, n);
  target = options[Math.floor(Math.random() * options.length)];
  roundEl.textContent = round;
  prompt.textContent = "Find the " + target.label;
  render();
  setTimeout(() => speak("Find the " + target.label), 250);
}

function render() {
  board.innerHTML = "";
  options.forEach((item) => {
    const btn = document.createElement("button");
    btn.className = "game-tile find-tile";
    if (item.emoji) btn.textContent = item.emoji;
    else if (item.swatch) btn.style.background = item.swatch;
    else btn.textContent = item.label;
    btn.addEventListener("click", () => choose(item, btn));
    board.appendChild(btn);
  });
}

function choose(item, btn) {
  if (lock) return;
  if (item.id === target.id) {
    lock = true;
    score++;
    scoreEl.textContent = score;
    playTone("correct");
    speak("Yes! " + item.label);
    btn.style.background = "#6BCB77";
    setTimeout(() => {
      if (round >= TOTAL_ROUNDS) {
        finish();
      } else {
        round++;
        newRound();
      }
    }, 700);
  } else {
    playTone("wrong");
    btn.classList.add("wrong");
    speak("Try again!");
    setTimeout(() => btn.classList.remove("wrong"), 400);
  }
}

function finish() {
  winBanner.style.display = "flex";
  document.getElementById("winStats").textContent = "You scored " + score + " out of " + TOTAL_ROUNDS + "!";
  playTone("win");
  confettiBurst(confettiHost);
  speak("All done! You scored " + score + " out of " + TOTAL_ROUNDS);
  const quality = score >= 7 ? 3 : score >= 5 ? 2 : 1;
  recordGameResult("find", deckKey3, true, quality);
}

document.getElementById("repeatBtn").addEventListener("click", () => speak("Find the " + target.label));
document.getElementById("playAgainBtn").addEventListener("click", () => {
  score = 0;
  round = 1;
  scoreEl.textContent = 0;
  winBanner.style.display = "none";
  newRound();
});

setDifficulty(numOptions);
initSessionTimer();
