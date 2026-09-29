const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { spawnSync } = require("child_process");

const ROOT_DIR = path.join(__dirname, "..");
const DIST_DIR = path.join(ROOT_DIR, "dist");

const EXCLUDED_DIRS = new Set([
  ".git",
  "node_modules",
  "dist"
]);

const EXCLUDED_FILES = new Set([
  ".DS_Store"
]);

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
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

function ensureZipAvailable() {
  const result = spawnSync("zip", ["--version"], {
    encoding: "utf8"
  });

  if (result.error || result.status !== 0) {
    throw new Error(
      "The zip command is not available. On macOS it should usually be installed by default."
    );
  }
}

function getPackageVersion() {
  const packageJson = readJson(path.join(ROOT_DIR, "package.json"));
  return packageJson.version || "0.0.0";
}

function getBundlePaths() {
  const version = getPackageVersion();
  const fileBaseName = `permanent-word-v${version}`;
  const zipPath = path.join(DIST_DIR, `${fileBaseName}.zip`);
  const hashPath = path.join(DIST_DIR, `${fileBaseName}.zip.sha256.txt`);

  return {
    version,
    fileBaseName,
    zipPath,
    hashPath
  };
}

function removeExistingBundle(zipPath, hashPath) {
  if (fs.existsSync(zipPath)) {
    fs.unlinkSync(zipPath);
  }

  if (fs.existsSync(hashPath)) {
    fs.unlinkSync(hashPath);
  }
}

function buildBundle() {
  ensureZipAvailable();

  fs.mkdirSync(DIST_DIR, { recursive: true });

  const { version, zipPath, hashPath } = getBundlePaths();

  removeExistingBundle(zipPath, hashPath);

  const relativeFiles = walkFiles(ROOT_DIR)
    .map((filePath) => toPosixPath(path.relative(ROOT_DIR, filePath)))
    .sort();

  const zipResult = spawnSync(
    "zip",
    ["-q", "-X", zipPath, "-@"],
    {
      cwd: ROOT_DIR,
      input: `${relativeFiles.join("\n")}\n`,
      encoding: "utf8"
    }
  );

  if (zipResult.error) {
    throw zipResult.error;
  }

  if (zipResult.status !== 0) {
    throw new Error(
      [
        "Zip bundle creation failed.",
        zipResult.stderr || ""
      ].join("\n")
    );
  }

  const zipContents = fs.readFileSync(zipPath);
  const zipHash = sha256(zipContents);

  writeText(hashPath, `${zipHash}\n`);

  console.log("Release bundle generated.");
  console.log(`Version: v${version}`);
  console.log(`Files bundled: ${relativeFiles.length}`);
  console.log(`Saved: ${path.relative(ROOT_DIR, zipPath)}`);
  console.log(`SHA-256: ${zipHash}`);
}

try {
  buildBundle();
} catch (error) {
  console.error("Release bundle build failed.");
  console.error(error.message);
  process.exit(1);
}