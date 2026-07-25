const canvas = document.getElementById("traceCanvas");
const ctx = canvas.getContext("2d");
const modeBtn = document.getElementById("modeBtn");
const winBanner = document.getElementById("winBanner");
const confettiHost = document.getElementById("confettiHost");

let mode = qparam("mode", "letters"); // "letters" or "numbers"
let sequence = mode === "numbers" ? "123456789".split("") : "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
let idx = 0;
let drawing = false;

function setMode(m) {
  mode = m;
  sequence = mode === "numbers" ? "123456789".split("") : "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  modeBtn.textContent = mode === "numbers" ? "🔢 Numbers" : "🔤 Letters";
  idx = 0;
  drawGuide();
}

modeBtn.addEventListener("click", () => setMode(mode === "letters" ? "numbers" : "letters"));

function drawGuide() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.font = "800 300px 'Baloo 2', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#E4ECF5";
  ctx.strokeStyle = "#C7D6E8";
  ctx.lineWidth = 3;
  const ch = sequence[idx];
  ctx.fillText(ch, canvas.width / 2, canvas.height / 2 + 10);
  ctx.strokeText(ch, canvas.width / 2, canvas.height / 2 + 10);
  speak(mode === "numbers" ? "Number " + ch : "Letter " + ch);
}

function posFromEvent(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const point = e.touches ? e.touches[0] : e;
  return { x: (point.clientX - rect.left) * scaleX, y: (point.clientY - rect.top) * scaleY };
}

function startDraw(e) {
  drawing = true;
  const p = posFromEvent(e);
  ctx.beginPath();
  ctx.moveTo(p.x, p.y);
  e.preventDefault();
}
function moveDraw(e) {
  if (!drawing) return;
  const p = posFromEvent(e);
  ctx.strokeStyle = "#FF6B6B";
  ctx.lineWidth = 14;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineTo(p.x, p.y);
  ctx.stroke();
  e.preventDefault();
}
function endDraw() {
  drawing = false;
}

canvas.addEventListener("mousedown", startDraw);
canvas.addEventListener("mousemove", moveDraw);
window.addEventListener("mouseup", endDraw);
canvas.addEventListener("touchstart", startDraw, { passive: false });
canvas.addEventListener("touchmove", moveDraw, { passive: false });
canvas.addEventListener("touchend", endDraw);

document.getElementById("clearBtn").addEventListener("click", drawGuide);
document.getElementById("prevBtn").addEventListener("click", () => {
  idx = (idx - 1 + sequence.length) % sequence.length;
  drawGuide();
});
document.getElementById("nextBtn").addEventListener("click", () => {
  idx = (idx + 1) % sequence.length;
  drawGuide();
});

function celebrate() {
  winBanner.style.display = "flex";
  document.getElementById("winStats").textContent = "You traced the " + (mode === "numbers" ? "number " : "letter ") + sequence[idx] + "!";
  playTone("win");
  confettiBurst(confettiHost);
  speak("Great tracing!");
}

document.getElementById("doneBtn").addEventListener("click", celebrate);
document.getElementById("nextLetterBtn").addEventListener("click", () => {
  winBanner.style.display = "none";
  idx = (idx + 1) % sequence.length;
  drawGuide();
});

setMode(mode);
initSessionTimer();
