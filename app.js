// Permanent Word
// No framework. No backend. No build step.
// Chapters are loaded from data/manifest.json.

const MANIFEST_PATH = "./data/manifest.json";
const MANIFEST_HASH_PATH = "./data/manifest.sha256.txt";

let manifest = null;
let rawManifest = "";
let manifestVerification = {
  currentHash: "",
  canonicalHash: "",
  verified: false
};

let currentChapterIndex = 0;
const chapterCache = new Map();

const bookLabel = document.getElementById("bookLabel");
const chapterTitle = document.getElementById("chapterTitle");
const scriptureText = document.getElementById("scriptureText");
const verifyStatus = document.getElementById("verifyStatus");
const verificationMessage = document.getElementById("verificationMessage");
const currentHashEl = document.getElementById("currentHash");
const canonicalHashEl = document.getElementById("canonicalHash");

const sourceTranslation = document.getElementById("sourceTranslation");
const sourceProvider = document.getElementById("sourceProvider");
const sourceImportedBook = document.getElementById("sourceImportedBook");
const sourceFile = document.getElementById("sourceFile");
const sourceChapterCount = document.getElementById("sourceChapterCount");

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

function chapterEntryToSlug(chapterEntry) {
  return `${chapterEntry.book}-${chapterEntry.chapter}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function getHashSlug() {
  return window.location.hash.replace("#", "").trim().toLowerCase();
}

function findChapterIndexBySlug(slug) {
  if (!slug || !manifest) {
    return -1;
  }

  return manifest.chapters.findIndex((chapterEntry) => {
    return chapterEntryToSlug(chapterEntry) === slug;
  });
}

function updateUrlForCurrentChapter(mode = "push") {
  const chapterEntry = manifest.chapters[currentChapterIndex];
  const slug = chapterEntryToSlug(chapterEntry);
  const newUrl = `${window.location.pathname}${window.location.search}#${slug}`;

  if (window.location.hash === `#${slug}`) {
    return;
  }

  if (mode === "replace") {
    window.history.replaceState(null, "", newUrl);
    return;
  }

  window.history.pushState(null, "", newUrl);
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
  rawManifest = await loadTextFile(MANIFEST_PATH);
  manifest = JSON.parse(rawManifest);
}

async function verifyManifest() {
  const currentHash = await sha256(rawManifest);
  const canonicalHash = (await loadTextFile(MANIFEST_HASH_PATH)).trim();

  manifestVerification = {
    currentHash,
    canonicalHash,
    verified: currentHash === canonicalHash
  };
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

function setInitialChapterFromUrl() {
  const slug = getHashSlug();
  const chapterIndex = findChapterIndexBySlug(slug);

  if (chapterIndex >= 0) {
    currentChapterIndex = chapterIndex;
    return;
  }

  currentChapterIndex = 0;
  updateUrlForCurrentChapter("replace");
}

function renderSourceInfo() {
  const source = manifest.source || {};

  const importedLabel =
    source.importedCollection ||
    source.importedBook ||
    (Array.isArray(source.importedBooks) ? source.importedBooks.join(", ") : "Unknown");

  sourceTranslation.textContent = manifest.translation || "Unknown";
  sourceProvider.textContent = source.provider || "Unknown";
  sourceImportedBook.textContent = importedLabel;
  sourceFile.textContent = source.sourceFile || "Unknown";
  sourceChapterCount.textContent = String(manifest.chapters.length);
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
  chapterTitle.hidden = !chapter.heading;

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
    const fileCanonicalHash = await loadCanonicalHash(chapterData.entry.hashPath);
    const manifestCanonicalHash = chapterData.entry.sha256 || "";
    const canonicalHash = manifestCanonicalHash || fileCanonicalHash;

    currentHashEl.textContent = currentHash;
    canonicalHashEl.textContent = canonicalHash || "Not set yet";

    verifyStatus.className = "verify-pill";

    if (!manifestVerification.verified) {
      verifyStatus.textContent = "Manifest changed";
      verifyStatus.classList.add("is-error");
      verificationMessage.textContent =
        "The chapter list manifest does not match its canonical SHA-256 hash. Run the generator or check data/manifest.json.";
      return;
    }

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
        `Chapter verified. Manifest verified. Collection chapters: ${manifest.chapters.length}.`;
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
    updateUrlForCurrentChapter();
    await renderCurrentChapter();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

async function goToNextChapter() {
  if (currentChapterIndex < manifest.chapters.length - 1) {
    currentChapterIndex += 1;
    updateUrlForCurrentChapter();
    await renderCurrentChapter();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

async function goToChapterIndex(index, shouldUpdateUrl = true) {
  if (index < 0 || index >= manifest.chapters.length) {
    return;
  }

  currentChapterIndex = index;

  if (shouldUpdateUrl) {
    updateUrlForCurrentChapter();
  }

  await renderCurrentChapter();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function init() {
  try {
    await loadManifest();
    await verifyManifest();
    populateChapterSelect();
    setInitialChapterFromUrl();
    renderSourceInfo();
    await renderCurrentChapter();
  } catch (error) {
    verifyStatus.textContent = "Could not load text";
    verifyStatus.className = "verify-pill is-error";
    verificationMessage.textContent =
      "The manifest, manifest hash, or chapter file could not be loaded. Confirm data/manifest.json and data/manifest.sha256.txt exist.";
    currentHashEl.textContent = "Unavailable";
    canonicalHashEl.textContent = "Unavailable";
  }
}

prevButton.addEventListener("click", goToPreviousChapter);
nextButton.addEventListener("click", goToNextChapter);
mobilePrevButton.addEventListener("click", goToPreviousChapter);
mobileNextButton.addEventListener("click", goToNextChapter);

chapterSelect.addEventListener("change", async (event) => {
  await goToChapterIndex(Number(event.target.value));
});

window.addEventListener("hashchange", async () => {
  if (!manifest) {
    return;
  }

  const chapterIndex = findChapterIndexBySlug(getHashSlug());

  if (chapterIndex >= 0 && chapterIndex !== currentChapterIndex) {
    await goToChapterIndex(chapterIndex, false);
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft") goToPreviousChapter();
  if (event.key === "ArrowRight") goToNextChapter();
});

init();