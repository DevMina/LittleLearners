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

// Badges — a deck "graduates" once every item in it is reliably recalled, not just seen
const badgesWrap = document.getElementById("badgesSummary");
const masteredDecks = getMasteredDecks();
if (masteredDecks.length === 0) {
  badgesWrap.innerHTML = '<p class="backup-note">Keep practicing — a badge appears here once a whole deck is confidently mastered!</p>';
} else {
  masteredDecks.forEach((key) => {
    const badge = document.createElement("div");
    badge.className = "badge-chip";
    badge.innerHTML = `<span class="badge-emoji">🏆</span>${DECKS[key].title}`;
    badgesWrap.appendChild(badge);
  });
}

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
  const GAME_NAMES = { match: "Memory Match", find: "Find It!", count: "Count & Match", sort: "Sort It!" };
  gameEntries.forEach(([key, g]) => {
    const [game, deck] = key.split(":");
    const gameName = GAME_NAMES[game] || game;
    const deckName = deck.includes("-") && !DECKS[deck]
      ? deck.split("-").map((k) => (DECKS[k] ? DECKS[k].title : k)).join(" vs ")
      : (DECKS[deck] && DECKS[deck].title) || deck;
    const row = document.createElement("div");
    row.className = "progress-row";
    row.innerHTML = `<span>${gameName} · ${deckName}</span><span>${"⭐".repeat(g.bestStars)} (${g.plays} plays)</span>`;
    gamesWrap.appendChild(row);
  });
}

// Needs a little practice — real per-item mastery, not just deck completion
const weakItems = getWeakItems(getSettings().enabledDecks, 6);
if (weakItems.length > 0) {
  document.getElementById("weakSpotsGroup").style.display = "block";
  const weakWrap = document.getElementById("weakSpotsSummary");
  weakWrap.innerHTML = "";
  weakItems.forEach((w) => {
    const deckName = (DECKS[w.deckKey] && DECKS[w.deckKey].title) || w.deckKey;
    const row = document.createElement("div");
    row.className = "progress-row";
    row.innerHTML = `<span>${w.item.label} · ${deckName}</span><span>${Math.round(w.accuracy * 100)}% got it</span>`;
    weakWrap.appendChild(row);
  });
}

// ---------- Share progress ----------
// Builds a short plain-text summary from everything already computed above so a parent can
// send it to the other parent, a grandparent, etc. via whatever share targets the OS offers
// (Messages, WhatsApp, email...). Falls back to copying the text when Web Share isn't
// available (e.g. on desktop browsers).
function buildShareText() {
  const name = profile ? profile.name : "My child";
  const lines = [`${name}'s Little Learners progress:`];
  lines.push(streak > 0 ? `🔥 ${streak} day${streak === 1 ? "" : "s"} in a row!` : "Just getting started this week.");
  if (masteredDecks.length > 0) {
    lines.push(`🏆 Mastered: ${masteredDecks.map((k) => DECKS[k].title).join(", ")}`);
  }
  const totalSeen = Object.values(progress.decks || {}).reduce((sum, d) => sum + (d.seen ? d.seen.length : 0), 0);
  if (totalSeen > 0) lines.push(`📚 ${totalSeen} cards learned so far`);
  if (gameEntries.length > 0) lines.push(`🎮 ${gameEntries.length} game${gameEntries.length === 1 ? "" : "s"} played`);
  return lines.join("\n");
}

const shareStatus = document.getElementById("shareStatus");
document.getElementById("shareBtn").addEventListener("click", async () => {
  const text = buildShareText();
  if (navigator.share) {
    try {
      await navigator.share({ title: "Little Learners progress", text });
    } catch (e) { /* user cancelled the share sheet — nothing to report */ }
  } else if (navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(text);
      shareStatus.textContent = "Copied! Paste it into a message.";
    } catch (e) {
      shareStatus.textContent = "Couldn't copy — try again.";
    }
  } else {
    shareStatus.textContent = "Sharing isn't available on this browser.";
  }
});
