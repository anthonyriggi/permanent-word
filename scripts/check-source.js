const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT_DIR = path.join(__dirname, "..");
const SOURCE_DIR = path.join(ROOT_DIR, "source");

const SOURCE_TEXT_PATH = path.join(SOURCE_DIR, "kjv-gutenberg.txt");
const SOURCE_HASH_PATH = path.join(SOURCE_DIR, "kjv-gutenberg.sha256.txt");
const SOURCE_MANIFEST_PATH = path.join(SOURCE_DIR, "source-manifest.json");

let hasError = false;

function sha256(value) {
  return crypto.createHash("sha256").update(value, "utf8").digest("hex");
}

function pass(message) {
  console.log(`✅ ${message}`);
}

function fail(message) {
  hasError = true;
  console.error(`❌ ${message}`);
}

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function fileExists(filePath) {
  return fs.existsSync(filePath);
}

function checkFile(filePath, label) {
  if (!fileExists(filePath)) {
    fail(`${label} missing: ${filePath}`);
    return false;
  }

  pass(`${label} found`);
  return true;
}

function main() {
  console.log("Permanent Word source check");
  console.log("===========================\n");

  const hasSourceText = checkFile(SOURCE_TEXT_PATH, "source/kjv-gutenberg.txt");
  const hasSourceHash = checkFile(SOURCE_HASH_PATH, "source/kjv-gutenberg.sha256.txt");
  const hasSourceManifest = checkFile(SOURCE_MANIFEST_PATH, "source/source-manifest.json");

  if (!hasSourceText || !hasSourceHash || !hasSourceManifest) {
    hasError = true;
  } else {
    const sourceText = readText(SOURCE_TEXT_PATH);
    const savedHash = readText(SOURCE_HASH_PATH).trim();
    const currentHash = sha256(sourceText);

    if (currentHash === savedHash) {
      pass("source text matches kjv-gutenberg.sha256.txt");
    } else {
      fail("source text does not match kjv-gutenberg.sha256.txt");
      console.error(`   Current:   ${currentHash}`);
      console.error(`   Canonical: ${savedHash}`);
    }

    try {
      const sourceManifest = JSON.parse(readText(SOURCE_MANIFEST_PATH));

      if (!sourceManifest.name) fail("source-manifest.json missing name");
      if (!sourceManifest.provider) fail("source-manifest.json missing provider");
      if (!sourceManifest.sourcePage) fail("source-manifest.json missing sourcePage");
      if (!sourceManifest.downloadedFrom) fail("source-manifest.json missing downloadedFrom");
      if (!sourceManifest.sha256) fail("source-manifest.json missing sha256");

      if (sourceManifest.sha256 === currentHash) {
        pass("source text matches source-manifest.json sha256");
      } else {
        fail("source text does not match source-manifest.json sha256");
        console.error(`   Current:  ${currentHash}`);
        console.error(`   Manifest: ${sourceManifest.sha256}`);
      }

      pass("source-manifest.json structure looks valid");
    } catch (error) {
      fail("source-manifest.json is invalid JSON");
      console.error(error.message);
    }
  }

  console.log("\nResult");
  console.log("------");

  if (hasError) {
    console.error("❌ Source check failed.");
    process.exit(1);
  }

  console.log("✅ Source check passed.");
}

main();