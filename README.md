# Permanent Word Starter

A very small, static, no-framework Scripture reader/verifier.

## Files

- `index.html` — page structure
- `styles.css` — responsive reader styling
- `app.js` — starter chapter data, navigation, SHA-256 verification

## How to run

Open `index.html` in a browser for the basic reader.

For the hash verification, use a local server if your browser blocks Web Crypto on local files:

```bash
cd permanent-word-starter
python3 -m http.server 5500
```

Then open:

```text
http://localhost:5500
```

## How to make the text canonical

1. Open the page.
2. Copy the generated `Current SHA-256` value.
3. Paste it into `CANONICAL_HASH` in `app.js`.
4. Refresh the page.
5. Change one word in the chapter text and refresh again. Verification should fail.

## Philosophy

No framework. No backend. No database. No build step. The whole folder can be uploaded to IPFS or Arweave later.
