const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT_DIR = path.join(__dirname, "..");
const SOURCE_DIR = path.join(ROOT_DIR, "source");

const INPUT_PATH = path.join(SOURCE_DIR, "kjv-gutenberg.txt");
const OUTPUT_PATH = path.join(SOURCE_DIR, "new-testament-gutenberg.json");
const OUTPUT_HASH_PATH = path.join(SOURCE_DIR, "new-testament-gutenberg.sha256.txt");

const BOOKS = [
  {
    book: "Matthew",
    slug: "matthew",
    headingAliases: [
      "The Gospel According to Saint Matthew",
      "The Gospel According to St. Matthew",
      "The Gospel According to Matthew"
    ],
    expectedChapters: 28,
    expectedVerses: 1071
  },
  {
    book: "Mark",
    slug: "mark",
    headingAliases: [
      "The Gospel According to Saint Mark",
      "The Gospel According to St. Mark",
      "The Gospel According to Mark"
    ],
    expectedChapters: 16,
    expectedVerses: 678
  },
  {
    book: "Luke",
    slug: "luke",
    headingAliases: [
      "The Gospel According to Saint Luke",
      "The Gospel According to St. Luke",
      "The Gospel According to Luke"
    ],
    expectedChapters: 24,
    expectedVerses: 1151
  },
  {
    book: "John",
    slug: "john",
    headingAliases: [
      "The Gospel According to Saint John",
      "The Gospel According to St. John",
      "The Gospel According to John"
    ],
    expectedChapters: 21,
    expectedVerses: 879
  },
  {
    book: "Acts",
    slug: "acts",
    headingAliases: [
      "The Acts of the Apostles",
      "Acts of the Apostles"
    ],
    expectedChapters: 28,
    expectedVerses: 1007
  },
  {
    book: "Romans",
    slug: "romans",
    headingAliases: [
      "The Epistle of Paul the Apostle to the Romans",
      "The Epistle to the Romans",
      "Romans"
    ],
    expectedChapters: 16,
    expectedVerses: 433
  },
  {
    book: "1 Corinthians",
    slug: "1-corinthians",
    headingAliases: [
      "The First Epistle of Paul the Apostle to the Corinthians",
      "The First Epistle to the Corinthians",
      "First Corinthians",
      "1 Corinthians",
      "I Corinthians"
    ],
    expectedChapters: 16,
    expectedVerses: 437
  },
  {
    book: "2 Corinthians",
    slug: "2-corinthians",
    headingAliases: [
      "The Second Epistle of Paul the Apostle to the Corinthians",
      "The Second Epistle to the Corinthians",
      "Second Corinthians",
      "2 Corinthians",
      "II Corinthians"
    ],
    expectedChapters: 13,
    expectedVerses: 257
  },
  {
    book: "Galatians",
    slug: "galatians",
    headingAliases: [
      "The Epistle of Paul the Apostle to the Galatians",
      "The Epistle to the Galatians",
      "Galatians"
    ],
    expectedChapters: 6,
    expectedVerses: 149
  },
  {
    book: "Ephesians",
    slug: "ephesians",
    headingAliases: [
      "The Epistle of Paul the Apostle to the Ephesians",
      "The Epistle to the Ephesians",
      "Ephesians"
    ],
    expectedChapters: 6,
    expectedVerses: 155
  },
  {
    book: "Philippians",
    slug: "philippians",
    headingAliases: [
      "The Epistle of Paul the Apostle to the Philippians",
      "The Epistle to the Philippians",
      "Philippians"
    ],
    expectedChapters: 4,
    expectedVerses: 104
  },
  {
    book: "Colossians",
    slug: "colossians",
    headingAliases: [
      "The Epistle of Paul the Apostle to the Colossians",
      "The Epistle to the Colossians",
      "Colossians"
    ],
    expectedChapters: 4,
    expectedVerses: 95
  },
  {
    book: "1 Thessalonians",
    slug: "1-thessalonians",
    headingAliases: [
      "The First Epistle of Paul the Apostle to the Thessalonians",
      "The First Epistle to the Thessalonians",
      "First Thessalonians",
      "1 Thessalonians",
      "I Thessalonians"
    ],
    expectedChapters: 5,
    expectedVerses: 89
  },
  {
    book: "2 Thessalonians",
    slug: "2-thessalonians",
    headingAliases: [
      "The Second Epistle of Paul the Apostle to the Thessalonians",
      "The Second Epistle to the Thessalonians",
      "Second Thessalonians",
      "2 Thessalonians",
      "II Thessalonians"
    ],
    expectedChapters: 3,
    expectedVerses: 47
  },
  {
    book: "1 Timothy",
    slug: "1-timothy",
    headingAliases: [
      "The First Epistle of Paul the Apostle to Timothy",
      "The First Epistle to Timothy",
      "First Timothy",
      "1 Timothy",
      "I Timothy"
    ],
    expectedChapters: 6,
    expectedVerses: 113
  },
  {
    book: "2 Timothy",
    slug: "2-timothy",
    headingAliases: [
      "The Second Epistle of Paul the Apostle to Timothy",
      "The Second Epistle to Timothy",
      "Second Timothy",
      "2 Timothy",
      "II Timothy"
    ],
    expectedChapters: 4,
    expectedVerses: 83
  },
  {
    book: "Titus",
    slug: "titus",
    headingAliases: [
      "The Epistle of Paul the Apostle to Titus",
      "The Epistle to Titus",
      "Titus"
    ],
    expectedChapters: 3,
    expectedVerses: 46
  },
  {
    book: "Philemon",
    slug: "philemon",
    headingAliases: [
      "The Epistle of Paul the Apostle to Philemon",
      "The Epistle to Philemon",
      "Philemon"
    ],
    expectedChapters: 1,
    expectedVerses: 25
  },
  {
    book: "Hebrews",
    slug: "hebrews",
    headingAliases: [
      "The Epistle of Paul the Apostle to the Hebrews",
      "The Epistle to the Hebrews",
      "Hebrews"
    ],
    expectedChapters: 13,
    expectedVerses: 303
  },
  {
    book: "James",
    slug: "james",
    headingAliases: [
      "The General Epistle of James",
      "The Epistle of James",
      "James"
    ],
    expectedChapters: 5,
    expectedVerses: 108
  },
  {
    book: "1 Peter",
    slug: "1-peter",
    headingAliases: [
      "The First Epistle General of Peter",
      "The First General Epistle of Peter",
      "First Peter",
      "1 Peter",
      "I Peter"
    ],
    expectedChapters: 5,
    expectedVerses: 105
  },
  {
    book: "2 Peter",
    slug: "2-peter",
    headingAliases: [
      "The Second Epistle General of Peter",
      "The Second General Epistle of Peter",
      "Second Peter",
      "2 Peter",
      "II Peter"
    ],
    expectedChapters: 3,
    expectedVerses: 61
  },
  {
    book: "1 John",
    slug: "1-john",
    headingAliases: [
      "The First Epistle General of John",
      "The First General Epistle of John",
      "First John",
      "1 John",
      "I John"
    ],
    expectedChapters: 5,
    expectedVerses: 105
  },
  {
    book: "2 John",
    slug: "2-john",
    headingAliases: [
      "The Second Epistle General of John",
      "The Second General Epistle of John",
      "Second John",
      "2 John",
      "II John"
    ],
    expectedChapters: 1,
    expectedVerses: 13
  },
  {
    book: "3 John",
    slug: "3-john",
    headingAliases: [
      "The Third Epistle General of John",
      "The Third General Epistle of John",
      "Third John",
      "3 John",
      "III John"
    ],
    expectedChapters: 1,
    expectedVerses: 14
  },
  {
    book: "Jude",
    slug: "jude",
    headingAliases: [
      "The General Epistle of Jude",
      "The Epistle of Jude",
      "Jude"
    ],
    expectedChapters: 1,
    expectedVerses: 25
  },
  {
    book: "Revelation",
    slug: "revelation",
    headingAliases: [
      "The Revelation of Saint John the Divine",
      "The Revelation of St. John the Divine",
      "The Revelation of John",
      "Revelation"
    ],
    expectedChapters: 22,
    expectedVerses: 404
  }
];

const FOOTER_PATTERNS = [
  /^\s*\*\*\*\s*END OF (?:THE )?PROJECT GUTENBERG EBOOK.*$/gim,
  /^\s*\*\*\s*END OF (?:THE )?PROJECT GUTENBERG EBOOK.*$/gim,
  /^\s*End of (?:the )?Project Gutenberg.*$/gim
];

function sha256(value) {
  return crypto.createHash("sha256").update(value, "utf8").digest("hex");
}

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8").replace(/\r\n/g, "\n");
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

function normalizeHeading(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\bst\.?/g, "saint")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getLinesWithOffsets(text) {
  const lines = [];
  const parts = text.split("\n");

  let index = 0;

  for (const part of parts) {
    lines.push({
      index,
      text: part
    });

    index += part.length + 1;
  }

  return lines;
}

function getHeadingMatches(lines, aliases) {
  const normalizedAliases = new Set(aliases.map(normalizeHeading));
  const matches = [];

  for (const line of lines) {
    const normalizedLine = normalizeHeading(line.text);

    if (normalizedAliases.has(normalizedLine)) {
      matches.push({
        index: line.index,
        text: line.text
      });
    }
  }

  return matches;
}

function getFooterMatches(text) {
  const matches = [];

  for (const pattern of FOOTER_PATTERNS) {
    pattern.lastIndex = 0;

    let match;

    while ((match = pattern.exec(text)) !== null) {
      matches.push({
        index: match.index,
        text: match[0]
      });
    }
  }

  return matches.sort((a, b) => a.index - b.index);
}

function findCandidateSections(text, lines, bookConfig, nextBookConfig) {
  const bookHeadings = getHeadingMatches(lines, bookConfig.headingAliases);

  const nextBoundaries = nextBookConfig
    ? getHeadingMatches(lines, nextBookConfig.headingAliases)
    : getFooterMatches(text);

  if (bookHeadings.length === 0) {
    throw new Error(`Could not find any ${bookConfig.book} heading.`);
  }

  const boundaries =
    nextBoundaries.length > 0
      ? nextBoundaries
      : [{ index: text.length, text: "End of file" }];

  const candidates = [];

  for (const bookHeading of bookHeadings) {
    const nextBoundary = boundaries.find((candidate) => {
      return candidate.index > bookHeading.index;
    });

    if (!nextBoundary) {
      continue;
    }

    const startIndex = bookHeading.index + bookHeading.text.length;
    const endIndex = nextBoundary.index;
    const sectionText = text.slice(startIndex, endIndex);

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

  for (let chapterIndex = 0; chapterIndex < chapters.length; chapterIndex += 1) {
    const expectedChapterNumber = chapterIndex + 1;
    const chapter = chapters[chapterIndex];

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

      if (/project gutenberg|ebook|license/i.test(verse.text)) {
        throw new Error(
          `${bookConfig.book} ${chapter.chapter}:${verse.number} appears to include Gutenberg footer text.`
        );
      }
    }
  }
}

function selectValidBookCandidate(text, lines, bookConfig, nextBookConfig) {
  const candidates = findCandidateSections(text, lines, bookConfig, nextBookConfig);

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
      console.log(`Selected candidate ${index + 1} for ${bookConfig.book}.`);
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
  const lines = getLinesWithOffsets(sourceText);
  const chapters = [];

  for (let index = 0; index < BOOKS.length; index += 1) {
    const bookConfig = BOOKS[index];
    const nextBookConfig = BOOKS[index + 1] || null;
    const bookChapters = selectValidBookCandidate(
      sourceText,
      lines,
      bookConfig,
      nextBookConfig
    );

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
      importedCollection: "New Testament",
      importedBooks: BOOKS.map((book) => book.book)
    },
    chapters
  };

  const outputJson = writeJson(OUTPUT_PATH, output);
  const outputHash = sha256(outputJson);

  writeText(OUTPUT_HASH_PATH, `${outputHash}\n`);

  console.log("");
  console.log("Imported the New Testament from Gutenberg source.");
  console.log(`Books: ${BOOKS.length}`);
  console.log(`Chapters: ${chapters.length}`);
  console.log(`Verses: ${actualTotalVerses}`);
  console.log(`Saved: ${path.relative(ROOT_DIR, OUTPUT_PATH)}`);
  console.log(`SHA-256: ${outputHash}`);
}

try {
  main();
} catch (error) {
  console.error("");
  console.error("New Testament import failed.");
  console.error(error.message);
  process.exit(1);
}