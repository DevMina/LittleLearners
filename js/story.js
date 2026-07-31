if (!requireProfile()) { /* redirecting to profile picker */ }

// Reuses the same noun source decks as the Sentence Builder's word bank.
const STORY_NOUN_DECKS = ["animals", "food", "vehicles"];

// Simple 3-4 word sentence templates. Kept short and repetitive on purpose — this mode is
// for passive listening (car rides, winding down), not active building.
const STORY_TEMPLATES = [
  (n) => "I see a " + n + ".",
  (n) => "I like the " + n + ".",
  (n) => "A big " + n + "!",
  (n) => "Look, a " + n + "!",
  (n) => "The " + n + " is happy.",
];

const storyVisual = document.getElementById("storyVisual");
const storyText = document.getElementById("storyText");
const storyCounter = document.getElementById("storyCounter");
const playBtn = document.getElementById("playBtn");

let story = [];
let idx = 0;
let playing = false;
let autoTimer = null;

function buildStory(count) {
  const nouns = [];
  STORY_NOUN_DECKS.forEach((key) => {
    const deck = DECKS[key];
    if (deck) nouns.push(...deck.items);
  });
  const picks = shuffle(nouns).slice(0, count || 10);
  return picks.map((item) => {
    const tmpl = STORY_TEMPLATES[Math.floor(Math.random() * STORY_TEMPLATES.length)];
    return { item, text: tmpl(item.label.toLowerCase()) };
  });
}

function render() {
  const entry = story[idx];
  renderCardVisual(entry.item, storyVisual);
  storyText.textContent = entry.text;
  storyCounter.textContent = (idx + 1) + " / " + story.length;
}

function speakCurrent() {
  speak(story[idx].text);
}

function queueNext() {
  clearTimeout(autoTimer);
  speakCurrent();
  const words = story[idx].text.split(" ").length;
  const ms = Math.max(2200, words * 480) + 1000;
  autoTimer = setTimeout(() => {
    if (playing) goTo(1, true);
  }, ms);
}

function goTo(delta, keepPlaying) {
  idx = (idx + delta + story.length) % story.length;
  render();
  if (keepPlaying) queueNext();
}

function play() {
  playing = true;
  playBtn.textContent = "⏸ Pause";
  queueNext();
}

function pause() {
  playing = false;
  playBtn.textContent = "▶️ Play";
  clearTimeout(autoTimer);
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
}

playBtn.addEventListener("click", () => (playing ? pause() : play()));
document.getElementById("prevBtn").addEventListener("click", () => {
  const wasPlaying = playing;
  pause();
  idx = (idx - 1 + story.length) % story.length;
  render();
  if (wasPlaying) play();
});
document.getElementById("nextBtn").addEventListener("click", () => {
  const wasPlaying = playing;
  pause();
  goTo(1, false);
  if (wasPlaying) play();
});
document.getElementById("newStoryBtn").addEventListener("click", () => {
  const wasPlaying = playing;
  pause();
  story = buildStory();
  idx = 0;
  render();
  if (wasPlaying) play();
});

story = buildStory();
render();
play(); // passive "read to me" screen — starts automatically
markActivityToday();
initSessionTimer();
