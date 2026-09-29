# Permanent Word

Permanent Word is a lightweight, static Scripture reader with local text integrity verification.

The current version imports the **full KJV Bible** from a tracked Project Gutenberg source file, generates one JSON file per chapter, verifies the text using SHA-256 hashes, and generates/verifies a release manifest for the entire static app.

No framework.  
No backend.  
No database.  
No build step for the reader.

## Live deployment

The current static deployment is available here:

```text
https://anthonyriggi.github.io/permanent-word/
```

Example deployed chapter URLs:

```text
https://anthonyriggi.github.io/permanent-word/#genesis-1
https://anthonyriggi.github.io/permanent-word/#psalms-23
https://anthonyriggi.github.io/permanent-word/#isaiah-53
https://anthonyriggi.github.io/permanent-word/#matthew-5
https://anthonyriggi.github.io/permanent-word/#romans-8
https://anthonyriggi.github.io/permanent-word/#revelation-21
```

The deployed site is served as static files through GitHub Pages.

## Current status

Permanent Word currently supports:

- KJV full Bible
- Genesis through Revelation
- 66 books
- 1,189 chapters
- 31,102 verses
- Book and chapter selectors
- Stable chapter URLs
- Browser-based SHA-256 verification
- Terminal-based source and data verification
- Static deployment through GitHub Pages
- Release-level manifest generation
- Release-level manifest verification

Example local chapter URLs:

```text
http://localhost:5500/#genesis-1
http://localhost:5500/#psalms-23
http://localhost:5500/#isaiah-53
http://localhost:5500/#matthew-5
http://localhost:5500/#romans-8
http://localhost:5500/#revelation-21
```

## Project goals

The goal of Permanent Word is to preserve and display Scripture text in a simple, transparent, and verifiable way.

The project is intentionally small:

- Static HTML
- Static CSS
- Vanilla JavaScript
- Plain JSON data files
- SHA-256 hashes for integrity checks
- No runtime dependencies
- No server-side application logic

This makes the project easier to archive, inspect, host, and eventually distribute through decentralized storage systems such as IPFS or Arweave.

## How it works

The source pipeline is:

```text
Project Gutenberg KJV source text
→ source/kjv-gutenberg.txt
→ source/full-bible-gutenberg.json
→ data/*.json chapter files
→ data/*.sha256.txt chapter hash files
→ data/manifest.json
→ data/manifest.sha256.txt
→ release-manifest.json
→ release-manifest.sha256.txt
→ static browser reader
```

The reader loads `data/manifest.json`, loads the selected chapter file, computes its SHA-256 hash in the browser, and compares that hash against the canonical hash stored in the manifest.

The terminal verification scripts check the source file, generated chapter data, data manifest, release manifest, and all files listed in the release manifest.

## Getting started

Start the local server:

```bash
npm run start
```

Then open:

```text
http://localhost:5500
```

The local server is needed because the browser fetches local JSON files from the `data/` directory.

## Verify everything

Run:

```bash
npm run verify
```

This command does the full verification workflow:

```text
1. Check the downloaded source file hash
2. Import the full Bible from the source text
3. Generate chapter JSON files
4. Generate chapter SHA-256 files
5. Generate the data manifest
6. Generate the data manifest hash
7. Verify all generated data
8. Generate the release manifest
9. Generate the release manifest hash
10. Verify the release manifest
11. Verify every file listed in the release manifest
```

Expected final result includes:

```text
Imported the full Bible from Gutenberg source.
Books: 66
Chapters: 1189
Verses: 31102
Permanent Word data generated.
Chapters: 1189
✅ All integrity checks passed.
Release manifest generated.
✅ Release manifest check passed.
```

## Useful commands

Download the source text:

```bash
npm run source:download
```

Verify the downloaded source text:

```bash
npm run source:check
```

Import the full Bible:

```bash
npm run source:import:full
```

Build reader data from the full Bible import:

```bash
npm run build:data
```

Verify generated reader data:

```bash
npm run check:data
```

Build the release manifest:

```bash
npm run build:release
```

Verify the release manifest:

```bash
npm run check:release
```

Run the full source-to-release verification:

```bash
npm run verify
```

Start the local reader:

```bash
npm run start
```

## Project structure

```text
.
├── index.html
├── styles.css
├── app.js
├── package.json
├── README.md
├── SOURCE.md
├── ARCHITECTURE.md
├── .nojekyll
├── release-manifest.json
├── release-manifest.sha256.txt
├── data/
│   ├── manifest.json
│   ├── manifest.sha256.txt
│   ├── genesis-1.json
│   ├── genesis-1.sha256.txt
│   └── ...
├── source/
│   ├── kjv-gutenberg.txt
│   ├── kjv-gutenberg.sha256.txt
│   ├── source-manifest.json
│   ├── full-bible-gutenberg.json
│   └── full-bible-gutenberg.sha256.txt
└── scripts/
    ├── download-source.js
    ├── check-source.js
    ├── import-gutenberg-full-bible.js
    ├── import-gutenberg-new-testament.js
    ├── import-gutenberg-gospels.js
    ├── import-gutenberg-john.js
    ├── build-data.js
    ├── check-data.js
    ├── build-release-manifest.js
    └── check-release-manifest.js
```

## Data files

Each chapter is generated as its own JSON file:

```text
data/psalms-23.json
```

Each chapter also has a hash file:

```text
data/psalms-23.sha256.txt
```

The manifest lists every chapter and its canonical SHA-256 hash:

```text
data/manifest.json
```

The manifest itself also has a hash:

```text
data/manifest.sha256.txt
```

## Release manifest

The release manifest records the files included in the current static release.

Generated files:

```text
release-manifest.json
release-manifest.sha256.txt
```

The release manifest lists each included file with:

- File path
- File size in bytes
- SHA-256 hash

This creates a higher-level proof for the whole project release.

The chapter hashes prove individual chapter text files.  
The data manifest proves the chapter collection.  
The release manifest proves the full static app package.

The release manifest can also be checked later:

```bash
npm run check:release
```

This verifies that:

- `release-manifest.json` matches `release-manifest.sha256.txt`
- every listed file still exists
- every listed file still has the expected byte size
- every listed file still has the expected SHA-256 hash

If any listed file changes after the release manifest is generated, `npm run check:release` should fail.

This is useful before publishing to IPFS, Arweave, or any other long-term storage system.

## Static deployment notes

This project can be deployed as a plain static site.

The current GitHub Pages deployment publishes from the repository root. The `.nojekyll` file is included so GitHub Pages serves the project as plain static files without Jekyll processing.

After deployment, test:

```text
/deployed-url/#genesis-1
/deployed-url/#psalms-23
/deployed-url/#isaiah-53
/deployed-url/#john-3
/deployed-url/#revelation-21
/deployed-url/data/manifest.json
/deployed-url/release-manifest.json
```

The browser verification panel should still show that the loaded chapter and manifest are verified.

## Headings

The imported Gutenberg source does not include modern editorial section headings.

Because of that, generated chapter files currently keep this field empty:

```json
"heading": ""
```

The reader hides headings when the field is empty.

This is intentional. Modern headings can be useful, but they are usually editorial metadata rather than the biblical text itself. They may be added later as optional non-canonical metadata.

## Source and copyright notes

The current source workflow uses a Project Gutenberg KJV text file.

The source text is tracked locally and verified with SHA-256. Before publishing or redistributing, confirm the copyright and public-domain status for the jurisdiction and use case where the project will be distributed.

See `SOURCE.md` for more detail.

## Future milestones

Possible next steps:

- Add IPFS / Arweave publishing workflow
- Add decentralized hash anchoring
- Improve source metadata display
- Add optional non-canonical section headings
- Add offline package instructions
- Add signed release hashes