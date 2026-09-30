# Permanent Word Release

Permanent Word is a static, verifiable KJV Bible reader.

## Release version

```text
v0.1.1
```

## Live deployments

### GitHub Pages

```text
https://anthonyriggi.github.io/permanent-word/
```

### IPFS / Pinata

```text
IPFS CID: TODO: ADD_NEW_PINATA_CID_HERE
IPFS URL: TODO: ADD_NEW_PINATA_GATEWAY_URL_HERE
```

### Arweave / ArDrive

```text
Arweave Manifest/Data TX ID: Vqe4gs1mpfPMydBXp4b8kgvj1heyrQuaqcL2pch1DbI
Arweave URL: https://k2t3rawnm2s7htgj2bl2pbx4sif6hvqxwkwqxgvjyl3klsdvbwza.turbo-gateway.com/Vqe4gs1mpfPMydBXp4b8kgvj1heyrQuaqcL2pch1DbI/
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
/
#genesis-1
#psalms-23
#john-3
#1-corinthians-5
#revelation-21
/data/manifest.json
/data/bible.json
/release-manifest.json
```

## Future release note

If IPFS CIDs or Arweave transaction IDs are added back into the project files, the content changes and a new release artifact should be generated.