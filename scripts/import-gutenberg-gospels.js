const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT_DIR = path.join(__dirname, "..");
const SOURCE_DIR = path.join(ROOT_DIR, "source");

const INPUT_PATH = path.join(SOURCE_DIR, "kjv-gutenberg.txt");
const OUTPUT_PATH = path.join(SOURCE_DIR, "gospels-gutenberg.json");
const OUTPUT_HASH_PATH = path.join(SOURCE_DIR, "gospels-gutenberg.sha256.txt");

const BOOKS = [
  {
    book: "Matthew",
    slug: "matthew",
    headingRegex:
      /^[ \t]*(?:The\s+)?Gospel\s+According\s+to\s+(?:(?:Saint|St\.?)\s+)?Matthew[ \t]*$/gim,
    nextHeadingRegex:
      /^[ \t]*(?:The\s+)?Gospel\s+According\s+to\s+(?:(?:Saint|St\.?)\s+)?Mark[ \t]*$/gim,
    expectedChapters: 28,
    expectedVerses: 1071
  },
  {
    book: "Mark",
    slug: "mark",
    headingRegex:
      /^[ \t]*(?:The\s+)?Gospel\s+According\s+to\s+(?:(?:Saint|St\.?)\s+)?Mark[ \t]*$/gim,
    nextHeadingRegex:
      /^[ \t]*(?:The\s+)?Gospel\s+According\s+to\s+(?:(?:Saint|St\.?)\s+)?Luke[ \t]*$/gim,
    expectedChapters: 16,
    expectedVerses: 678
  },
  {
    book: "Luke",
    slug: "luke",
    headingRegex:
      /^[ \t]*(?:The\s+)?Gospel\s+According\s+to\s+(?:(?:Saint|St\.?)\s+)?Luke[ \t]*$/gim,
    nextHeadingRegex:
      /^[ \t]*(?:The\s+)?Gospel\s+According\s+to\s+(?:(?:Saint|St\.?)\s+)?John[ \t]*$/gim,
    expectedChapters: 24,
    expectedVerses: 1151
  },
  {
    book: "John",
    slug: "john",
    headingRegex:
      /^[ \t]*(?:The\s+)?Gospel\s+According\s+to\s+(?:(?:Saint|St\.?)\s+)?John[ \t]*$/gim,
    nextHeadingRegex:
      /^[ \t]*(?:The\s+)?Acts\s+of\s+the\s+Apostles[ \t]*$/gim,
    expectedChapters: 21,
    expectedVerses: 879
  }
];

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
  regex.lastIndex = 0;

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

function findCandidateSections(sourceText, bookConfig) {
  const normalizedText = sourceText.replace(/\r\n/g, "\n");

  const bookHeadings = getHeadingMatches(normalizedText, bookConfig.headingRegex);
  const nextHeadings = getHeadingMatches(normalizedText, bookConfig.nextHeadingRegex);

  if (bookHeadings.length === 0) {
    throw new Error(`Could not find any ${bookConfig.book} heading.`);
  }

  if (nextHeadings.length === 0) {
    throw new Error(`Could not find next heading after ${bookConfig.book}.`);
  }

  const candidates = [];

  for (const bookHeading of bookHeadings) {
    const nextHeading = nextHeadings.find((candidate) => {
      return candidate.index > bookHeading.index;
    });

    if (!nextHeading) {
      continue;
    }

    const startIndex = bookHeading.index + bookHeading.text.length;
    const endIndex = nextHeading.index;
    const sectionText = normalizedText.slice(startIndex, endIndex);

    candidates.push({
      startIndex,
      endIndex,
      heading: cleanText(bookHeading.text),
      sectionText
    });
  }

  return candidates;
}

function parseBook(sectionText, bookConfig) {
  const chaptersByNumber = new Map();

  const normalized = sectionText
    .replace(/\r\n/g, "\n")
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const escapedBookName = bookConfig.book.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const verseRegex = new RegExp(
    String.raw`(?:^|\s)(?:${escapedBookName}\s+)?0*(\d{1,3}):0*(\d{1,3})\s+([\s\S]*?)(?=\s+(?:${escapedBookName}\s+)?0*\d{1,3}:0*\d{1,3}\s+|$)`,
    "gi"
  );

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
      book: bookConfig.book,
      chapter: chapterNumber,
      slug: `${bookConfig.slug}-${chapterNumber}`,
      heading: "",
      verses
    }));
}

function getTotalVerses(chapters) {
  return chapters.reduce((sum, chapter) => {
    return sum + chapter.verses.length;
  }, 0);
}

function validateBookChapters(chapters, bookConfig) {
  const totalVerses = getTotalVerses(chapters);

  if (chapters.length !== bookConfig.expectedChapters) {
    throw new Error(
      `Expected ${bookConfig.expectedChapters} chapters, but found ${chapters.length}.`
    );
  }

  if (totalVerses !== bookConfig.expectedVerses) {
    throw new Error(
      `Expected ${bookConfig.expectedVerses} verses, but found ${totalVerses}.`
    );
  }

  for (let index = 0; index < chapters.length; index += 1) {
    const expectedChapterNumber = index + 1;
    const chapter = chapters[index];

    if (chapter.chapter !== expectedChapterNumber) {
      throw new Error(
        `${bookConfig.book}: expected chapter ${expectedChapterNumber}, but found chapter ${chapter.chapter}.`
      );
    }

    for (let verseIndex = 0; verseIndex < chapter.verses.length; verseIndex += 1) {
      const expectedVerseNumber = verseIndex + 1;
      const verse = chapter.verses[verseIndex];

      if (verse.number !== expectedVerseNumber) {
        throw new Error(
          `${bookConfig.book} ${chapter.chapter}: expected verse ${expectedVerseNumber}, but found verse ${verse.number}.`
        );
      }

      if (!verse.text) {
        throw new Error(`${bookConfig.book} ${chapter.chapter}:${verse.number} is missing text.`);
      }
    }
  }
}

function selectValidBookCandidate(sourceText, bookConfig) {
  const candidates = findCandidateSections(sourceText, bookConfig);

  console.log("");
  console.log(`Importing ${bookConfig.book}...`);
  console.log(`Found ${candidates.length} possible ${bookConfig.book} section(s).`);

  const failures = [];

  for (const [index, candidate] of candidates.entries()) {
    const chapters = parseBook(candidate.sectionText, bookConfig);
    const totalVerses = getTotalVerses(chapters);

    console.log(
      `Candidate ${index + 1}: ${chapters.length} chapter(s), ${totalVerses} verse(s)`
    );

    try {
      validateBookChapters(chapters, bookConfig);

      console.log(
        `Selected candidate ${index + 1} for ${bookConfig.book}.`
      );

      return chapters;
    } catch (error) {
      failures.push(`Candidate ${index + 1}: ${error.message}`);
    }
  }

  throw new Error(
    [
      `Could not find a valid ${bookConfig.book} section.`,
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
  const chapters = [];

  for (const bookConfig of BOOKS) {
    const bookChapters = selectValidBookCandidate(sourceText, bookConfig);
    chapters.push(...bookChapters);
  }

  const expectedTotalChapters = BOOKS.reduce((sum, book) => {
    return sum + book.expectedChapters;
  }, 0);

  const expectedTotalVerses = BOOKS.reduce((sum, book) => {
    return sum + book.expectedVerses;
  }, 0);

  const actualTotalVerses = getTotalVerses(chapters);

  if (chapters.length !== expectedTotalChapters) {
    throw new Error(
      `Expected ${expectedTotalChapters} total chapters, but found ${chapters.length}.`
    );
  }

  if (actualTotalVerses !== expectedTotalVerses) {
    throw new Error(
      `Expected ${expectedTotalVerses} total verses, but found ${actualTotalVerses}.`
    );
  }

  const output = {
    title: "Permanent Word",
    translation: "KJV",
    source: {
      provider: "Project Gutenberg",
      sourceFile: "source/kjv-gutenberg.txt",
      importedCollection: "The Four Gospels",
      importedBooks: BOOKS.map((book) => book.book)
    },
    chapters
  };

  const outputJson = writeJson(OUTPUT_PATH, output);
  const outputHash = sha256(outputJson);

  writeText(OUTPUT_HASH_PATH, `${outputHash}\n`);

  console.log("");
  console.log("Imported the Four Gospels from Gutenberg source.");
  console.log(`Books: ${BOOKS.map((book) => book.book).join(", ")}`);
  console.log(`Chapters: ${chapters.length}`);
  console.log(`Verses: ${actualTotalVerses}`);
  console.log(`Saved: ${path.relative(ROOT_DIR, OUTPUT_PATH)}`);
  console.log(`SHA-256: ${outputHash}`);
}

try {
  main();
} catch (error) {
  console.error("");
  console.error("Gospels import failed.");
  console.error(error.message);
  process.exit(1);
}