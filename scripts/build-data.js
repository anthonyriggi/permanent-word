const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT_DIR = path.join(__dirname, "..");
const SOURCE_PATH = path.join(ROOT_DIR, "source", "john-sample.json");
const DATA_DIR = path.join(ROOT_DIR, "data");

function sha256(value) {
  return crypto.createHash("sha256").update(value, "utf8").digest("hex");
}

function writeJson(filePath, value) {
  const json = `${JSON.stringify(value, null, 2)}\n`;
  fs.writeFileSync(filePath, json, "utf8");
  return json;
}

function writeText(filePath, value) {
  fs.writeFileSync(filePath, value, "utf8");
}

function ensureDataDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function build() {
  ensureDataDir();

  const sourceRaw = fs.readFileSync(SOURCE_PATH, "utf8");
  const source = JSON.parse(sourceRaw);

  const manifest = {
    title: source.title,
    translation: source.translation,
    generatedAt: new Date().toISOString(),
    chapters: []
  };

  for (const chapter of source.chapters) {
    const chapterFileName = `${chapter.slug}.json`;
    const hashFileName = `${chapter.slug}.sha256.txt`;

    const chapterOutput = {
      translation: source.translation,
      book: chapter.book,
      chapter: chapter.chapter,
      heading: chapter.heading,
      verses: chapter.verses
    };

    const chapterPath = path.join(DATA_DIR, chapterFileName);
    const hashPath = path.join(DATA_DIR, hashFileName);

    const chapterJson = writeJson(chapterPath, chapterOutput);
    const chapterHash = sha256(chapterJson);

    writeText(hashPath, `${chapterHash}\n`);

    manifest.chapters.push({
      book: chapter.book,
      chapter: chapter.chapter,
      textPath: `./data/${chapterFileName}`,
      hashPath: `./data/${hashFileName}`,
      sha256: chapterHash
    });
  }

  const manifestJson = writeJson(path.join(DATA_DIR, "manifest.json"), manifest);
  const manifestHash = sha256(manifestJson);

  writeText(path.join(DATA_DIR, "manifest.sha256.txt"), `${manifestHash}\n`);

  console.log("Permanent Word data generated.");
  console.log(`Chapters: ${manifest.chapters.length}`);
  console.log(`Manifest SHA-256: ${manifestHash}`);
}

build();