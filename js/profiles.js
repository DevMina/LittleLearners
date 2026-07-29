// ---------- Multi-child profiles ----------
const LS_PROFILES = "ll_profiles_v1";
const LS_ACTIVE_PROFILE = "ll_active_profile_v1";

const AVATAR_OPTIONS = [
  { emoji: "🦊", color: "coral" },
  { emoji: "🐼", color: "teal" },
  { emoji: "🐸", color: "grass" },
  { emoji: "🦄", color: "grape" },
  { emoji: "🐯", color: "orange" },
  { emoji: "🐨", color: "sun" },
];

function getProfiles() {
  try {
    const raw = localStorage.getItem(LS_PROFILES);
    if (!raw) return [];
    const list = JSON.parse(raw);
    // "sky" used to be an avatar color option, but no .tile.sky CSS rule ever existed for it —
    // profile tiles saved with it rendered with no background at all. Heal those in place.
    let changed = false;
    list.forEach((p) => {
      if (p.color === "sky") { p.color = "teal"; changed = true; }
    });
    if (changed) saveProfiles(list);
    return list;
  } catch (e) {
    return [];
  }
}

function saveProfiles(list) {
  localStorage.setItem(LS_PROFILES, JSON.stringify(list));
}

function createProfile(name, avatar) {
  const list = getProfiles();
  const profile = { id: "p_" + Date.now(), name: name.trim(), emoji: avatar.emoji, color: avatar.color };
  list.push(profile);
  saveProfiles(list);
  return profile;
}

function updateProfile(id, patch) {
  const list = getProfiles();
  const idx = list.findIndex((p) => p.id === id);
  if (idx > -1) {
    list[idx] = { ...list[idx], ...patch };
    saveProfiles(list);
  }
}

function deleteProfile(id) {
  saveProfiles(getProfiles().filter((p) => p.id !== id));
  localStorage.removeItem(LS_PROGRESS_PREFIX + id);
  deleteCustomCardsForProfile(id).catch(() => {});
  if (getActiveProfileId() === id) setActiveProfileId(null);
}

// ---------- Clean up custom cards (photos/audio) tied to a deleted profile ----------
function _openCustomDBForCleanup() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("little_learners_custom", 1);
    req.onupgradeneeded = () => req.result.createObjectStore("cards", { keyPath: "id" });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function deleteCustomCardsForProfile(profileId) {
  const db = await _openCustomDBForCleanup();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("cards", "readwrite");
    const store = tx.objectStore("cards");
    const req = store.getAll();
    req.onsuccess = () => {
      (req.result || []).forEach((card) => {
        if (card.profileId === profileId) store.delete(card.id);
      });
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function getActiveProfileId() {
  return localStorage.getItem(LS_ACTIVE_PROFILE) || null;
}

function setActiveProfileId(id) {
  if (id) localStorage.setItem(LS_ACTIVE_PROFILE, id);
  else localStorage.removeItem(LS_ACTIVE_PROFILE);
}

function getActiveProfile() {
  const id = getActiveProfileId();
  return getProfiles().find((p) => p.id === id) || null;
}

// Redirect to the profile picker if nothing is selected yet. Call at the top of app pages.
function requireProfile() {
  const list = getProfiles();
  if (list.length === 0 || !getActiveProfile()) {
    window.location.href = "profiles.html";
    return false;
  }
  return true;
}
