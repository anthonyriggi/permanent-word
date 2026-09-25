# Architecture

Permanent Word is a static Scripture reader with local integrity verification.

The current version builds a KJV full Bible reader from a tracked Project Gutenberg source file.

The project is intentionally simple:

- Static HTML
- Static CSS
- Vanilla JavaScript
- Plain JSON data
- SHA-256 hashes
- No frontend framework
- No backend
- No database
- No runtime package dependencies

## Design principles

### 1. Preserve the text plainly

The Scripture text should exist as readable plain data files.

A chapter file should be understandable without a special application, framework, database, or API.

Example:

```text
data/psalms-23.json
```

### 2. Verify the text locally

The browser verifies the loaded chapter by computing its SHA-256 hash and comparing it against the canonical hash in the manifest.

The terminal verification script also verifies generated files.

### 3. Keep the reader static

The reader should work as a static site.

That means it can be hosted by simple static hosting or later distributed through decentralized storage.

### 4. Separate source from generated data

Source files live in:

```text
source/
```

Generated reader files live in:

```text
data/
```

Application files live at the project root:

```text
index.html
styles.css
app.js
```

### 5. Keep canonical text separate from metadata

The imported Scripture text is the core data.

Book names, chapter numbers, slugs, file paths, UI labels, and source display information are metadata.

Modern editorial headings are not currently imported.

## High-level flow

```text
source/kjv-gutenberg.txt
        ↓
scripts/import-gutenberg-full-bible.js
        ↓
source/full-bible-gutenberg.json
        ↓
scripts/build-data.js
        ↓
data/*.json
data/*.sha256.txt
data/manifest.json
data/manifest.sha256.txt
        ↓
index.html + app.js
        ↓
browser reader + browser verification
```

## Runtime architecture

The browser app does the following:

```text
1. Load data/manifest.json
2. Load data/manifest.sha256.txt
3. Verify the manifest hash
4. Read the current URL hash
5. Load the selected chapter file
6. Compute the chapter SHA-256 hash
7. Compare it to the canonical chapter hash
8. Render the Scripture text
9. Display verification status
```

Example URL:

```text
/#psalms-23
```

Example data file:

```text
data/psalms-23.json
```

Example hash file:

```text
data/psalms-23.sha256.txt
```

## Stable chapter URLs

The app uses hash-based routing.

Examples:

```text
/#genesis-1
/#psalms-23
/#isaiah-53
/#matthew-5
/#romans-8
/#revelation-21
```

Hash routing keeps the app simple because it does not require server routing rules.

When a user changes the book, chapter, or arrow navigation, the URL updates automatically.

When a user opens a URL directly, the app loads that chapter.

## Data model

A generated chapter file looks like this:

```json
{
  "translation": "KJV",
  "book": "Psalms",
  "chapter": 23,
  "heading": "",
  "verses": [
    {
      "number": 1,
      "text": "The LORD is my shepherd; I shall not want."
    }
  ]
}
```

The `heading` field is intentionally empty for imported Gutenberg data.

The app hides the heading if it is empty.

## Manifest model

The manifest looks conceptually like this:

```json
{
  "title": "Permanent Word",
  "translation": "KJV",
  "source": {
    "provider": "Project Gutenberg",
    "sourceFile": "source/kjv-gutenberg.txt",
    "importedCollection": "Full Bible",
    "importedBooks": ["Genesis", "Exodus", "Leviticus"]
  },
  "chapters": [
    {
      "book": "Psalms",
      "chapter": 23,
      "textPath": "./data/psalms-23.json",
      "hashPath": "./data/psalms-23.sha256.txt",
      "sha256": "..."
    }
  ]
}
```

The actual manifest includes all 1,189 Bible chapters.

## Verification layers

Permanent Word currently uses several verification layers.

### 1. Source file hash

```text
source/kjv-gutenberg.txt
source/kjv-gutenberg.sha256.txt
```

This verifies that the downloaded source file has not changed.

### 2. Imported collection hash

```text
source/full-bible-gutenberg.json
source/full-bible-gutenberg.sha256.txt
```

This verifies the generated full Bible import.

### 3. Chapter hashes

Each generated chapter has a hash file.

Example:

```text
data/psalms-23.json
data/psalms-23.sha256.txt
```

### 4. Manifest chapter hashes

The manifest stores the canonical SHA-256 hash for each chapter.

Example:

```json
{
  "book": "Psalms",
  "chapter": 23,
  "sha256": "..."
}
```

### 5. Manifest hash

The manifest itself is hashed.

```text
data/manifest.json
data/manifest.sha256.txt
```

### 6. Browser verification

The browser computes the currently loaded chapter hash and compares it against the canonical hash.

It also verifies the manifest hash.

### 7. Terminal verification

The terminal script checks generated files through:

```bash
npm run check:data
```

The full verification command is:

```bash
npm run verify
```

## Scripts

### `scripts/download-source.js`

Downloads the configured Project Gutenberg KJV source text and writes the local source file, source hash, and source manifest.

### `scripts/check-source.js`

Checks that the downloaded source file still matches its stored SHA-256 hash.

### `scripts/import-gutenberg-full-bible.js`

Parses the full Bible from the Gutenberg KJV source text.

Expected output:

```text
Books: 66
Chapters: 1,189
Verses: 31,102
```

Generated files:

```text
source/full-bible-gutenberg.json
source/full-bible-gutenberg.sha256.txt
```

### `scripts/import-gutenberg-new-testament.js`

Parses the New Testament from the Gutenberg KJV source text.

This is retained as a smaller import workflow.

Expected output:

```text
Books: 27
Chapters: 260
Verses: 7,957
```

### `scripts/import-gutenberg-gospels.js`

Parses the Four Gospels from the Gutenberg KJV source text.

This is retained as a smaller import workflow.

### `scripts/import-gutenberg-john.js`

Parses the Gospel of John from the Gutenberg KJV source text.

This is retained as the original proof-of-concept import workflow.

### `scripts/build-data.js`

Builds browser-readable chapter files from the imported source JSON.

Generated files include:

```text
data/manifest.json
data/manifest.sha256.txt
data/<book>-<chapter>.json
data/<book>-<chapter>.sha256.txt
```

### `scripts/check-data.js`

Verifies generated reader data.

It checks:

- Manifest hash
- Chapter hash files
- Manifest chapter hashes
- Chapter JSON structure
- Required book/chapter/verse fields

## Application files

### `index.html`

Defines the static reader structure:

- Header
- Verification status pill
- Book selector
- Chapter selector
- Scripture text area
- Verification panel
- Source information panel
- About / Method section
- Mobile navigation

### `styles.css`

Contains all layout and visual styling.

The UI is intentionally minimal and readable.

### `app.js`

Loads the manifest and chapter files, handles navigation, updates URLs, renders verses, and verifies hashes in the browser.

## Why SHA-256?

SHA-256 gives the project a simple and widely understood way to detect changes.

If one character in a chapter changes, the hash changes.

This does not prove that the original source is correct, but it does prove whether the local tracked/generated text has changed from the expected version.

## Why static files?

Static files are easy to:

- Read
- Archive
- Inspect
- Hash
- Copy
- Host
- Distribute

They also make the project a better fit for future decentralized storage.

## Runtime dependency on Project Gutenberg

Project Gutenberg is used as the historical source provider during the build process.

Once the source file, generated import, chapter files, manifest, and hashes are preserved with the project, the running reader does not depend on Project Gutenberg being online.

If this project is later published to IPFS or Arweave, the goal should be to preserve the actual static site and data files, not just a hash.

## Future architecture options

Possible future additions:

- Static deployment test
- IPFS publishing script
- Arweave publishing script
- Manifest containing IPFS CIDs or Arweave transaction IDs
- Optional non-canonical section headings
- Offline bundle
- Signed release hashes
- Optional decentralized hash anchoring

## Current milestone

Permanent Word currently functions as a verified static KJV full Bible reader.

Current expected generated data:

```text
Books: 66
Chapters: 1,189
Verses: 31,102
```