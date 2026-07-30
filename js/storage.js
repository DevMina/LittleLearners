// ---------- Progress (per-profile) & settings (per-device) storage ----------
const LS_PROGRESS_PREFIX = "ll_progress_v2:";
const LS_SETTINGS = "ll_settings_v1";

const DEFAULT_SETTINGS = {
  voiceName: "",       // "" = browser default
  rate: 0.85,
  volume: 1,
  sfx: true,
  sessionMinutes: 0,   // 0 = off
  enabledDecks: ["animals", "colors", "numbers", "shapes", "letters"],
};

function getSettings() {
  try {
    const raw = localStorage.getItem(LS_SETTINGS);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS };
  } catch (e) {
    return { ...DEFAULT_SETTINGS };
  }
}

function saveSettings(patch) {
  const next = { ...getSettings(), ...patch };
  localStorage.setItem(LS_SETTINGS, JSON.stringify(next));
  return next;
}

function _progressKey() {
  const id = typeof getActiveProfileId === "function" ? getActiveProfileId() : null;
  return LS_PROGRESS_PREFIX + (id || "default");
}

function getProgress() {
  try {
    const raw = localStorage.getItem(_progressKey());
    return raw ? JSON.parse(raw) : { decks: {}, games: {}, activityDates: [] };
  } catch (e) {
    return { decks: {}, games: {}, activityDates: [] };
  }
}

function saveProgress(p) {
  localStorage.setItem(_progressKey(), JSON.stringify(p));
}

function _todayStr() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

function recordActivityToday(p) {
  if (!p.activityDates) p.activityDates = [];
  const today = _todayStr();
  if (!p.activityDates.includes(today)) p.activityDates.push(today);
}

// Mark that a card was viewed in a deck; returns true if this completed the deck for the first time
function markCardSeen(deckKey, cardId, totalCount) {
  const p = getProgress();
  if (!p.decks[deckKey]) p.decks[deckKey] = { seen: [], stars: 0 };
  const d = p.decks[deckKey];
  if (!d.seen.includes(cardId)) d.seen.push(cardId);
  let justCompleted = false;
  if (d.seen.length >= totalCount && d.stars === 0) {
    d.stars = 1;
    justCompleted = true;
  }
  recordActivityToday(p);
  saveProgress(p);
  return justCompleted;
}

function getDeckStars(deckKey) {
  const p = getProgress();
  return (p.decks[deckKey] && p.decks[deckKey].stars) || 0;
}

// Record a game result; awards a star for a "great" run
function recordGameResult(gameKey, deckKey, won, quality) {
  const p = getProgress();
  const key = gameKey + ":" + deckKey;
  if (!p.games[key]) p.games[key] = { plays: 0, bestStars: 0 };
  p.games[key].plays++;
  if (won) p.games[key].bestStars = Math.max(p.games[key].bestStars, quality);
  recordActivityToday(p);
  saveProgress(p);
}

function getGameStars(gameKey, deckKey) {
  const p = getProgress();
  const key = gameKey + ":" + deckKey;
  return (p.games[key] && p.games[key].bestStars) || 0;
}

// Sum of every star earned across decks and games, used for mascot unlocks
function getTotalStars() {
  const p = getProgress();
  let total = 0;
  Object.values(p.decks || {}).forEach((d) => (total += d.stars || 0));
  Object.values(p.games || {}).forEach((g) => (total += g.bestStars || 0));
  return total;
}

// Consecutive-day streak, counting from today (or yesterday, if nothing logged yet today)
function getStreak() {
  const p = getProgress();
  const dates = new Set(p.activityDates || []);
  if (dates.size === 0) return 0;
  let streak = 0;
  let cursor = new Date();
  // if nothing today, see if yesterday keeps the streak alive; otherwise it's broken
  if (!dates.has(_dateStr(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!dates.has(_dateStr(cursor))) return 0;
  }
  while (dates.has(_dateStr(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function _dateStr(d) {
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

// Practice days within the last 7 calendar days (for the weekly digest)
function getWeekActivity() {
  const p = getProgress();
  const dates = new Set(p.activityDates || []);
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push({ label: d.toLocaleDateString(undefined, { weekday: "short" }), active: dates.has(_dateStr(d)) });
  }
  return days;
}

function resetAllProgress() {
  localStorage.removeItem(_progressKey());
}

// ---------- Per-item mastery tracking (real spaced repetition, not just deck stars) ----------
// Every time a game or the mic check can tell whether a *specific* item was recalled
// correctly or not, it calls recordItemResult. This lets us resurface the exact items a
// child struggles with (e.g. "frog") across every game, rather than just marking a whole
// deck "seen".
function recordItemResult(deckKey, itemId, correct) {
  const p = getProgress();
  if (!p.itemStats) p.itemStats = {};
  const key = deckKey + ":" + itemId;
  if (!p.itemStats[key]) p.itemStats[key] = { correct: 0, wrong: 0, lastSeen: 0 };
  const s = p.itemStats[key];
  if (correct) s.correct++;
  else s.wrong++;
  s.lastSeen = Date.now();
  recordActivityToday(p);
  saveProgress(p);
}

function getItemStats(deckKey, itemId) {
  const p = getProgress();
  const key = deckKey + ":" + itemId;
  return (p.itemStats && p.itemStats[key]) || { correct: 0, wrong: 0, lastSeen: 0 };
}

// Returns the weakest items across the given decks, ranked by accuracy (worst first),
// then by how long ago they were last seen. Only considers items with at least 2
// recorded attempts, so a single unlucky miss doesn't brand something "weak" forever.
function getWeakItems(deckKeys, limit) {
  const p = getProgress();
  const stats = p.itemStats || {};
  const results = [];
  (deckKeys || []).forEach((deckKey) => {
    const deck = typeof DECKS !== "undefined" && DECKS[deckKey];
    if (!deck) return;
    deck.items.forEach((item) => {
      const s = stats[deckKey + ":" + item.id];
      if (!s || s.correct + s.wrong < 2) return;
      const accuracy = s.correct / (s.correct + s.wrong);
      if (accuracy >= 0.85) return; // already solid, don't clutter review with it
      results.push({ deckKey, item, accuracy, attempts: s.correct + s.wrong, lastSeen: s.lastSeen });
    });
  });
  results.sort((a, b) => a.accuracy - b.accuracy || a.lastSeen - b.lastSeen);
  return typeof limit === "number" ? results.slice(0, limit) : results;
}

// A deck "graduates" (earns a mastery badge) once every item in it has been recalled
// reliably — at least 2 attempts and 85%+ accuracy — not just "seen" once like deck stars.
function isDeckMastered(deckKey) {
  const deck = typeof DECKS !== "undefined" && DECKS[deckKey];
  if (!deck || !deck.items || deck.items.length === 0) return false;
  const p = getProgress();
  const stats = p.itemStats || {};
  return deck.items.every((item) => {
    const s = stats[deckKey + ":" + item.id];
    return s && s.correct + s.wrong >= 2 && s.correct / (s.correct + s.wrong) >= 0.85;
  });
}

function getMasteredDecks() {
  if (typeof DECKS === "undefined") return [];
  return Object.keys(DECKS).filter(isDeckMastered);
}
