const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT_DIR = path.join(__dirname, "..");
const DATA_DIR = path.join(ROOT_DIR, "data");
const MANIFEST_PATH = path.join(DATA_DIR, "manifest.json");
const MANIFEST_HASH_PATH = path.join(DATA_DIR, "manifest.sha256.txt");

let hasError = false;

function sha256(value) {
  return crypto.createHash("sha256").update(value, "utf8").digest("hex");
}

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function fileExists(filePath) {
  return fs.existsSync(filePath);
}

function pass(message) {
  console.log(`✅ ${message}`);
}

function fail(message) {
  hasError = true;
  console.error(`❌ ${message}`);
}

function checkRequiredFile(filePath, label) {
  if (!fileExists(filePath)) {
    fail(`${label} missing: ${filePath}`);
    return false;
  }

  pass(`${label} found`);
  return true;
}

function checkManifest() {
  console.log("\nChecking manifest...\n");

  const manifestExists = checkRequiredFile(MANIFEST_PATH, "manifest.json");
  const manifestHashExists = checkRequiredFile(MANIFEST_HASH_PATH, "manifest.sha256.txt");

  if (!manifestExists || !manifestHashExists) {
    return null;
  }

  const rawManifest = readText(MANIFEST_PATH);
  const savedManifestHash = readText(MANIFEST_HASH_PATH).trim();
  const currentManifestHash = sha256(rawManifest);

  if (currentManifestHash === savedManifestHash) {
    pass("manifest.json matches manifest.sha256.txt");
  } else {
    fail("manifest.json does not match manifest.sha256.txt");
    console.error(`   Current:   ${currentManifestHash}`);
    console.error(`   Canonical: ${savedManifestHash}`);
  }

  try {
    const manifest = JSON.parse(rawManifest);

    if (!manifest.title) fail("manifest.title is missing");
    if (!manifest.translation) fail("manifest.translation is missing");

    if (!Array.isArray(manifest.chapters)) {
      fail("manifest.chapters must be an array");
      return null;
    }

    pass(`manifest contains ${manifest.chapters.length} chapter(s)`);

    return manifest;
  } catch (error) {
    fail("manifest.json is not valid JSON");
    console.error(error.message);
    return null;
  }
}

function checkChapter(chapterEntry, index) {
  const label = `${chapterEntry.book || "Unknown"} ${chapterEntry.chapter || index + 1}`;

  console.log(`\nChecking ${label}...\n`);

  if (!chapterEntry.textPath) {
    fail(`${label}: textPath is missing`);
    return;
  }

  if (!chapterEntry.hashPath) {
    fail(`${label}: hashPath is missing`);
    return;
  }

  if (!chapterEntry.sha256) {
    fail(`${label}: manifest sha256 is missing`);
    return;
  }

  const textPath = path.join(ROOT_DIR, chapterEntry.textPath);
  const hashPath = path.join(ROOT_DIR, chapterEntry.hashPath);

  const chapterExists = checkRequiredFile(textPath, `${label} JSON`);
  const hashExists = checkRequiredFile(hashPath, `${label} hash file`);

  if (!chapterExists || !hashExists) {
    return;
  }

  const rawChapter = readText(textPath);
  const savedChapterHash = readText(hashPath).trim();
  const currentChapterHash = sha256(rawChapter);

  if (currentChapterHash === savedChapterHash) {
    pass(`${label}: JSON matches .sha256.txt`);
  } else {
    fail(`${label}: JSON does not match .sha256.txt`);
    console.error(`   Current:   ${currentChapterHash}`);
    console.error(`   Canonical: ${savedChapterHash}`);
  }

  if (currentChapterHash === chapterEntry.sha256) {
    pass(`${label}: JSON matches manifest sha256`);
  } else {
    fail(`${label}: JSON does not match manifest sha256`);
    console.error(`   Current:  ${currentChapterHash}`);
    console.error(`   Manifest: ${chapterEntry.sha256}`);
  }

  try {
    const chapter = JSON.parse(rawChapter);

    if (!chapter.translation) fail(`${label}: translation is missing`);
    if (!chapter.book) fail(`${label}: book is missing`);
    if (!chapter.chapter) fail(`${label}: chapter is missing`);

    if (typeof chapter.heading !== "string") {
      fail(`${label}: heading should be a string, even if empty`);
    }

    if (!Array.isArray(chapter.verses)) {
      fail(`${label}: verses must be an array`);
      return;
    }

    if (chapter.verses.length === 0) {
      fail(`${label}: verses array is empty`);
      return;
    }

    for (const verse of chapter.verses) {
      if (typeof verse.number !== "number") {
        fail(`${label}: a verse is missing a numeric verse number`);
      }

      if (!verse.text) {
        fail(`${label}: verse ${verse.number || "unknown"} is missing text`);
      }
    }

    pass(`${label}: chapter JSON structure looks valid`);
  } catch (error) {
    fail(`${label}: chapter JSON is invalid`);
    console.error(error.message);
  }
}

function main() {
  console.log("Permanent Word integrity check");
  console.log("==============================");

  const manifest = checkManifest();

  if (manifest) {
    for (const [index, chapterEntry] of manifest.chapters.entries()) {
      checkChapter(chapterEntry, index);
    }
  }

  console.log("\nResult\n------");

  if (hasError) {
    console.error("❌ Integrity check failed.");
    process.exit(1);
  }

  console.log("✅ All integrity checks passed.");
}

main();