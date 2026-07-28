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
// Uses the Web Speech API to check whether the spoken word actually matches the
// card's label (falls back to simple sound-detection if the browser doesn't support it).
const micBtn = document.getElementById("micBtn");
const micStatus = document.getElementById("micStatus");
let micSession = 0; // increments each time listening starts, so a stale session can detect it's been superseded
let micActiveCleanup = null;

const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;

// Letters and numbers are hard for speech engines to transcribe literally (e.g. "B" often
// comes back as "bee", "1" sometimes comes back as "one") — these maps let a spoken
// homophone still count as correct.
const LETTER_SOUNDS = {
  a: ["a", "ay"], b: ["bee", "be"], c: ["see", "sea", "cee"], d: ["dee"], e: ["e", "ee"],
  f: ["ef", "eff"], g: ["gee"], h: ["aitch", "haitch"], i: ["i", "eye"], j: ["jay"],
  k: ["kay"], l: ["el", "ell"], m: ["em"], n: ["en"], o: ["o", "oh"], p: ["pee"],
  q: ["cue", "queue"], r: ["are", "ar"], s: ["es", "ess"], t: ["tee"], u: ["you", "u"],
  v: ["vee"], w: ["double u", "doubleu", "dubya"], x: ["ex"], y: ["why"], z: ["zee", "zed"],
};
const NUMBER_WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];

function normalizeSpeech(s) {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
}

// Returns every normalized form that should count as a correct answer for this card.
function acceptedAnswersFor(item) {
  const label = normalizeSpeech(item.label);
  const forms = new Set([label]);
  if (/^[a-z]$/.test(label) && LETTER_SOUNDS[label]) {
    LETTER_SOUNDS[label].forEach((s) => forms.add(s));
  }
  const n = parseInt(label, 10);
  if (!isNaN(n) && n >= 0 && n < NUMBER_WORDS.length && String(n) === label) {
    forms.add(NUMBER_WORDS[n]);
  }
  return [...forms];
}

function speechMatches(transcripts, item) {
  const accepted = acceptedAnswersFor(item);
  return transcripts.some((raw) => {
    const t = normalizeSpeech(raw);
    if (!t) return false;
    const words = t.split(" ");
    return accepted.some((form) => t === form || words.includes(form));
  });
}

function startVolumeFallback(thisSession) {
  // Used only when the browser has no speech recognition support at all — we can still
  // tell the child made an attempt, but we're honest that we can't check the word itself.
  navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
    if (thisSession !== micSession) { stream.getTracks().forEach((t) => t.stop()); return; }
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
      if (stopped || thisSession !== micSession) return;
      analyser.getByteTimeDomainData(data);
      const maxDeviation = Math.max(...data.map((v) => Math.abs(v - 128)));
      if (maxDeviation > 25) heardSound = true;
      if (Date.now() - start < 2500) {
        requestAnimationFrame(check);
      } else {
        cleanup();
        if (micActiveCleanup === cleanup) micActiveCleanup = null;
        if (heardSound) {
          micStatus.textContent = "We heard you try! 🎉 (this browser can't check the word)";
          playTone("win");
        } else {
          micStatus.textContent = "Didn't hear you — want to try again?";
        }
        setTimeout(() => (micStatus.textContent = ""), 2800);
      }
    };
    check();
  }).catch(() => {
    micStatus.textContent = "Microphone access is needed for this.";
  });
}

micBtn.addEventListener("click", () => {
  if (micActiveCleanup) {
    micActiveCleanup();
    micActiveCleanup = null;
  }
  const thisSession = ++micSession;
  const item = deck.items[order[idx]];

  if (!SpeechRecognitionCtor) {
    micStatus.textContent = "Listening… say it out loud!";
    startVolumeFallback(thisSession);
    return;
  }

  const recognition = new SpeechRecognitionCtor();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.maxAlternatives = 3;

  let settled = false;
  micActiveCleanup = () => { settled = true; try { recognition.abort(); } catch (e) {} };

  micStatus.textContent = "Listening… say it out loud!";

  recognition.addEventListener("result", (e) => {
    if (thisSession !== micSession) return;
    settled = true;
    micActiveCleanup = null;
    const transcripts = [...e.results[0]].map((r) => r.transcript);
    if (speechMatches(transcripts, item)) {
      micStatus.textContent = "Great job! That's right! 🎉";
      playTone("win");
    } else {
      micStatus.textContent = "Nice try! It's \"" + item.label + "\" — want to try again?";
      playTone("tap");
      speak(item.label);
    }
    setTimeout(() => (micStatus.textContent = ""), 3000);
  });

  recognition.addEventListener("error", (e) => {
    if (thisSession !== micSession || settled) return;
    settled = true;
    micActiveCleanup = null;
    if (e.error === "no-speech") {
      micStatus.textContent = "Didn't hear you — want to try again?";
    } else if (e.error === "not-allowed" || e.error === "service-not-allowed") {
      micStatus.textContent = "Microphone access is needed for this.";
    } else {
      micStatus.textContent = "Couldn't hear that clearly — try again?";
    }
    setTimeout(() => (micStatus.textContent = ""), 2800);
  });

  try {
    recognition.start();
  } catch (e) {
    micStatus.textContent = "Couldn't start the microphone — try again?";
  }
});

buildDots();
render();
initSessionTimer();
