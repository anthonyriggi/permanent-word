const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT_DIR = path.join(__dirname, "..");
const SOURCE_DIR = path.join(ROOT_DIR, "source");

const INPUT_PATH = path.join(SOURCE_DIR, "kjv-gutenberg.txt");
const OUTPUT_PATH = path.join(SOURCE_DIR, "john-gutenberg.json");
const OUTPUT_HASH_PATH = path.join(SOURCE_DIR, "john-gutenberg.sha256.txt");

const EXPECTED_CHAPTER_COUNT = 21;
const EXPECTED_TOTAL_VERSES = 879;

function sha256(value) {
  return crypto.createHash("sha256").update(value, "utf8").digest("hex");
}

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function writeJson(filePath, value) {
  const json = `${JSON.stringify(value, null, 2)}\n`;
  fs.writeFileSync(filePath, json, "utf8");
  return json;
}

function writeText(filePath, value) {
  fs.writeFileSync(filePath, value, "utf8");
}

function cleanText(value) {
  return value.trim().replace(/\s+/g, " ");
}

function getHeadingMatches(text, regex) {
  const matches = [];
  let match;

  while ((match = regex.exec(text)) !== null) {
    matches.push({
      index: match.index,
      text: match[0]
    });
  }

  return matches;
}

function findCandidateSections(sourceText) {
  const normalizedText = sourceText.replace(/\r\n/g, "\n");

  const johnHeadingRegex =
    /^[ \t]*(?:The\s+)?Gospel\s+According\s+to\s+(?:(?:Saint|St\.?)\s+)?John[ \t]*$/gim;

  const actsHeadingRegex =
    /^[ \t]*(?:The\s+)?Acts\s+of\s+the\s+Apostles[ \t]*$/gim;

  const johnHeadings = getHeadingMatches(normalizedText, johnHeadingRegex);
  const actsHeadings = getHeadingMatches(normalizedText, actsHeadingRegex);

  if (johnHeadings.length === 0) {
    throw new Error("Could not find any Gospel of John heading.");
  }

  if (actsHeadings.length === 0) {
    throw new Error("Could not find any Acts heading.");
  }

  const candidates = [];

  for (const johnHeading of johnHeadings) {
    const nextActsHeading = actsHeadings.find((actsHeading) => {
      return actsHeading.index > johnHeading.index;
    });

    if (!nextActsHeading) {
      continue;
    }

    const startIndex = johnHeading.index + johnHeading.text.length;
    const endIndex = nextActsHeading.index;
    const sectionText = normalizedText.slice(startIndex, endIndex);

    candidates.push({
      startIndex,
      endIndex,
      heading: cleanText(johnHeading.text),
      sectionText
    });
  }

  return candidates;
}

function parseJohn(johnText) {
  const chaptersByNumber = new Map();

  // Normalize the section into one stream so we can detect verses even when
  // Gutenberg places multiple verse markers on the same line.
  const normalized = johnText
    .replace(/\r\n/g, "\n")
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Match every marker like:
  // 1:1 In the beginning...
  // 001:001 In the beginning...
  // John 1:1 In the beginning...
  //
  // The text for a verse continues until the next chapter:verse marker.
  const verseRegex =
    /(?:^|\s)(?:John\s+)?0*(\d{1,3}):0*(\d{1,3})\s+([\s\S]*?)(?=\s+(?:John\s+)?0*\d{1,3}:0*\d{1,3}\s+|$)/gi;

  let match;

  while ((match = verseRegex.exec(normalized)) !== null) {
    const chapterNumber = Number(match[1]);
    const verseNumber = Number(match[2]);
    const verseText = cleanText(match[3]);

    if (!chaptersByNumber.has(chapterNumber)) {
      chaptersByNumber.set(chapterNumber, []);
    }

    chaptersByNumber.get(chapterNumber).push({
      number: verseNumber,
      text: verseText
    });
  }

  return [...chaptersByNumber.entries()]
    .sort(([a], [b]) => a - b)
    .map(([chapterNumber, verses]) => ({
      book: "John",
      chapter: chapterNumber,
      slug: `john-${chapterNumber}`,
      heading: "",
      verses
    }));
}

function getTotalVerses(chapters) {
  return chapters.reduce((sum, chapter) => {
    return sum + chapter.verses.length;
  }, 0);
}

function validateChapters(chapters) {
  const totalVerses = getTotalVerses(chapters);

  if (chapters.length !== EXPECTED_CHAPTER_COUNT) {
    throw new Error(
      `Expected ${EXPECTED_CHAPTER_COUNT} chapters, but found ${chapters.length}.`
    );
  }

  if (totalVerses !== EXPECTED_TOTAL_VERSES) {
    throw new Error(
      `Expected ${EXPECTED_TOTAL_VERSES} verses, but found ${totalVerses}.`
    );
  }

  for (let index = 0; index < chapters.length; index += 1) {
    const expectedChapterNumber = index + 1;
    const chapter = chapters[index];

    if (chapter.chapter !== expectedChapterNumber) {
      throw new Error(
        `Expected chapter ${expectedChapterNumber}, but found chapter ${chapter.chapter}.`
      );
    }

    for (let verseIndex = 0; verseIndex < chapter.verses.length; verseIndex += 1) {
      const expectedVerseNumber = verseIndex + 1;
      const verse = chapter.verses[verseIndex];

      if (verse.number !== expectedVerseNumber) {
        throw new Error(
          `John ${chapter.chapter}: expected verse ${expectedVerseNumber}, but found verse ${verse.number}.`
        );
      }

      if (!verse.text) {
        throw new Error(`John ${chapter.chapter}:${verse.number} is missing text.`);
      }
    }
  }
}

function selectValidJohnCandidate(sourceText) {
  const candidates = findCandidateSections(sourceText);

  console.log(`Found ${candidates.length} possible John section(s).`);

  const failures = [];

  for (const [index, candidate] of candidates.entries()) {
    const chapters = parseJohn(candidate.sectionText);
    const totalVerses = getTotalVerses(chapters);

    console.log(
      `Candidate ${index + 1}: ${chapters.length} chapter(s), ${totalVerses} verse(s)`
    );

    try {
      validateChapters(chapters);
      return {
        candidate,
        chapters
      };
    } catch (error) {
      failures.push(`Candidate ${index + 1}: ${error.message}`);
    }
  }

  throw new Error(
    [
      "Could not find a valid Gospel of John section.",
      "",
      "Candidate results:",
      ...failures
    ].join("\n")
  );
}

function main() {
  if (!fs.existsSync(INPUT_PATH)) {
    throw new Error(
      "Missing source/kjv-gutenberg.txt. Run npm run source:download first."
    );
  }

  const sourceText = readText(INPUT_PATH);
  const { chapters } = selectValidJohnCandidate(sourceText);

  const output = {
    title: "Permanent Word",
    translation: "KJV",
    source: {
      provider: "Project Gutenberg",
      sourceFile: "source/kjv-gutenberg.txt",
      importedBook: "John"
    },
    chapters
  };

  const outputJson = writeJson(OUTPUT_PATH, output);
  const outputHash = sha256(outputJson);

  writeText(OUTPUT_HASH_PATH, `${outputHash}\n`);

  console.log("");
  console.log("Imported Gospel of John from Gutenberg source.");
  console.log(`Chapters: ${chapters.length}`);
  console.log(`Verses: ${EXPECTED_TOTAL_VERSES}`);
  console.log(`Saved: ${path.relative(ROOT_DIR, OUTPUT_PATH)}`);
  console.log(`SHA-256: ${outputHash}`);
}

try {
  main();
} catch (error) {
  console.error("");
  console.error("John import failed.");
  console.error(error.message);
  process.exit(1);
}