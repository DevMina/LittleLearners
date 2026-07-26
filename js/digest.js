if (!requireProfile()) { /* redirecting to profile picker */ }

const profile = getActiveProfile();
if (profile) document.getElementById("digestTitle").textContent = profile.name + "'s Progress";

// Week activity strip
const weekRow = document.getElementById("weekRow");
getWeekActivity().forEach((day) => {
  const cell = document.createElement("div");
  cell.className = "week-cell" + (day.active ? " active" : "");
  cell.textContent = day.label[0];
  weekRow.appendChild(cell);
});

const streak = getStreak();
document.getElementById("streakLine").textContent =
  streak > 0 ? "🔥 " + streak + " day" + (streak === 1 ? "" : "s") + " in a row!" : "Play today to start a streak!";

// Decks
const decksWrap = document.getElementById("decksSummary");
const progress = getProgress();
Object.keys(DECKS).forEach((key) => {
  const d = progress.decks && progress.decks[key];
  const seen = d ? d.seen.length : 0;
  const total = DECKS[key].items.length;
  const row = document.createElement("div");
  row.className = "progress-row";
  row.innerHTML = `<span>${DECKS[key].title}</span><span>${d && d.stars ? "⭐ " : ""}${seen}/${total}</span>`;
  decksWrap.appendChild(row);
});

// Games
const gamesWrap = document.getElementById("gamesSummary");
const gameEntries = Object.entries(progress.games || {});
if (gameEntries.length === 0) {
  gamesWrap.innerHTML = '<div class="progress-row"><span>No games played yet</span></div>';
} else {
  gameEntries.forEach(([key, g]) => {
    const [game, deck] = key.split(":");
    const gameName = game === "match" ? "Memory Match" : "Find It!";
    const deckName = (DECKS[deck] && DECKS[deck].title) || deck;
    const row = document.createElement("div");
    row.className = "progress-row";
    row.innerHTML = `<span>${gameName} · ${deckName}</span><span>${"⭐".repeat(g.bestStars)} (${g.plays} plays)</span>`;
    gamesWrap.appendChild(row);
  });
}
