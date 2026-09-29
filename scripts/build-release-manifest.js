const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT_DIR = path.join(__dirname, "..");

const RELEASE_MANIFEST_PATH = path.join(ROOT_DIR, "release-manifest.json");
const RELEASE_MANIFEST_HASH_PATH = path.join(ROOT_DIR, "release-manifest.sha256.txt");

const EXCLUDED_DIRS = new Set([
  ".git",
  "node_modules",
  "dist"
]);

const EXCLUDED_FILES = new Set([
  ".DS_Store",
  "release-manifest.json",
  "release-manifest.sha256.txt"
]);

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function readFile(filePath) {
  return fs.readFileSync(filePath);
}

function writeJson(filePath, value) {
  const json = `${JSON.stringify(value, null, 2)}\n`;
  fs.writeFileSync(filePath, json, "utf8");
  return json;
}

function writeText(filePath, value) {
  fs.writeFileSync(filePath, value, "utf8");
}

function toPosixPath(filePath) {
  return filePath.split(path.sep).join("/");
}

function shouldSkipEntry(entryName) {
  return EXCLUDED_DIRS.has(entryName) || EXCLUDED_FILES.has(entryName);
}

function walkFiles(directoryPath) {
  const files = [];
  const entries = fs.readdirSync(directoryPath, { withFileTypes: true });

  for (const entry of entries) {
    if (shouldSkipEntry(entry.name)) {
      continue;
    }

    const fullPath = path.join(directoryPath, entry.name);

    if (entry.isDirectory()) {
      files.push(...walkFiles(fullPath));
      continue;
    }

    if (entry.isFile()) {
      files.push(fullPath);
    }
  }

  return files;
}

function getManifestSummary() {
  const dataManifestPath = path.join(ROOT_DIR, "data", "manifest.json");

  if (!fs.existsSync(dataManifestPath)) {
    return {
      title: "Permanent Word",
      translation: "Unknown",
      importedCollection: "Unknown",
      chapterCount: 0
    };
  }

  const manifest = JSON.parse(fs.readFileSync(dataManifestPath, "utf8"));
  const source = manifest.source || {};

  return {
    title: manifest.title || "Permanent Word",
    translation: manifest.translation || "Unknown",
    importedCollection:
      source.importedCollection ||
      source.importedBook ||
      "Unknown",
    chapterCount: Array.isArray(manifest.chapters) ? manifest.chapters.length : 0,
    sourceProvider: source.provider || "Unknown",
    sourceFile: source.sourceFile || "Unknown"
  };
}

function buildReleaseManifest() {
  const summary = getManifestSummary();

  const files = walkFiles(ROOT_DIR)
    .map((filePath) => {
      const relativePath = toPosixPath(path.relative(ROOT_DIR, filePath));
      const contents = readFile(filePath);

      return {
        path: relativePath,
        bytes: contents.length,
        sha256: sha256(contents)
      };
    })
    .sort((a, b) => a.path.localeCompare(b.path));

  const releaseManifest = {
    project: "Permanent Word",
    releaseFormatVersion: 1,
    hashAlgorithm: "SHA-256",
    summary,
    files
  };

  const releaseManifestJson = writeJson(RELEASE_MANIFEST_PATH, releaseManifest);
  const releaseManifestHash = sha256(Buffer.from(releaseManifestJson, "utf8"));

  writeText(RELEASE_MANIFEST_HASH_PATH, `${releaseManifestHash}\n`);

  console.log("Release manifest generated.");
  console.log(`Files: ${files.length}`);
  console.log(`Saved: ${path.relative(ROOT_DIR, RELEASE_MANIFEST_PATH)}`);
  console.log(`SHA-256: ${releaseManifestHash}`);
}

try {
  buildReleaseManifest();
} catch (error) {
  console.error("Release manifest build failed.");
  console.error(error.message);
  process.exit(1);
}