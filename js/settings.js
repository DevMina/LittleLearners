// ---------- Hold-to-unlock gate ----------
const holdBtn = document.getElementById("holdBtn");
const holdFill = document.getElementById("holdFill");
const lockScreen = document.getElementById("lockScreen");
const settingsPage = document.getElementById("settingsPage");
const HOLD_MS = 2000;
let holdTimer = null;
let holdStart = null;

function startHold() {
  holdStart = Date.now();
  holdFill.style.transition = `width ${HOLD_MS}ms linear`;
  requestAnimationFrame(() => (holdFill.style.width = "100%"));
  holdTimer = setTimeout(unlock, HOLD_MS);
}
function cancelHold() {
  clearTimeout(holdTimer);
  holdFill.style.transition = "width .2s ease";
  holdFill.style.width = "0%";
}
function unlock() {
  lockScreen.style.display = "none";
  settingsPage.style.display = "flex";
  initSettingsPage();
}
["mousedown", "touchstart"].forEach((ev) => holdBtn.addEventListener(ev, startHold));
["mouseup", "mouseleave", "touchend", "touchcancel"].forEach((ev) => holdBtn.addEventListener(ev, cancelHold));

// ---------- Settings panel ----------
function populateVoices() {
  const select = document.getElementById("voiceSelect");
  const voices = window.speechSynthesis ? window.speechSynthesis.getVoices() : [];
  const current = getSettings().voiceName;
  select.innerHTML = '<option value="">Default voice</option>';
  voices
    .filter((v) => v.lang.startsWith("en"))
    .forEach((v) => {
      const opt = document.createElement("option");
      opt.value = v.name;
      opt.textContent = v.name + (v.localService ? "" : " (online)");
      if (v.name === current) opt.selected = true;
      select.appendChild(opt);
    });
}

function initSettingsPage() {
  const s = getSettings();
  document.getElementById("rateRange").value = s.rate;
  document.getElementById("volumeRange").value = s.volume;
  document.getElementById("sfxCheck").checked = s.sfx;
  document.getElementById("sessionSelect").value = String(s.sessionMinutes);

  populateVoices();
  if (window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = populateVoices;
  }

  document.getElementById("voiceSelect").addEventListener("change", (e) => saveSettings({ voiceName: e.target.value }));
  document.getElementById("rateRange").addEventListener("input", (e) => saveSettings({ rate: parseFloat(e.target.value) }));
  document.getElementById("volumeRange").addEventListener("input", (e) => saveSettings({ volume: parseFloat(e.target.value) }));
  document.getElementById("sfxCheck").addEventListener("change", (e) => saveSettings({ sfx: e.target.checked }));
  document.getElementById("sessionSelect").addEventListener("change", (e) => saveSettings({ sessionMinutes: parseInt(e.target.value, 10) }));
  document.getElementById("testVoiceBtn").addEventListener("click", () => speak("Hi! This is how I sound."));

  // Deck toggles
  const list = document.getElementById("deckToggles");
  list.innerHTML = "";
  Object.keys(DECKS).forEach((key) => {
    const row = document.createElement("label");
    row.className = "settings-row";
    const enabled = s.enabledDecks.includes(key);
    row.innerHTML = `<span>${DECKS[key].title}</span><input type="checkbox" ${enabled ? "checked" : ""} data-deck="${key}">`;
    row.querySelector("input").addEventListener("change", (e) => {
      const cur = getSettings().enabledDecks;
      const next = e.target.checked ? [...new Set([...cur, key])] : cur.filter((k) => k !== key);
      saveSettings({ enabledDecks: next });
    });
    list.appendChild(row);
  });

  // Progress summary
  const progWrap = document.getElementById("progressSummary");
  progWrap.innerHTML = "";
  Object.keys(DECKS).forEach((key) => {
    const stars = getDeckStars(key);
    const row = document.createElement("div");
    row.className = "progress-row";
    row.innerHTML = `<span>${DECKS[key].title}</span><span>${stars ? "⭐ Complete" : "— Not yet"}</span>`;
    progWrap.appendChild(row);
  });

  document.getElementById("resetBtn").addEventListener("click", () => {
    if (confirm("Reset all stars and progress? This can't be undone.")) {
      resetAllProgress();
      initSettingsPage();
    }
  });

  document.getElementById("manageProfilesBtn").addEventListener("click", () => (location.href = "profiles.html"));

  document.getElementById("exportBtn").addEventListener("click", exportBackup);
  document.getElementById("importBtn").addEventListener("click", () => document.getElementById("importFile").click());
  document.getElementById("importFile").addEventListener("change", importBackup);
}

// ---------- Backup: export / import (settings + profiles + progress + custom cards) ----------
const CUSTOM_DB_NAME = "little_learners_custom";
const CUSTOM_STORE = "cards";

function openCustomDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(CUSTOM_DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(CUSTOM_STORE, { keyPath: "id" });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function getAllCustomCards() {
  const db = await openCustomDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CUSTOM_STORE, "readonly");
    const req = tx.objectStore(CUSTOM_STORE).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}
async function putCustomCard(card) {
  const db = await openCustomDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CUSTOM_STORE, "readwrite");
    tx.objectStore(CUSTOM_STORE).put(card);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function blobToBase64(blob) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}
function base64ToBlob(dataUrl) {
  return fetch(dataUrl).then((r) => r.blob());
}

async function exportBackup() {
  const status = document.getElementById("backupStatus");
  status.textContent = "Preparing backup…";
  const profiles = getProfiles();
  const progressByProfile = {};
  profiles.forEach((p) => {
    const raw = localStorage.getItem(LS_PROGRESS_PREFIX + p.id);
    if (raw) progressByProfile[p.id] = JSON.parse(raw);
  });
  const customCardsRaw = await getAllCustomCards();
  const customCards = await Promise.all(
    customCardsRaw.map(async (c) => ({
      ...c,
      audioBlob: undefined,
      audioBase64: c.audioBlob ? await blobToBase64(c.audioBlob) : null,
    }))
  );

  const backup = {
    exportedAt: new Date().toISOString(),
    settings: getSettings(),
    profiles,
    progressByProfile,
    customCards,
  };

  const blob = new Blob([JSON.stringify(backup)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "little-learners-backup.json";
  a.click();
  URL.revokeObjectURL(url);
  status.textContent = "Backup downloaded!";
}

async function importBackup(e) {
  const file = e.target.files[0];
  if (!file) return;
  const status = document.getElementById("backupStatus");
  status.textContent = "Importing…";
  try {
    const text = await file.text();
    const backup = JSON.parse(text);

    if (backup.settings) saveSettings(backup.settings);
    if (backup.profiles) saveProfiles(backup.profiles);
    if (backup.progressByProfile) {
      Object.entries(backup.progressByProfile).forEach(([pid, progress]) => {
        localStorage.setItem(LS_PROGRESS_PREFIX + pid, JSON.stringify(progress));
      });
    }
    if (backup.customCards) {
      for (const c of backup.customCards) {
        const card = { ...c };
        if (c.audioBase64) card.audioBlob = await base64ToBlob(c.audioBase64);
        delete card.audioBase64;
        await putCustomCard(card);
      }
    }
    status.textContent = "Backup restored! Reloading…";
    setTimeout(() => location.reload(), 1200);
  } catch (err) {
    status.textContent = "That backup file couldn't be read.";
  }
}
