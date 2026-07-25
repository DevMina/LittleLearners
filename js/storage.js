// ---------- Progress & settings storage (localStorage) ----------
const LS_PROGRESS = "ll_progress_v1";
const LS_SETTINGS = "ll_settings_v1";

const DEFAULT_SETTINGS = {
  voiceName: "",       // "" = browser default
  rate: 0.85,
  volume: 1,
  sfx: true,
  sessionMinutes: 0,   // 0 = off
  enabledDecks: ["animals", "colors", "numbers", "shapes", "letters"],
  parentPin: "",        // if set, gate requires hold + this isn't a real pin, just hold-to-unlock
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

function getProgress() {
  try {
    const raw = localStorage.getItem(LS_PROGRESS);
    return raw ? JSON.parse(raw) : { decks: {}, games: {} };
  } catch (e) {
    return { decks: {}, games: {} };
  }
}

function saveProgress(p) {
  localStorage.setItem(LS_PROGRESS, JSON.stringify(p));
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
  saveProgress(p);
}

function getGameStars(gameKey, deckKey) {
  const p = getProgress();
  const key = gameKey + ":" + deckKey;
  return (p.games[key] && p.games[key].bestStars) || 0;
}

function resetAllProgress() {
  localStorage.removeItem(LS_PROGRESS);
}
