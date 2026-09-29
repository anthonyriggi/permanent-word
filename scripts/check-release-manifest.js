const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT_DIR = path.join(__dirname, "..");

const RELEASE_MANIFEST_PATH = path.join(ROOT_DIR, "release-manifest.json");
const RELEASE_MANIFEST_HASH_PATH = path.join(ROOT_DIR, "release-manifest.sha256.txt");

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function readFile(filePath) {
  return fs.readFileSync(filePath);
}

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function fail(message) {
  throw new Error(message);
}

function verifyReleaseManifestHash() {
  if (!fs.existsSync(RELEASE_MANIFEST_PATH)) {
    fail("Missing release-manifest.json. Run npm run build:release first.");
  }

  if (!fs.existsSync(RELEASE_MANIFEST_HASH_PATH)) {
    fail("Missing release-manifest.sha256.txt. Run npm run build:release first.");
  }

  const manifestContents = readFile(RELEASE_MANIFEST_PATH);
  const currentHash = sha256(manifestContents);
  const expectedHash = readText(RELEASE_MANIFEST_HASH_PATH).trim();

  if (currentHash !== expectedHash) {
    fail(
      [
        "release-manifest.json does not match release-manifest.sha256.txt.",
        `Expected: ${expectedHash}`,
        `Current:  ${currentHash}`
      ].join("\n")
    );
  }

  return currentHash;
}

function verifyManifestStructure(manifest) {
  if (manifest.project !== "Permanent Word") {
    fail("Release manifest project must be Permanent Word.");
  }

  if (manifest.releaseFormatVersion !== 1) {
    fail("Release manifest format version must be 1.");
  }

  if (manifest.hashAlgorithm !== "SHA-256") {
    fail("Release manifest hash algorithm must be SHA-256.");
  }

  if (!manifest.summary || typeof manifest.summary !== "object") {
    fail("Release manifest is missing a summary object.");
  }

  if (!Array.isArray(manifest.files)) {
    fail("Release manifest is missing a files array.");
  }

  if (manifest.files.length === 0) {
    fail("Release manifest files array is empty.");
  }
}

function verifyFileEntry(entry) {
  if (!entry || typeof entry !== "object") {
    fail("Release manifest contains an invalid file entry.");
  }

  if (!entry.path || typeof entry.path !== "string") {
    fail("Release manifest contains a file entry with a missing path.");
  }

  if (entry.path.includes("..")) {
    fail(`Release manifest contains an unsafe path: ${entry.path}`);
  }

  if (entry.path === "release-manifest.json") {
    fail("Release manifest should not include release-manifest.json.");
  }

  if (entry.path === "release-manifest.sha256.txt") {
    fail("Release manifest should not include release-manifest.sha256.txt.");
  }

  if (typeof entry.bytes !== "number" || entry.bytes < 0) {
    fail(`Release manifest has invalid byte count for ${entry.path}.`);
  }

  if (!/^[a-f0-9]{64}$/.test(entry.sha256)) {
    fail(`Release manifest has invalid SHA-256 hash for ${entry.path}.`);
  }
}

function verifyListedFiles(manifest) {
  const seenPaths = new Set();

  for (const entry of manifest.files) {
    verifyFileEntry(entry);

    if (seenPaths.has(entry.path)) {
      fail(`Release manifest contains duplicate file path: ${entry.path}`);
    }

    seenPaths.add(entry.path);

    const filePath = path.join(ROOT_DIR, entry.path);

    if (!fs.existsSync(filePath)) {
      fail(`Missing file listed in release manifest: ${entry.path}`);
    }

    const contents = readFile(filePath);
    const currentBytes = contents.length;
    const currentHash = sha256(contents);

    if (currentBytes !== entry.bytes) {
      fail(
        [
          `Byte count mismatch for ${entry.path}.`,
          `Expected: ${entry.bytes}`,
          `Current:  ${currentBytes}`
        ].join("\n")
      );
    }

    if (currentHash !== entry.sha256) {
      fail(
        [
          `Hash mismatch for ${entry.path}.`,
          `Expected: ${entry.sha256}`,
          `Current:  ${currentHash}`
        ].join("\n")
      );
    }
  }
}

function main() {
  const releaseManifestHash = verifyReleaseManifestHash();
  const manifest = JSON.parse(readText(RELEASE_MANIFEST_PATH));

  verifyManifestStructure(manifest);
  verifyListedFiles(manifest);

  console.log("✅ Release manifest check passed.");
  console.log(`Files checked: ${manifest.files.length}`);
  console.log(`Release manifest SHA-256: ${releaseManifestHash}`);
}

try {
  main();
} catch (error) {
  console.error("Release manifest check failed.");
  console.error(error.message);
  process.exit(1);
}