const fs = require("fs");
const path = require("path");
const https = require("https");
const crypto = require("crypto");

const ROOT_DIR = path.join(__dirname, "..");
const SOURCE_DIR = path.join(ROOT_DIR, "source");

const OUTPUT_TEXT_PATH = path.join(SOURCE_DIR, "kjv-gutenberg.txt");
const OUTPUT_HASH_PATH = path.join(SOURCE_DIR, "kjv-gutenberg.sha256.txt");
const OUTPUT_MANIFEST_PATH = path.join(SOURCE_DIR, "source-manifest.json");

const SOURCE_INFO = {
  name: "The King James Version of the Bible",
  provider: "Project Gutenberg",
  ebookNumber: "10",
  sourcePage: "https://www.gutenberg.org/ebooks/10",
  licenseNote: "Project Gutenberg lists this work as public domain in the USA.",
  downloadedFrom: null,
  sha256: null
};

const SOURCE_URLS = [
  "https://www.gutenberg.org/cache/epub/10/pg10.txt",
  "https://www.gutenberg.org/files/10/10-0.txt",
  "https://www.gutenberg.org/ebooks/10.txt.utf-8"
];

function ensureSourceDir() {
  fs.mkdirSync(SOURCE_DIR, { recursive: true });
}

function sha256(value) {
  return crypto.createHash("sha256").update(value, "utf8").digest("hex");
}

function download(url, redirectCount = 0) {
  return new Promise((resolve, reject) => {
    if (redirectCount > 5) {
      reject(new Error("Too many redirects"));
      return;
    }

    https
      .get(
        url,
        {
          headers: {
            "User-Agent": "permanent-word-source-downloader/0.1"
          }
        },
        (response) => {
          const status = response.statusCode || 0;

          if ([301, 302, 303, 307, 308].includes(status)) {
            const location = response.headers.location;

            if (!location) {
              reject(new Error(`Redirect without location for ${url}`));
              return;
            }

            const nextUrl = new URL(location, url).toString();
            resolve(download(nextUrl, redirectCount + 1));
            return;
          }

          if (status < 200 || status >= 300) {
            reject(new Error(`Request failed with status ${status} for ${url}`));
            return;
          }

          response.setEncoding("utf8");

          let body = "";

          response.on("data", (chunk) => {
            body += chunk;
          });

          response.on("end", () => {
            resolve(body);
          });
        }
      )
      .on("error", reject);
  });
}

async function downloadFirstWorkingSource() {
  let lastError = null;

  for (const url of SOURCE_URLS) {
    try {
      console.log(`Trying ${url}`);
      const text = await download(url);

      if (!text.includes("The King James Version of the Bible")) {
        throw new Error("Downloaded text does not look like the expected KJV source.");
      }

      return {
        url,
        text
      };
    } catch (error) {
      lastError = error;
      console.warn(`Failed: ${error.message}`);
    }
  }

  throw lastError || new Error("Could not download source text.");
}

async function main() {
  ensureSourceDir();

  const result = await downloadFirstWorkingSource();
  const hash = sha256(result.text);

  fs.writeFileSync(OUTPUT_TEXT_PATH, result.text, "utf8");
  fs.writeFileSync(OUTPUT_HASH_PATH, `${hash}\n`, "utf8");

  const manifest = {
    ...SOURCE_INFO,
    downloadedFrom: result.url,
    sha256: hash
  };

  fs.writeFileSync(
    OUTPUT_MANIFEST_PATH,
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8"
  );

  console.log("");
  console.log("Source downloaded.");
  console.log(`Saved: ${path.relative(ROOT_DIR, OUTPUT_TEXT_PATH)}`);
  console.log(`SHA-256: ${hash}`);
  console.log(`Manifest: ${path.relative(ROOT_DIR, OUTPUT_MANIFEST_PATH)}`);
}

main().catch((error) => {
  console.error("");
  console.error("Source download failed.");
  console.error(error.message);
  process.exit(1);
});