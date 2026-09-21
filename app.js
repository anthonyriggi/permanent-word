// Permanent Word starter
// No framework. No backend. No build step.
// Replace this starter data with your canonical public-domain text later.

const CANONICAL_HASH = ""; // After first run, copy the generated SHA-256 here to lock the text.

const CHAPTERS = [
  {
    book: "John",
    chapter: 1,
    heading: "The Word Became Flesh",
    verses: [
      { number: 1, text: "In the beginning was the Word, and the Word was with God, and the Word was God." },
      { number: 2, text: "The same was in the beginning with God." },
      { number: 3, text: "All things were made by him; and without him was not any thing made that was made." },
      { number: 4, text: "In him was life; and the life was the light of men." },
      { number: 5, text: "And the light shineth in darkness; and the darkness comprehended it not." },
      { number: 6, text: "There was a man sent from God, whose name was John." },
      { number: 7, text: "The same came for a witness, to bear witness of the Light, that all men through him might believe." },
      { number: 8, text: "He was not that Light, but was sent to bear witness of that Light." }
    ]
  }
];

let currentChapterIndex = 0;

const bookLabel = document.getElementById("bookLabel");
const chapterTitle = document.getElementById("chapterTitle");
const scriptureText = document.getElementById("scriptureText");
const verifyStatus = document.getElementById("verifyStatus");
const verificationMessage = document.getElementById("verificationMessage");
const currentHashEl = document.getElementById("currentHash");
const canonicalHashEl = document.getElementById("canonicalHash");

const prevButton = document.getElementById("prevButton");
const nextButton = document.getElementById("nextButton");
const mobilePrevButton = document.getElementById("mobilePrevButton");
const mobileNextButton = document.getElementById("mobileNextButton");

function getCanonicalText(chapter) {
  // Keep this format stable. If you change this format, the hash changes.
  return [
    `${chapter.book} ${chapter.chapter}`,
    chapter.heading,
    ...chapter.verses.map((verse) => `${verse.number}|${verse.text}`)
  ].join("\n");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function sha256(value) {
  const bytes = new TextEncoder().encode(value);
  const buffer = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(buffer)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function renderChapter() {
  const chapter = CHAPTERS[currentChapterIndex];

  document.title = `${chapter.book} ${chapter.chapter} | Permanent Word`;
  bookLabel.textContent = `${chapter.book} ${chapter.chapter}`.toUpperCase();
  chapterTitle.textContent = chapter.heading;

  scriptureText.innerHTML = chapter.verses
    .map((verse) => `
      <p class="verse">
        <sup class="verse-number">${verse.number}</sup>${escapeHtml(verse.text)}
      </p>
    `)
    .join("");

  updateNavState();
  await verifyCurrentText(chapter);
}

async function verifyCurrentText(chapter) {
  try {
    const hash = await sha256(getCanonicalText(chapter));
    currentHashEl.textContent = hash;
    canonicalHashEl.textContent = CANONICAL_HASH || "Not set yet";

    verifyStatus.className = "verify-pill";

    if (!CANONICAL_HASH) {
      verifyStatus.textContent = "Hash generated";
      verifyStatus.classList.add("is-warning");
      verificationMessage.textContent = "This starter has generated a SHA-256 hash. To make this chapter canonical, copy the current hash into CANONICAL_HASH in app.js.";
      return;
    }

    if (hash === CANONICAL_HASH) {
      verifyStatus.textContent = "Verified unchanged text";
      verifyStatus.classList.add("is-verified");
      verificationMessage.textContent = "The displayed text matches the canonical SHA-256 hash.";
    } else {
      verifyStatus.textContent = "Text does not match";
      verifyStatus.classList.add("is-error");
      verificationMessage.textContent = "The displayed text does not match the canonical SHA-256 hash. Something changed.";
    }
  } catch (error) {
    verifyStatus.textContent = "Verification unavailable";
    verifyStatus.className = "verify-pill is-error";
    verificationMessage.textContent = "Your browser could not run the hash check. Try viewing over HTTPS or localhost.";
    currentHashEl.textContent = "Unavailable";
  }
}

function updateNavState() {
  const atStart = currentChapterIndex === 0;
  const atEnd = currentChapterIndex === CHAPTERS.length - 1;

  [prevButton, mobilePrevButton].forEach((button) => {
    button.disabled = atStart;
  });

  [nextButton, mobileNextButton].forEach((button) => {
    button.disabled = atEnd;
  });
}

function goToPreviousChapter() {
  if (currentChapterIndex > 0) {
    currentChapterIndex -= 1;
    renderChapter();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

function goToNextChapter() {
  if (currentChapterIndex < CHAPTERS.length - 1) {
    currentChapterIndex += 1;
    renderChapter();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

prevButton.addEventListener("click", goToPreviousChapter);
nextButton.addEventListener("click", goToNextChapter);
mobilePrevButton.addEventListener("click", goToPreviousChapter);
mobileNextButton.addEventListener("click", goToNextChapter);

document.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft") goToPreviousChapter();
  if (event.key === "ArrowRight") goToNextChapter();
});

renderChapter();
