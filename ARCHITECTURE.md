# Architecture

Permanent Word is a static Scripture reader with local integrity verification.

It uses:

- Static HTML
- Static CSS
- Vanilla JavaScript
- Plain JSON data
- SHA-256 hashes
- No frontend framework
- No backend
- No database
- No runtime package dependencies

## Core idea

The project preserves Scripture text as plain files and verifies those files locally.

The reader can run from:

- GitHub Pages
- local static server
- IPFS gateway
- Arweave gateway

## Normal repo mode

The normal repo uses one JSON file per chapter.

Example:

```text
data/psalms-23.json
data/psalms-23.sha256.txt
```

The reader loads:

```text
data/manifest.json
data/manifest.sha256.txt
```

Then it loads the selected chapter file and verifies its SHA-256 hash.

## Compact publish mode

The compact publish folder is generated in:

```text
dist/permanent-word-vX.Y.Z-site/
```

It uses:

```text
data/bible.json
data/bible.sha256.txt
```

This reduces the file count for browser-based IPFS/Arweave upload.

The manifest marks compact mode with:

```text
publishFormat: compact-bundle
bundlePath: ./data/bible.json
bundleHashPath: ./data/bible.sha256.txt
```

## Runtime flow

```text
1. Show loading state
2. Load data/manifest.json
3. Load data/manifest.sha256.txt
4. Verify manifest hash
5. If compact mode, load data/bible.json
6. If compact mode, verify data/bible.sha256.txt
7. Read URL hash
8. Load selected chapter
9. Hash selected chapter
10. Compare against canonical chapter hash
11. Render Scripture
12. Show verification status
```

## Loading state

Compact decentralized gateways can take a few seconds on first load.

The reader shows a lightweight loading card while the manifest and Bible bundle are loading.

This avoids blank selectors, empty metadata, or partially initialized reader content.

## Hash URLs

The app uses hash routing.

Examples:

```text
/#genesis-1
/#psalms-23
/#john-3
/#1-corinthians-5
/#revelation-21
```

Hash routing avoids server routing requirements.

## Chapter data model

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

## Manifest model

```json
{
  "title": "Permanent Word",
  "translation": "KJV",
  "source": {
    "provider": "Project Gutenberg",
    "sourceFile": "source/kjv-gutenberg.txt",
    "importedCollection": "Full Bible"
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

## Compact bundle model

```json
{
  "project": "Permanent Word",
  "bundleFormatVersion": 1,
  "hashAlgorithm": "SHA-256",
  "title": "Permanent Word",
  "translation": "KJV",
  "chapterCount": 1189,
  "sourceManifestHash": "...",
  "chaptersByPath": {
    "./data/genesis-1.json": "{...chapter JSON as text...}"
  }
}
```

Each chapter is stored as raw JSON text so the browser can hash the exact content.

## Release manifest

```text
release-manifest.json
release-manifest.sha256.txt
```

The release manifest lists project files with:

- path
- byte size
- SHA-256 hash

It excludes:

```text
.git/
node_modules/
dist/
release-manifest.json
release-manifest.sha256.txt
```

## Verification layers

1. Source file hash
2. Imported full Bible hash
3. Chapter hash files
4. Manifest chapter hashes
5. Manifest hash
6. Compact Bible bundle hash
7. Browser chapter verification
8. Terminal data verification
9. Release manifest hash
10. ZIP bundle hash

## Scripts

```text
scripts/download-source.js
scripts/check-source.js
scripts/import-gutenberg-full-bible.js
scripts/import-gutenberg-new-testament.js
scripts/import-gutenberg-gospels.js
scripts/import-gutenberg-john.js
scripts/build-data.js
scripts/check-data.js
scripts/build-release-manifest.js
scripts/check-release-manifest.js
scripts/build-release-bundle.js
scripts/check-release-bundle.js
scripts/build-publish-folder.js
```

## Main app files

```text
index.html
styles.css
app.js
```

## Current milestone

Permanent Word currently supports:

```text
Books: 66
Chapters: 1,189
Verses: 31,102
```

It also supports compact publishing for IPFS and Arweave.