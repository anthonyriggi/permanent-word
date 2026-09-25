# Source

Permanent Word currently uses a Project Gutenberg KJV source text as the basis for the generated New Testament reader data.

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

The New Testament import is generated here:

```text
source/new-testament-gutenberg.json
```

The New Testament import hash is stored here:

```text
source/new-testament-gutenberg.sha256.txt
```

## Source pipeline

```text
Project Gutenberg KJV text
→ source/kjv-gutenberg.txt
→ source/kjv-gutenberg.sha256.txt
→ source/new-testament-gutenberg.json
→ source/new-testament-gutenberg.sha256.txt
→ data/*.json
→ data/*.sha256.txt
→ data/manifest.json
→ data/manifest.sha256.txt
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

## Importing the New Testament

Run:

```bash
npm run source:import:nt
```

This reads:

```text
source/kjv-gutenberg.txt
```

and generates:

```text
source/new-testament-gutenberg.json
source/new-testament-gutenberg.sha256.txt
```

The importer currently expects:

```text
Books: 27
Chapters: 260
Verses: 7,957
```

The imported collection is:

```text
Matthew through Revelation
```

## Building reader data

Run:

```bash
npm run build:data
```

This reads:

```text
source/new-testament-gutenberg.json
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
data/romans-8.json
data/romans-8.sha256.txt
```

## Manifest

The generated manifest is:

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

## Full verification

Run:

```bash
npm run verify
```

This performs the full source-to-reader workflow:

```text
1. Verify source/kjv-gutenberg.txt
2. Import the New Testament
3. Build chapter data
4. Verify generated data
```

Expected final result:

```text
✅ All integrity checks passed.
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

## Headings

Modern section headings are not currently imported.

Generated chapter files currently contain:

```json
"heading": ""
```

This field remains available so optional headings could be added later, but they should be treated as non-canonical metadata unless a specific source and verification process is added for them.

## Copyright and public-domain note

The current workflow uses Project Gutenberg as the KJV source provider.

Before publishing or redistributing the project, confirm that the source text and any generated data may be used in the intended jurisdiction and context.

This project tracks the source file and hashes so that the exact text can be inspected and reproduced.