// Permanent Word starter
// No framework. No backend. No build step.
// Text now lives in an external canonical JSON file.

const CHAPTER_PATH = "./data/john-1.json";
const HASH_PATH = "./data/john-1.sha256.txt";

let currentChapterIndex = 0;
let chapters = [];
let rawChapterFiles = [];

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

async function loadTextFile(path) {
  const response = await fetch(path, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Could not load ${path}`);
  }

  return response.text();
}

async function loadChapter() {
  const rawChapter = await loadTextFile(CHAPTER_PATH);
  const chapter = JSON.parse(rawChapter);

  chapters = [chapter];
  rawChapterFiles = [rawChapter];
}

async function loadCanonicalHash() {
  try {
    const hash = await loadTextFile(HASH_PATH);
    return hash.trim();
  } catch {
    return "";
  }
}

function renderChapter() {
  const chapter = chapters[currentChapterIndex];

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
}

async function verifyCurrentText() {
  try {
    const rawChapter = rawChapterFiles[currentChapterIndex];
    const currentHash = await sha256(rawChapter);
    const canonicalHash = await loadCanonicalHash();

    currentHashEl.textContent = currentHash;
    canonicalHashEl.textContent = canonicalHash || "Not set yet";

    verifyStatus.className = "verify-pill";

    if (!canonicalHash) {
      verifyStatus.textContent = "Hash generated";
      verifyStatus.classList.add("is-warning");
      verificationMessage.textContent =
        "Copy the current SHA-256 hash into data/john-1.sha256.txt to lock this chapter as canonical.";
      return;
    }

    if (currentHash === canonicalHash) {
      verifyStatus.textContent = "Verified unchanged text";
      verifyStatus.classList.add("is-verified");
      verificationMessage.textContent =
        "The loaded chapter file matches the canonical SHA-256 hash.";
    } else {
      verifyStatus.textContent = "Text does not match";
      verifyStatus.classList.add("is-error");
      verificationMessage.textContent =
        "The loaded chapter file does not match the canonical SHA-256 hash. Something changed.";
    }
  } catch (error) {
    verifyStatus.textContent = "Verification unavailable";
    verifyStatus.className = "verify-pill is-error";
    verificationMessage.textContent =
      "The browser could not verify the chapter file. Make sure you are running this through localhost.";
    currentHashEl.textContent = "Unavailable";
  }
}

function updateNavState() {
  const atStart = currentChapterIndex === 0;
  const atEnd = currentChapterIndex === chapters.length - 1;

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
    verifyCurrentText();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

function goToNextChapter() {
  if (currentChapterIndex < chapters.length - 1) {
    currentChapterIndex += 1;
    renderChapter();
    verifyCurrentText();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

async function init() {
  try {
    await loadChapter();
    renderChapter();
    await verifyCurrentText();
  } catch (error) {
    verifyStatus.textContent = "Could not load text";
    verifyStatus.className = "verify-pill is-error";
    verificationMessage.textContent =
      "The chapter file could not be loaded. Run this through localhost and confirm data/john-1.json exists.";
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

init();