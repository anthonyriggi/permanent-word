# Permanent Word Architecture

Permanent Word is a lightweight, static Scripture reader with local text integrity verification.

The goal is to preserve and display Scripture text in a way that is:

- simple
- readable
- verifiable
- portable
- easy to mirror
- easy to host on decentralized storage
- free of unnecessary dependencies

This project should stay boring on purpose.

## Core idea

The reader is not the source of truth.

The canonical text files are the source of truth.

The app exists to:

1. Load the text.
2. Display the text.
3. Compute a SHA-256 hash of the loaded file.
4. Compare that hash against the canonical hash.
5. Warn the user if the file has changed.

## Current architecture

```text
source/john-sample.json
  ↓
scripts/build-data.js
  ↓
data/manifest.json
data/manifest.sha256.txt
data/john-1.json
data/john-1.sha256.txt
data/john-2.json
data/john-2.sha256.txt
...
  ↓
index.html + styles.css + app.js
  ↓
browser verification