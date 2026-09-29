const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.join(__dirname, "..");
const DIST_DIR = path.join(ROOT_DIR, "dist");

const RELEASE_MANIFEST_PATH = path.join(ROOT_DIR, "release-manifest.json");
const RELEASE_MANIFEST_HASH_PATH = path.join(ROOT_DIR, "release-manifest.sha256.txt");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function ensureDirectory(directoryPath) {
  fs.mkdirSync(directoryPath, { recursive: true });
}

function removeDirectory(directoryPath) {
  if (fs.existsSync(directoryPath)) {
    fs.rmSync(directoryPath, {
      recursive: true,
      force: true
    });
  }
}

function copyFile(sourcePath, destinationPath) {
  ensureDirectory(path.dirname(destinationPath));
  fs.copyFileSync(sourcePath, destinationPath);
}

function getPackageVersion() {
  const packageJson = readJson(path.join(ROOT_DIR, "package.json"));
  return packageJson.version || "0.0.0";
}

function validateRequiredFiles() {
  if (!fs.existsSync(RELEASE_MANIFEST_PATH)) {
    throw new Error("Missing release-manifest.json. Run npm run verify first.");
  }

  if (!fs.existsSync(RELEASE_MANIFEST_HASH_PATH)) {
    throw new Error("Missing release-manifest.sha256.txt. Run npm run verify first.");
  }
}

function buildPublishFolder() {
  validateRequiredFiles();

  const version = getPackageVersion();
  const folderName = `permanent-word-v${version}-site`;
  const publishFolderPath = path.join(DIST_DIR, folderName);

  const releaseManifest = readJson(RELEASE_MANIFEST_PATH);

  if (!Array.isArray(releaseManifest.files)) {
    throw new Error("release-manifest.json is missing a files array.");
  }

  removeDirectory(publishFolderPath);
  ensureDirectory(publishFolderPath);

  let copiedFiles = 0;

  for (const fileEntry of releaseManifest.files) {
    if (!fileEntry.path) {
      throw new Error("Release manifest contains a file entry without a path.");
    }

    const sourcePath = path.join(ROOT_DIR, fileEntry.path);
    const destinationPath = path.join(publishFolderPath, fileEntry.path);

    if (!fs.existsSync(sourcePath)) {
      throw new Error(`Missing file listed in release manifest: ${fileEntry.path}`);
    }

    copyFile(sourcePath, destinationPath);
    copiedFiles += 1;
  }

  copyFile(
    RELEASE_MANIFEST_PATH,
    path.join(publishFolderPath, "release-manifest.json")
  );

  copyFile(
    RELEASE_MANIFEST_HASH_PATH,
    path.join(publishFolderPath, "release-manifest.sha256.txt")
  );

  console.log("Publish folder generated.");
  console.log(`Version: v${version}`);
  console.log(`Folder: ${path.relative(ROOT_DIR, publishFolderPath)}`);
  console.log(`Files copied from release manifest: ${copiedFiles}`);
  console.log("Also copied: release-manifest.json");
  console.log("Also copied: release-manifest.sha256.txt");
}

try {
  buildPublishFolder();
} catch (error) {
  console.error("Publish folder build failed.");
  console.error(error.message);
  process.exit(1);
}