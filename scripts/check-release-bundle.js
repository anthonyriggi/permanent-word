const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT_DIR = path.join(__dirname, "..");
const DIST_DIR = path.join(ROOT_DIR, "dist");

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function getPackageVersion() {
  const packageJson = readJson(path.join(ROOT_DIR, "package.json"));
  return packageJson.version || "0.0.0";
}

function getBundlePaths() {
  const version = getPackageVersion();
  const fileBaseName = `permanent-word-v${version}`;

  return {
    version,
    zipPath: path.join(DIST_DIR, `${fileBaseName}.zip`),
    hashPath: path.join(DIST_DIR, `${fileBaseName}.zip.sha256.txt`)
  };
}

function main() {
  const { version, zipPath, hashPath } = getBundlePaths();

  if (!fs.existsSync(zipPath)) {
    throw new Error(`Missing release bundle: ${path.relative(ROOT_DIR, zipPath)}`);
  }

  if (!fs.existsSync(hashPath)) {
    throw new Error(`Missing release bundle hash: ${path.relative(ROOT_DIR, hashPath)}`);
  }

  const zipContents = fs.readFileSync(zipPath);
  const currentHash = sha256(zipContents);
  const expectedHash = fs.readFileSync(hashPath, "utf8").trim();

  if (currentHash !== expectedHash) {
    throw new Error(
      [
        "Release bundle hash does not match.",
        `Expected: ${expectedHash}`,
        `Current:  ${currentHash}`
      ].join("\n")
    );
  }

  console.log("✅ Release bundle check passed.");
  console.log(`Version: v${version}`);
  console.log(`Bundle: ${path.relative(ROOT_DIR, zipPath)}`);
  console.log(`SHA-256: ${currentHash}`);
}

try {
  main();
} catch (error) {
  console.error("Release bundle check failed.");
  console.error(error.message);
  process.exit(1);
}