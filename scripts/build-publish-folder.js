const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT_DIR = path.join(__dirname, "..");
const DIST_DIR = path.join(ROOT_DIR, "dist");

const ROOT_FILES_TO_COPY = [
  "index.html",
  "styles.css",
  "app.js",
  "package.json",
  "README.md",
  "SOURCE.md",
  "ARCHITECTURE.md",
  "RELEASE.md",
  ".nojekyll"
];

const DIRECTORIES_TO_COPY = [
  "scripts",
  "source"
];

const EXCLUDED_NAMES = new Set([
  ".DS_Store",
  "node_modules",
  "dist",
  ".git"
]);

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function readJson(filePath) {
  return JSON.parse(readText(filePath));
}

function writeText(filePath, value) {
  fs.writeFileSync(filePath, value, "utf8");
}

function writeJson(filePath, value) {
  const json = `${JSON.stringify(value, null, 2)}\n`;
  writeText(filePath, json);
  return json;
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

function toPosixPath(filePath) {
  return filePath.split(path.sep).join("/");
}

function normalizeProjectPath(filePath) {
  return filePath.replace(/^\.\//, "");
}

function getPackageVersion() {
  const packageJson = readJson(path.join(ROOT_DIR, "package.json"));
  return packageJson.version || "0.0.0";
}

function copyRootFiles(destinationRoot) {
  for (const relativePath of ROOT_FILES_TO_COPY) {
    const sourcePath = path.join(ROOT_DIR, relativePath);

    if (!fs.existsSync(sourcePath)) {
      continue;
    }

    copyFile(sourcePath, path.join(destinationRoot, relativePath));
  }
}

function copyDirectory(sourceDirectory, destinationDirectory) {
  if (!fs.existsSync(sourceDirectory)) {
    return 0;
  }

  ensureDirectory(destinationDirectory);

  let copiedFiles = 0;
  const entries = fs.readdirSync(sourceDirectory, { withFileTypes: true });

  for (const entry of entries) {
    if (EXCLUDED_NAMES.has(entry.name)) {
      continue;
    }

    const sourcePath = path.join(sourceDirectory, entry.name);
    const destinationPath = path.join(destinationDirectory, entry.name);

    if (entry.isDirectory()) {
      copiedFiles += copyDirectory(sourcePath, destinationPath);
      continue;
    }

    if (entry.isFile()) {
      copyFile(sourcePath, destinationPath);
      copiedFiles += 1;
    }
  }

  return copiedFiles;
}

function copySupportDirectories(destinationRoot) {
  let copiedFiles = 0;

  for (const directoryName of DIRECTORIES_TO_COPY) {
    const sourceDirectory = path.join(ROOT_DIR, directoryName);
    const destinationDirectory = path.join(destinationRoot, directoryName);
    copiedFiles += copyDirectory(sourceDirectory, destinationDirectory);
  }

  return copiedFiles;
}

function buildCompactBibleData(destinationRoot) {
  const sourceManifestPath = path.join(ROOT_DIR, "data", "manifest.json");
  const sourceManifestHashPath = path.join(ROOT_DIR, "data", "manifest.sha256.txt");

  if (!fs.existsSync(sourceManifestPath)) {
    throw new Error("Missing data/manifest.json. Run npm run verify first.");
  }

  if (!fs.existsSync(sourceManifestHashPath)) {
    throw new Error("Missing data/manifest.sha256.txt. Run npm run verify first.");
  }

  const sourceManifestRaw = readText(sourceManifestPath);
  const sourceManifest = JSON.parse(sourceManifestRaw);
  const sourceManifestCurrentHash = sha256(Buffer.from(sourceManifestRaw, "utf8"));
  const sourceManifestExpectedHash = readText(sourceManifestHashPath).trim();

  if (sourceManifestCurrentHash !== sourceManifestExpectedHash) {
    throw new Error("data/manifest.json does not match data/manifest.sha256.txt. Run npm run verify first.");
  }

  if (!Array.isArray(sourceManifest.chapters)) {
    throw new Error("data/manifest.json is missing a chapters array.");
  }

  const chaptersByPath = {};

  for (const chapterEntry of sourceManifest.chapters) {
    const textPath = normalizeProjectPath(chapterEntry.textPath);
    const chapterPath = path.join(ROOT_DIR, textPath);

    if (!fs.existsSync(chapterPath)) {
      throw new Error(`Missing chapter file: ${chapterEntry.textPath}`);
    }

    const rawChapter = readText(chapterPath);
    const currentChapterHash = sha256(Buffer.from(rawChapter, "utf8"));

    if (chapterEntry.sha256 && currentChapterHash !== chapterEntry.sha256) {
      throw new Error(`Chapter hash mismatch for ${chapterEntry.textPath}`);
    }

    chaptersByPath[chapterEntry.textPath] = rawChapter;
    chaptersByPath[textPath] = rawChapter;
  }

  const compactManifest = {
    ...sourceManifest,
    source: {
      ...(sourceManifest.source || {}),
      publishFormat: "compact-bundle",
      bundlePath: "./data/bible.json",
      bundleHashPath: "./data/bible.sha256.txt",
      originalManifestHash: sourceManifestExpectedHash,
      originalChapterFileCount: sourceManifest.chapters.length,
      note: "This publish folder uses a compact Bible bundle for IPFS/Arweave-friendly uploading. Chapter text hashes remain the same as the source manifest."
    }
  };

  const bibleBundle = {
    project: "Permanent Word",
    bundleFormatVersion: 1,
    hashAlgorithm: "SHA-256",
    title: sourceManifest.title || "Permanent Word",
    translation: sourceManifest.translation || "Unknown",
    source: compactManifest.source,
    chapterCount: sourceManifest.chapters.length,
    sourceManifestHash: sourceManifestExpectedHash,
    chaptersByPath
  };

  const dataDirectory = path.join(destinationRoot, "data");
  ensureDirectory(dataDirectory);

  const compactManifestJson = writeJson(
    path.join(dataDirectory, "manifest.json"),
    compactManifest
  );

  writeText(
    path.join(dataDirectory, "manifest.sha256.txt"),
    `${sha256(Buffer.from(compactManifestJson, "utf8"))}\n`
  );

  const bibleBundleJson = writeJson(
    path.join(dataDirectory, "bible.json"),
    bibleBundle
  );

  writeText(
    path.join(dataDirectory, "bible.sha256.txt"),
    `${sha256(Buffer.from(bibleBundleJson, "utf8"))}\n`
  );

  return {
    chapterCount: sourceManifest.chapters.length,
    sourceManifestHash: sourceManifestExpectedHash,
    bibleBundleHash: sha256(Buffer.from(bibleBundleJson, "utf8"))
  };
}

function walkFiles(directoryPath) {
  const files = [];
  const entries = fs.readdirSync(directoryPath, { withFileTypes: true });

  for (const entry of entries) {
    if (EXCLUDED_NAMES.has(entry.name)) {
      continue;
    }

    if (
      entry.name === "release-manifest.json" ||
      entry.name === "release-manifest.sha256.txt"
    ) {
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

function buildPublishReleaseManifest(destinationRoot, compactDataSummary) {
  const files = walkFiles(destinationRoot)
    .map((filePath) => {
      const relativePath = toPosixPath(path.relative(destinationRoot, filePath));
      const contents = fs.readFileSync(filePath);

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
    publishFormat: "compact-site",
    hashAlgorithm: "SHA-256",
    summary: {
      title: "Permanent Word",
      translation: "KJV",
      importedCollection: "Full Bible",
      chapterCount: compactDataSummary.chapterCount,
      sourceManifestHash: compactDataSummary.sourceManifestHash,
      bibleBundleHash: compactDataSummary.bibleBundleHash
    },
    files
  };

  const releaseManifestJson = writeJson(
    path.join(destinationRoot, "release-manifest.json"),
    releaseManifest
  );

  const releaseManifestHash = sha256(Buffer.from(releaseManifestJson, "utf8"));

  writeText(
    path.join(destinationRoot, "release-manifest.sha256.txt"),
    `${releaseManifestHash}\n`
  );

  return {
    fileCount: files.length,
    releaseManifestHash
  };
}

function countFiles(directoryPath) {
  let count = 0;
  const entries = fs.readdirSync(directoryPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(directoryPath, entry.name);

    if (entry.isDirectory()) {
      count += countFiles(fullPath);
      continue;
    }

    if (entry.isFile()) {
      count += 1;
    }
  }

  return count;
}

function buildPublishFolder() {
  const version = getPackageVersion();
  const folderName = `permanent-word-v${version}-site`;
  const publishFolderPath = path.join(DIST_DIR, folderName);

  removeDirectory(publishFolderPath);
  ensureDirectory(publishFolderPath);

  copyRootFiles(publishFolderPath);
  const supportFilesCopied = copySupportDirectories(publishFolderPath);
  const compactDataSummary = buildCompactBibleData(publishFolderPath);
  const publishReleaseManifestSummary = buildPublishReleaseManifest(
    publishFolderPath,
    compactDataSummary
  );

  console.log("Compact publish folder generated.");
  console.log(`Version: v${version}`);
  console.log(`Folder: ${path.relative(ROOT_DIR, publishFolderPath)}`);
  console.log(`Chapters bundled: ${compactDataSummary.chapterCount}`);
  console.log(`Support files copied: ${supportFilesCopied}`);
  console.log(`Release manifest files: ${publishReleaseManifestSummary.fileCount}`);
  console.log(`Total files in publish folder: ${countFiles(publishFolderPath)}`);
  console.log(`Release manifest SHA-256: ${publishReleaseManifestSummary.releaseManifestHash}`);
}

try {
  buildPublishFolder();
} catch (error) {
  console.error("Compact publish folder build failed.");
  console.error(error.message);
  process.exit(1);
}