// Permanent Word
// No framework. No backend. No build step.
// Chapters are loaded from data/manifest.json.

const MANIFEST_PATH = "./data/manifest.json";

let manifest = null;
let currentChapterIndex = 0;
const chapterCache = new Map();

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
const chapterSelect = document.getElementById("chapterSelect");

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

async function loadManifest() {
  const rawManifest = await loadTextFile(MANIFEST_PATH);
  manifest = JSON.parse(rawManifest);
}

async function loadChapterByIndex(index) {
  const chapterEntry = manifest.chapters[index];

  if (chapterCache.has(chapterEntry.textPath)) {
    return chapterCache.get(chapterEntry.textPath);
  }

  const rawChapter = await loadTextFile(chapterEntry.textPath);
  const chapter = JSON.parse(rawChapter);

  const chapterData = {
    entry: chapterEntry,
    raw: rawChapter,
    parsed: chapter
  };

  chapterCache.set(chapterEntry.textPath, chapterData);

  return chapterData;
}

async function loadCanonicalHash(hashPath) {
  try {
    const hash = await loadTextFile(hashPath);
    return hash.trim();
  } catch {
    return "";
  }
}

function populateChapterSelect() {
  chapterSelect.innerHTML = manifest.chapters
    .map((chapterEntry, index) => {
      return `
        <option value="${index}">
          ${escapeHtml(chapterEntry.book)} ${chapterEntry.chapter}
        </option>
      `;
    })
    .join("");
}

function updateNavState() {
  const atStart = currentChapterIndex === 0;
  const atEnd = currentChapterIndex === manifest.chapters.length - 1;

  [prevButton, mobilePrevButton].forEach((button) => {
    button.disabled = atStart;
  });

  [nextButton, mobileNextButton].forEach((button) => {
    button.disabled = atEnd;
  });
}

async function renderCurrentChapter() {
  const chapterData = await loadChapterByIndex(currentChapterIndex);
  const chapter = chapterData.parsed;

  document.title = `${chapter.book} ${chapter.chapter} | ${manifest.title}`;
  bookLabel.textContent = `${chapter.book} ${chapter.chapter}`.toUpperCase();
  chapterSelect.value = String(currentChapterIndex);
  chapterTitle.textContent = chapter.heading || "";

  scriptureText.innerHTML = chapter.verses
    .map((verse) => {
      const verseClass = verse.wordsOfJesus ? "verse red-letter" : "verse";

      return `
        <p class="${verseClass}">
          <sup class="verse-number">${verse.number}</sup>${escapeHtml(verse.text)}
        </p>
      `;
    })
    .join("");

  updateNavState();
  await verifyCurrentChapter(chapterData);
}

async function verifyCurrentChapter(chapterData) {
  try {
    const currentHash = await sha256(chapterData.raw);
    const canonicalHash = await loadCanonicalHash(chapterData.entry.hashPath);

    currentHashEl.textContent = currentHash;
    canonicalHashEl.textContent = canonicalHash || "Not set yet";

    verifyStatus.className = "verify-pill";

    if (!canonicalHash) {
      verifyStatus.textContent = "Hash generated";
      verifyStatus.classList.add("is-warning");
      verificationMessage.textContent =
        `Copy the current SHA-256 hash into ${chapterData.entry.hashPath} to lock this chapter as canonical.`;
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
      "The browser could not verify this chapter file.";
    currentHashEl.textContent = "Unavailable";
    canonicalHashEl.textContent = "Unavailable";
  }
}

async function goToPreviousChapter() {
  if (currentChapterIndex > 0) {
    currentChapterIndex -= 1;
    await renderCurrentChapter();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

async function goToNextChapter() {
  if (currentChapterIndex < manifest.chapters.length - 1) {
    currentChapterIndex += 1;
    await renderCurrentChapter();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

async function init() {
  try {
    await loadManifest();
    populateChapterSelect();
    await renderCurrentChapter();
  } catch (error) {
    verifyStatus.textContent = "Could not load text";
    verifyStatus.className = "verify-pill is-error";
    verificationMessage.textContent =
      "The manifest or chapter file could not be loaded. Confirm data/manifest.json exists and run through localhost.";
    currentHashEl.textContent = "Unavailable";
    canonicalHashEl.textContent = "Unavailable";
  }
}

prevButton.addEventListener("click", goToPreviousChapter);
nextButton.addEventListener("click", goToNextChapter);
mobilePrevButton.addEventListener("click", goToPreviousChapter);
mobileNextButton.addEventListener("click", goToNextChapter);

chapterSelect.addEventListener("change", async (event) => {
  currentChapterIndex = Number(event.target.value);
  await renderCurrentChapter();
  window.scrollTo({ top: 0, behavior: "smooth" });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft") goToPreviousChapter();
  if (event.key === "ArrowRight") goToNextChapter();
});

init();