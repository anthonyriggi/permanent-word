# Permanent Word

Permanent Word is a lightweight, static KJV Bible reader with local text integrity verification.

No framework.  
No backend.  
No database.  
No runtime dependencies.

## Live deployments

### Main site

```text
https://permanentword.org/
```

### GitHub Pages source deployment

```text
https://anthonyriggi.github.io/permanent-word/
```

### Arweave / ArDrive

```text
Arweave Manifest/Data TX ID: wF9cU_CA33N0-UXoiDfnc6DvUy-W2S5nZMNJWlTbqn8
Arweave URL: https://arweave.permanentword.org/
ArDrive/Turbo URL: https://k2t3rawnm2s7htgj2bl2pbx4sif6hvqxwkwqxgvjyl3klsdvbwza.turbo-gateway.com/wF9cU_CA33N0-UXoiDfnc6DvUy-W2S5nZMNJWlTbqn8/
```

### IPFS / Pinata

```text
IPFS CID: bafybeifj6dfs6vjjj2xbl6pf2rc2e7e2o5dutukqtmy5kkgmgxghm7op6a
IPFS URL: Pending custom gateway/domain
```

## Current status

- KJV full Bible
- 66 books
- 1,189 chapters
- 31,102 verses
- Stable hash URLs
- Browser SHA-256 verification
- Source/data/release verification scripts
- ZIP archive bundle
- Compact IPFS/Arweave publish folder
- Clean loading state for decentralized gateways
- Custom domain for main deployment
- Arweave redirect domain
- IPFS CID recorded

## Example URLs

### Main site

```text
https://permanentword.org/#genesis-1
https://permanentword.org/#psalms-23
https://permanentword.org/#john-3
https://permanentword.org/#1-corinthians-5
https://permanentword.org/#revelation-21
```

### Arweave

```text
https://arweave.permanentword.org/
```

### GitHub Pages

```text
https://anthonyriggi.github.io/permanent-word/#genesis-1
https://anthonyriggi.github.io/permanent-word/#psalms-23
https://anthonyriggi.github.io/permanent-word/#john-3
https://anthonyriggi.github.io/permanent-word/#1-corinthians-5
https://anthonyriggi.github.io/permanent-word/#revelation-21
```

## Normal data flow

```text
Project Gutenberg KJV source
→ source/kjv-gutenberg.txt
→ source/full-bible-gutenberg.json
→ data/*.json
→ data/*.sha256.txt
→ data/manifest.json
→ data/manifest.sha256.txt
→ release-manifest.json
→ release-manifest.sha256.txt
```

## Compact publish flow

```text
verified source/data
→ data/bible.json
→ data/bible.sha256.txt
→ compact data/manifest.json
→ dist/permanent-word-vX.Y.Z-site/
```

The normal repo keeps one JSON file per chapter.

The compact publish folder bundles the chapter data so browser-based IPFS/Arweave uploads stay small and reliable.

## Commands

Start local server:

```bash
npm run start
```

Verify source/data/release:

```bash
npm run verify
```

Build archive bundle:

```bash
npm run build:bundle
```

Build compact site folder:

```bash
npm run build:site
```

Build all publish artifacts:

```bash
npm run build:publish
```

Check generated data:

```bash
npm run check:data
```

Check release manifest:

```bash
npm run check:release
```

Check ZIP bundle:

```bash
npm run check:bundle
```

## Publish artifacts

Generated in `dist/`:

```text
dist/permanent-word-vX.Y.Z.zip
dist/permanent-word-vX.Y.Z.zip.sha256.txt
dist/permanent-word-vX.Y.Z-site/
```

Use the `site` folder for IPFS/Arweave uploads.

Use the ZIP as the archive bundle.

## Project structure

```text
.
├── index.html
├── styles.css
├── app.js
├── package.json
├── package-lock.json
├── README.md
├── SOURCE.md
├── ARCHITECTURE.md
├── RELEASE.md
├── .gitignore
├── .nojekyll
├── data/
├── source/
├── scripts/
└── dist/
```

## Verification

The browser verifies:

- `data/manifest.json`
- `data/manifest.sha256.txt`
- current chapter SHA-256
- compact Bible bundle in publish mode

The terminal scripts verify:

- source file hash
- generated data
- release manifest
- ZIP bundle

## Notes

The imported Gutenberg source does not include modern editorial headings.

Generated chapter files currently use:

```json
"heading": ""
```

Headings may be added later as optional non-canonical metadata.