# Permanent Word

A lightweight, static Scripture reader with local text integrity verification.

The goal is to keep this project simple, readable, and self-maintainable:

- no framework
- no backend
- no database
- no build step for the reader
- no dependencies
- static files only

The reader loads Scripture data from JSON files, computes SHA-256 hashes in the browser, and verifies that the loaded text matches the canonical hash.

## Project structure

```text
permanent-word/
  index.html
  styles.css
  app.js
  package.json

  source/
    john-sample.json

  data/
    manifest.json
    manifest.sha256.txt
    john-1.json
    john-1.sha256.txt
    john-2.json
    john-2.sha256.txt
    ...

  scripts/
    build-data.js
    check-data.js