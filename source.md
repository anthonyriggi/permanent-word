# Source

Permanent Word currently uses a Project Gutenberg KJV source text as the basis for the generated full Bible reader data.

The source workflow is designed to make the text traceable and reproducible.

## Current source

The current source text is stored here:

```text
source/kjv-gutenberg.txt
```

Its SHA-256 hash is stored here:

```text
source/kjv-gutenberg.sha256.txt
```

Source metadata is stored here:

```text
source/source-manifest.json
```

The full Bible import is generated here:

```text
source/full-bible-gutenberg.json
```

The full Bible import hash is stored here:

```text
source/full-bible-gutenberg.sha256.txt
```

## Source pipeline

```text
Project Gutenberg KJV text
→ source/kjv-gutenberg.txt
→ source/kjv-gutenberg.sha256.txt
→ source/full-bible-gutenberg.json
→ source/full-bible-gutenberg.sha256.txt
→ data/*.json
→ data/*.sha256.txt
→ data/manifest.json
→ data/manifest.sha256.txt
→ release-manifest.json
→ release-manifest.sha256.txt
```

## Downloading the source

Run:

```bash
npm run source:download
```

This downloads the configured Project Gutenberg KJV source text and writes:

```text
source/kjv-gutenberg.txt
source/kjv-gutenberg.sha256.txt
source/source-manifest.json
```

The exact download source is defined in:

```text
scripts/download-source.js
```

## Checking the source

Run:

```bash
npm run source:check
```

This verifies that:

```text
source/kjv-gutenberg.txt
```

still matches:

```text
source/kjv-gutenberg.sha256.txt
```

If the source text changes, the hash check should fail.

## Importing the full Bible

Run:

```bash
npm run source:import:full
```

This reads:

```text
source/kjv-gutenberg.txt
```

and generates:

```text
source/full-bible-gutenberg.json
source/full-bible-gutenberg.sha256.txt
```

The importer currently expects:

```text
Books: 66
Chapters: 1,189
Verses: 31,102
```

The imported collection is:

```text
Genesis through Revelation
```

## Building reader data

Run:

```bash
npm run build:data
```

This reads:

```text
source/full-bible-gutenberg.json
```

and generates the browser-readable files in:

```text
data/
```

Each chapter gets:

```text
data/<book>-<chapter>.json
data/<book>-<chapter>.sha256.txt
```

Example:

```text
data/psalms-23.json
data/psalms-23.sha256.txt
```

## Manifest

The generated data manifest is:

```text
data/manifest.json
```

The manifest contains:

- Project title
- Translation
- Source metadata
- List of generated chapters
- Path to each chapter file
- Path to each chapter hash file
- SHA-256 hash for each chapter

The manifest hash is stored here:

```text
data/manifest.sha256.txt
```

## Release manifest

The generated release manifest is:

```text
release-manifest.json
```

Its SHA-256 hash is stored here:

```text
release-manifest.sha256.txt
```

The release manifest records the current static project package by listing each included file with:

- File path
- File size in bytes
- SHA-256 hash

This release-level manifest is intended to support future IPFS, Arweave, signed release, or blockchain anchoring workflows.

The release manifest excludes:

```text
.git/
node_modules/
release-manifest.json
release-manifest.sha256.txt
```

The release manifest excludes itself and its own hash so that it can be generated deterministically from the rest of the project files.

## Checking the release manifest

Run:

```bash
npm run check:release
```

This verifies that:

```text
release-manifest.json
```

matches:

```text
release-manifest.sha256.txt
```

It also checks every file listed in the release manifest.

For every listed file, it verifies:

- The file still exists
- The byte count still matches
- The SHA-256 hash still matches

If any listed file changes after the release manifest is generated, the release manifest check should fail.

## Full verification

Run:

```bash
npm run verify
```

This performs the full source-to-release workflow:

```text
1. Verify source/kjv-gutenberg.txt
2. Import the full Bible
3. Build chapter data
4. Verify generated data
5. Build the release manifest
6. Verify the release manifest
```

Expected final result includes:

```text
✅ All integrity checks passed.
Release manifest generated.
✅ Release manifest check passed.
```

## What is treated as canonical?

For this project, the canonical generated text is the Scripture text imported from the tracked source file.

The following are treated as application metadata:

- Book names
- Chapter numbers
- File paths
- URL slugs
- Empty heading fields
- Source information display
- Verification UI copy
- Release manifest summary fields

## Headings

Modern section headings are not currently imported.

Generated chapter files currently contain:

```json
"heading": ""
```

This field remains available so optional headings could be added later, but they should be treated as non-canonical metadata unless a specific source and verification process is added for them.

## Runtime dependency note

Project Gutenberg is used as the historical source provider during the build process.

The reader itself does not need Project Gutenberg to stay online after the source and generated data files have been preserved.

The important preserved files are:

```text
source/kjv-gutenberg.txt
source/kjv-gutenberg.sha256.txt
source/full-bible-gutenberg.json
source/full-bible-gutenberg.sha256.txt
data/*.json
data/*.sha256.txt
data/manifest.json
data/manifest.sha256.txt
release-manifest.json
release-manifest.sha256.txt
```

## Copyright and public-domain note

The current workflow uses Project Gutenberg as the KJV source provider.

Before publishing or redistributing the project, confirm that the source text and any generated data may be used in the intended jurisdiction and context.

This project tracks the source file and hashes so that the exact text can be inspected and reproduced.