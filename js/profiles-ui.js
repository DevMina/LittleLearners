const grid = document.getElementById("profileGrid");
const modal = document.getElementById("profileModal");
const nameInput = document.getElementById("nameInput");
const avatarPicker = document.getElementById("avatarPicker");
const modalTitle = document.getElementById("modalTitle");
const deleteBtn = document.getElementById("modalDeleteBtn");

let manageMode = false;
let selectedAvatar = AVATAR_OPTIONS[0];
let editingId = null;

function renderGrid() {
  const profiles = getProfiles();
  grid.innerHTML = "";
  profiles.forEach((p) => {
    const btn = document.createElement("button");
    btn.className = "tile profile-tile " + p.color;
    btn.innerHTML = `<span class="tile-emoji">${p.emoji}</span>${p.name}${manageMode ? '<span class="edit-badge">✏️</span>' : ""}`;
    btn.addEventListener("click", () => {
      if (manageMode) openModal(p);
      else selectProfile(p.id);
    });
    grid.appendChild(btn);
  });
  const addBtn = document.createElement("button");
  addBtn.className = "tile add-tile";
  addBtn.innerHTML = `<span class="tile-emoji">➕</span>Add learner`;
  addBtn.addEventListener("click", () => openModal(null));
  grid.appendChild(addBtn);
}

function selectProfile(id) {
  setActiveProfileId(id);
  playTone("tap");
  location.href = "index.html";
}

document.getElementById("manageBtn").addEventListener("click", () => {
  manageMode = !manageMode;
  document.getElementById("manageBtn").textContent = manageMode ? "✅ Done managing" : "✏️ Manage profiles";
  renderGrid();
});

function openModal(profile) {
  editingId = profile ? profile.id : null;
  modalTitle.textContent = profile ? "Edit learner" : "New learner";
  nameInput.value = profile ? profile.name : "";
  selectedAvatar = profile ? { emoji: profile.emoji, color: profile.color } : AVATAR_OPTIONS[0];
  deleteBtn.style.display = profile ? "block" : "none";
  buildAvatarPicker();
  modal.style.display = "flex";
}

function buildAvatarPicker() {
  avatarPicker.innerHTML = "";
  AVATAR_OPTIONS.forEach((opt) => {
    const b = document.createElement("button");
    b.className = "avatar-opt " + opt.color + (opt.emoji === selectedAvatar.emoji ? " selected" : "");
    b.textContent = opt.emoji;
    b.addEventListener("click", () => {
      selectedAvatar = opt;
      buildAvatarPicker();
    });
    avatarPicker.appendChild(b);
  });
}

document.getElementById("modalCancelBtn").addEventListener("click", () => (modal.style.display = "none"));
document.getElementById("modalSaveBtn").addEventListener("click", () => {
  const name = nameInput.value.trim();
  if (!name) return;
  if (editingId) updateProfile(editingId, { name, emoji: selectedAvatar.emoji, color: selectedAvatar.color });
  else createProfile(name, selectedAvatar);
  modal.style.display = "none";
  renderGrid();
});
deleteBtn.addEventListener("click", () => {
  if (confirm("Delete this learner and all their progress?")) {
    deleteProfile(editingId);
    modal.style.display = "none";
    renderGrid();
  }
});

renderGrid();
