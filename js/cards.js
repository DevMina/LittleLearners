if (!requireProfile()) { /* redirecting to profile picker */ }

const deckKey = qparam("deck", "animals");
const deck = DECKS[deckKey] || DECKS.animals;
let order = deck.items.map((_, i) => i);
let idx = 0;

const flashcard = document.getElementById("flashcard");
const cardLabel = document.getElementById("cardLabel");
const deckTitle = document.getElementById("deckTitle");
const dotsEl = document.getElementById("progressDots");

deckTitle.textContent = deck.title;
document.title = "Little Learners – " + deck.title;

function buildDots() {
  dotsEl.innerHTML = "";
  order.forEach((_, i) => {
    const d = document.createElement("span");
    dotsEl.appendChild(d);
  });
}

function render() {
  const item = deck.items[order[idx]];
  flashcard.classList.remove("flashcard");
  void flashcard.offsetWidth;
  flashcard.classList.add("flashcard");
  renderCardVisual(item, flashcard);
  cardLabel.textContent = item.label;
  [...dotsEl.children].forEach((d, i) => d.classList.toggle("active", i === idx));
  speak(item.label);

  const justCompleted = markCardSeen(deckKey, item.id, deck.items.length);
  if (justCompleted) {
    setTimeout(() => {
      playTone("win");
      const host = document.createElement("div");
      host.className = "confetti-host";
      document.querySelector(".card-stage").prepend(host);
      confettiBurst(host);
      speak("You've seen the whole " + deck.title + " deck! Great job!");
    }, 600);
  }
}

function goTo(delta) {
  idx = (idx + delta + order.length) % order.length;
  render();
}

document.getElementById("prevBtn").addEventListener("click", () => goTo(-1));
document.getElementById("nextBtn").addEventListener("click", () => goTo(1));
document.getElementById("speakBtn").addEventListener("click", () => speak(deck.items[order[idx]].label));
flashcard.addEventListener("click", () => speak(deck.items[order[idx]].label));

document.getElementById("shuffleBtn").addEventListener("click", () => {
  order = shuffle(order);
  idx = 0;
  render();
});

// ---------- Overview grid ("See all") ----------
const overviewModal = document.getElementById("overviewModal");
const overviewGrid = document.getElementById("overviewGrid");
document.getElementById("overviewTitle").textContent = "All " + deck.title;

function buildOverview() {
  const seenIds = (getProgress().decks[deckKey] && getProgress().decks[deckKey].seen) || [];
  overviewGrid.innerHTML = "";
  deck.items.forEach((item, i) => {
    const btn = document.createElement("button");
    btn.className = "overview-tile" + (seenIds.includes(item.id) ? " seen" : "");
    if (item.emoji) {
      btn.innerHTML = `<span>${item.emoji}</span><span class="ov-label">${item.label}</span>`;
    } else if (item.swatch) {
      btn.innerHTML = `<span class="ov-swatch" style="background:${item.swatch}"></span><span class="ov-label">${item.label}</span>`;
    } else {
      btn.innerHTML = `<span style="font-size:1.3rem;">${item.label}</span>`;
    }
    btn.setAttribute("aria-label", item.label);
    btn.addEventListener("click", () => {
      const posInOrder = order.indexOf(i);
      idx = posInOrder > -1 ? posInOrder : 0;
      overviewModal.style.display = "none";
      render();
    });
    overviewGrid.appendChild(btn);
  });
}

document.getElementById("printLinkBtn").addEventListener("click", () => (location.href = "print.html?deck=" + deckKey));

document.getElementById("gridBtn").addEventListener("click", () => {
  buildOverview();
  overviewModal.style.display = "flex";
});
document.getElementById("closeOverviewBtn").addEventListener("click", () => (overviewModal.style.display = "none"));

// swipe support
let touchStartX = null;
flashcard.addEventListener("touchstart", (e) => (touchStartX = e.touches[0].clientX));
flashcard.addEventListener("touchend", (e) => {
  if (touchStartX === null) return;
  const dx = e.changedTouches[0].clientX - touchStartX;
  if (Math.abs(dx) > 40) {
    e.preventDefault(); // swiping already re-renders (and speaks) the card; stop the trailing synthetic click from speaking again
    goTo(dx < 0 ? 1 : -1);
  }
  touchStartX = null;
});

// ---------- "Your turn! Try it" mic practice ----------
// Not speech recognition — just detects that the child made some sound and celebrates the attempt.
const micBtn = document.getElementById("micBtn");
const micStatus = document.getElementById("micStatus");
let micSession = 0; // increments each time listening starts, so a stale session can detect it's been superseded
let micActiveCleanup = null;

micBtn.addEventListener("click", async () => {
  // If a session is already running, stop it cleanly before starting a new one
  if (micActiveCleanup) {
    micActiveCleanup();
    micActiveCleanup = null;
  }
  const thisSession = ++micSession;
  micStatus.textContent = "Listening… say it out loud!";
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const AC = window.AudioContext || window.webkitAudioContext;
    const ctx = new AC();
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    source.connect(analyser);
    const data = new Uint8Array(analyser.frequencyBinCount);

    let stopped = false;
    const cleanup = () => {
      if (stopped) return;
      stopped = true;
      stream.getTracks().forEach((t) => t.stop());
      ctx.close();
    };
    micActiveCleanup = cleanup;

    const start = Date.now();
    let heardSound = false;
    const check = () => {
      if (stopped || thisSession !== micSession) return; // a newer session took over, or was cancelled
      analyser.getByteTimeDomainData(data);
      const maxDeviation = Math.max(...data.map((v) => Math.abs(v - 128)));
      if (maxDeviation > 25) heardSound = true;
      if (Date.now() - start < 2500) {
        requestAnimationFrame(check);
      } else {
        cleanup();
        if (micActiveCleanup === cleanup) micActiveCleanup = null;
        if (heardSound) {
          micStatus.textContent = "Great try! 🎉";
          playTone("win");
        } else {
          micStatus.textContent = "Didn't hear you — want to try again?";
        }
        setTimeout(() => (micStatus.textContent = ""), 2500);
      }
    };
    check();
  } catch (e) {
    micStatus.textContent = "Microphone access is needed for this.";
  }
});

buildDots();
render();
initSessionTimer();
