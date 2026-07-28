if (!requireProfile()) { /* redirecting to profile picker */ }

const canvas = document.getElementById("traceCanvas");
const ctx = canvas.getContext("2d");
const modeLettersBtn = document.getElementById("modeLettersBtn");
const modeNumbersBtn = document.getElementById("modeNumbersBtn");
const winBanner = document.getElementById("winBanner");
const confettiHost = document.getElementById("confettiHost");

let mode = qparam("mode", "letters"); // "letters" or "numbers"
let sequence = mode === "numbers" ? "123456789".split("") : "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
let idx = 0;
let drawing = false;
let hasDrawnAnything = false;

// Masks used to check tracing accuracy against the guide letter's actual shape.
// coreMask = the letter's own silhouette (for measuring how much of it got covered).
// tolMask  = the letter silhouette dilated outward (for measuring how "on target" strokes were,
//            with enough slack for a small child's imprecise finger tracing).
let coreMask = null;
let tolMask = null;

const GUIDE_FONT = "800 300px 'Baloo 2', sans-serif";

function buildMasks(ch) {
  const w = canvas.width, h = canvas.height;
  const off = document.createElement("canvas");
  off.width = w; off.height = h;
  const octx = off.getContext("2d");
  octx.font = GUIDE_FONT;
  octx.textAlign = "center";
  octx.textBaseline = "middle";

  octx.clearRect(0, 0, w, h);
  octx.fillStyle = "#000000";
  octx.fillText(ch, w / 2, h / 2 + 10);
  const core = octx.getImageData(0, 0, w, h);

  octx.clearRect(0, 0, w, h);
  octx.lineWidth = 20; // dilation buffer beyond the letter's own strokes (kept tight — the previous 46px buffer covered ~41% of the whole canvas, letting scribbles anywhere near the middle pass)
  octx.strokeStyle = "#000000";
  octx.fillStyle = "#000000";
  octx.strokeText(ch, w / 2, h / 2 + 10);
  octx.fillText(ch, w / 2, h / 2 + 10);
  const tol = octx.getImageData(0, 0, w, h);

  return { core, tol };
}

function setMode(m) {
  mode = m;
  sequence = mode === "numbers" ? "123456789".split("") : "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  modeLettersBtn.classList.toggle("active", mode === "letters");
  modeNumbersBtn.classList.toggle("active", mode === "numbers");
  idx = 0;
  drawGuide();
}

modeLettersBtn.addEventListener("click", () => setMode("letters"));
modeNumbersBtn.addEventListener("click", () => setMode("numbers"));

function drawGuide() {
  hasDrawnAnything = false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.font = GUIDE_FONT;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#E4ECF5";
  ctx.strokeStyle = "#C7D6E8";
  ctx.lineWidth = 3;
  const ch = sequence[idx];
  ctx.fillText(ch, canvas.width / 2, canvas.height / 2 + 10);
  ctx.strokeText(ch, canvas.width / 2, canvas.height / 2 + 10);

  const masks = buildMasks(ch);
  coreMask = masks.core;
  tolMask = masks.tol;

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
  hasDrawnAnything = true;
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

// Compare the drawn strokes against the guide letter's mask on a coarse grid (fast, and plenty
// precise enough for judging a toddler's tracing attempt).
function scoreTracing() {
  const w = canvas.width, h = canvas.height;
  const drawn = ctx.getImageData(0, 0, w, h).data;
  const core = coreMask.data;
  const tol = tolMask.data;
  const cell = 12;

  let redCells = 0, redInTolCells = 0, coreCells = 0, coreCoveredCells = 0;

  for (let y = 0; y < h; y += cell) {
    for (let x = 0; x < w; x += cell) {
      const i = (y * w + x) * 4;
      const r = drawn[i], g = drawn[i + 1], b = drawn[i + 2];
      const isRed = r > 160 && r - g > 35 && r - b > 35; // matches the coral drawing color, not the guide's gray or white bg

      const isCore = core[i + 3] > 100;
      const isTol = tol[i + 3] > 100;

      if (isRed) {
        redCells++;
        if (isTol) redInTolCells++;
      }
      if (isCore) {
        coreCells++;
        if (isRed) coreCoveredCells++;
      }
    }
  }

  const accuracy = redCells > 0 ? redInTolCells / redCells : 0; // how much of what they drew was actually on/near the letter
  const coverage = coreCells > 0 ? coreCoveredCells / coreCells : 0; // how much of the letter they actually traced
  return { accuracy, coverage, redCells };
}

function celebrate() {
  if (!hasDrawnAnything) {
    speak("Try tracing the letter first!");
    return;
  }

  const { accuracy, coverage, redCells } = scoreTracing();
  const onTarget = redCells >= 12 && accuracy >= 0.6 && coverage >= 0.15;

  winBanner.style.display = "flex";
  const label = (mode === "numbers" ? "number " : "letter ") + sequence[idx];
  const nextBtn = document.getElementById("nextLetterBtn");

  if (onTarget) {
    document.getElementById("winTitle").textContent = "✏️ Nice tracing!";
    document.getElementById("winStats").textContent = "You traced the " + label + "!";
    nextBtn.textContent = "Next one";
    nextBtn.dataset.action = "advance";
    playTone("win");
    confettiBurst(confettiHost);
    speak("Great tracing!");
  } else {
    document.getElementById("winTitle").textContent = "✏️ Almost there!";
    document.getElementById("winStats").textContent = "Nice try! Trace right along the " + label + " next time.";
    nextBtn.textContent = "Try again";
    nextBtn.dataset.action = "retry";
    playTone("tap");
    speak("Nice try! Let's trace right on the letter.");
  }
}

document.getElementById("doneBtn").addEventListener("click", celebrate);
document.getElementById("nextLetterBtn").addEventListener("click", function () {
  winBanner.style.display = "none";
  if (this.dataset.action === "retry") {
    drawGuide(); // same letter, cleared canvas
  } else {
    idx = (idx + 1) % sequence.length;
    drawGuide();
  }
});

setMode(mode);
initSessionTimer();
