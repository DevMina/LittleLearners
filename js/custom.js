// ---------- IndexedDB helper for custom cards (photos + audio blobs) ----------
const DB_NAME = "little_learners_custom";
const STORE = "cards";

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE, { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function dbGetAll() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

async function dbPut(card) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(card);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function dbDelete(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ---------- UI wiring ----------
const grid = document.getElementById("customGrid");
const emptyMsg = document.getElementById("emptyMsg");
const addModal = document.getElementById("addModal");
const viewModal = document.getElementById("viewModal");
const photoInput = document.getElementById("photoInput");
const photoPreview = document.getElementById("photoPreview");
const labelInput = document.getElementById("labelInput");
const recordBtn = document.getElementById("recordBtn");
const recordStatus = document.getElementById("recordStatus");
const audioPreview = document.getElementById("audioPreview");

let pendingPhotoDataUrl = null;
let pendingAudioBlob = null;
let mediaRecorder = null;
let recordedChunks = [];

async function refreshGrid() {
  const cards = await dbGetAll();
  grid.innerHTML = "";
  emptyMsg.style.display = cards.length ? "none" : "block";
  cards.forEach((card) => {
    const btn = document.createElement("button");
    btn.className = "tile custom-tile";
    btn.style.backgroundImage = `url(${card.photoDataUrl})`;
    btn.innerHTML = `<span class="custom-tile-label">${card.label}</span>`;
    btn.addEventListener("click", () => openView(card));
    grid.appendChild(btn);
  });
}

function resetForm() {
  pendingPhotoDataUrl = null;
  pendingAudioBlob = null;
  photoInput.value = "";
  labelInput.value = "";
  photoPreview.style.display = "none";
  audioPreview.style.display = "none";
  recordStatus.textContent = "";
}

document.getElementById("addBtn").addEventListener("click", () => {
  resetForm();
  addModal.style.display = "flex";
});
document.getElementById("cancelBtn").addEventListener("click", () => (addModal.style.display = "none"));

photoInput.addEventListener("change", () => {
  const file = photoInput.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    // Downscale to keep storage light
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const maxDim = 480;
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      pendingPhotoDataUrl = canvas.toDataURL("image/jpeg", 0.85);
      photoPreview.src = pendingPhotoDataUrl;
      photoPreview.style.display = "block";
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
});

// Hold-to-record for the spoken word
async function startRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    recordedChunks = [];
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.ondataavailable = (e) => recordedChunks.push(e.data);
    mediaRecorder.onstop = () => {
      pendingAudioBlob = new Blob(recordedChunks, { type: "audio/webm" });
      audioPreview.src = URL.createObjectURL(pendingAudioBlob);
      audioPreview.style.display = "block";
      stream.getTracks().forEach((t) => t.stop());
      recordStatus.textContent = "Recorded! Tap play to check it.";
    };
    mediaRecorder.start();
    recordStatus.textContent = "Recording… release to stop";
  } catch (e) {
    recordStatus.textContent = "Microphone access is needed to record a word.";
  }
}
function stopRecording() {
  if (mediaRecorder && mediaRecorder.state === "recording") mediaRecorder.stop();
}
["mousedown", "touchstart"].forEach((ev) => recordBtn.addEventListener(ev, (e) => { e.preventDefault(); startRecording(); }));
["mouseup", "mouseleave", "touchend", "touchcancel"].forEach((ev) => recordBtn.addEventListener(ev, stopRecording));

document.getElementById("saveBtn").addEventListener("click", async () => {
  if (!pendingPhotoDataUrl || !labelInput.value.trim()) {
    recordStatus.textContent = "Add a photo and a name first!";
    return;
  }
  const card = {
    id: "custom_" + Date.now(),
    label: labelInput.value.trim(),
    photoDataUrl: pendingPhotoDataUrl,
    audioBlob: pendingAudioBlob || null,
  };
  await dbPut(card);
  addModal.style.display = "none";
  playTone("win");
  refreshGrid();
});

// ---------- View / play / delete ----------
let currentViewCard = null;
function openView(card) {
  currentViewCard = card;
  document.getElementById("viewPhoto").src = card.photoDataUrl;
  document.getElementById("viewLabel").textContent = card.label;
  viewModal.style.display = "flex";
  playCardSound(card);
}
function playCardSound(card) {
  if (card.audioBlob) {
    const audio = new Audio(URL.createObjectURL(card.audioBlob));
    audio.play().catch(() => {});
  } else {
    speak(card.label);
  }
}
document.getElementById("viewPlayBtn").addEventListener("click", () => playCardSound(currentViewCard));
document.getElementById("viewCloseBtn").addEventListener("click", () => (viewModal.style.display = "none"));
document.getElementById("viewDeleteBtn").addEventListener("click", async () => {
  if (confirm("Delete this card?")) {
    await dbDelete(currentViewCard.id);
    viewModal.style.display = "none";
    refreshGrid();
  }
});

refreshGrid();
initSessionTimer();
