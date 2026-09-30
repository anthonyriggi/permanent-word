# Permanent Word Release

Permanent Word is a static, verifiable KJV Bible reader.

## Release version

```text
v0.1.1
```

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
Arweave Manifest/Data TX ID: Vqe4gs1mpfPMydBXp4b8kgvj1heyrQuaqcL2pch1DbI
Arweave URL: https://arweave.permanentword.org/
ArDrive/Turbo URL: https://k2t3rawnm2s7htgj2bl2pbx4sif6hvqxwkwqxgvjyl3klsdvbwza.turbo-gateway.com/Vqe4gs1mpfPMydBXp4b8kgvj1heyrQuaqcL2pch1DbI/
```

### IPFS / Pinata

```text
IPFS CID: bafybeifj6dfs6vjjj2xbl6pf2rc2e7e2o5dutukqtmy5kkgmgxghm7op6a
IPFS URL: Pending custom gateway/domain
```

## Release scope

```text
Collection: Full Bible
Translation: KJV
Books: 66
Chapters: 1,189
Verses: 31,102
Source provider: Project Gutenberg
Source file: source/kjv-gutenberg.txt
```

## Release summary

```text
Verified KJV full Bible reader
Browser SHA-256 chapter verification
Source manifest verification
Release manifest verification
ZIP archive bundle
Compact IPFS/Arweave publish folder
Clean compact-bundle loading state
Custom domain for main GitHub Pages deployment
Arweave redirect domain
IPFS CID recorded
```

## Verification

Verified through:

```text
source/kjv-gutenberg.sha256.txt
source/full-bible-gutenberg.sha256.txt
data/manifest.sha256.txt
data/*.sha256.txt
release-manifest.sha256.txt
dist/permanent-word-v0.1.1.zip.sha256.txt
```

Full verification:

```bash
npm run verify
```

Expected result:

```text
✅ All integrity checks passed.
✅ Release manifest check passed.
```

## Build release artifacts

```bash
npm run build:publish
```

Generated artifacts:

```text
dist/permanent-word-v0.1.1.zip
dist/permanent-word-v0.1.1.zip.sha256.txt
dist/permanent-word-v0.1.1-site/
```

## Archive bundle

```text
dist/permanent-word-v0.1.1.zip
dist/permanent-word-v0.1.1.zip.sha256.txt
```

Check:

```bash
npm run check:bundle
```

## Compact publish folder

```text
dist/permanent-word-v0.1.1-site/
```

This folder is intended for IPFS and Arweave uploads.

It contains:

```text
data/bible.json
data/bible.sha256.txt
```

## Loading state

This release includes a cleaner loading state for compact decentralized deployments.

The loading state appears while the compact Bible bundle is loading and verifying.

## Release manifest

```text
release-manifest.json
release-manifest.sha256.txt
```

View release hash:

```bash
cat release-manifest.sha256.txt
```

Check release manifest:

```bash
npm run check:release
```

## Useful deployed checks

```text
https://permanentword.org/
https://permanentword.org/#genesis-1
https://permanentword.org/#psalms-23
https://permanentword.org/#john-3
https://permanentword.org/#1-corinthians-5
https://permanentword.org/#revelation-21
https://permanentword.org/data/manifest.json
https://arweave.permanentword.org/
```

## Future release note

If IPFS CIDs or Arweave transaction IDs are added back into the project files, the content changes and a new release artifact should be generated.