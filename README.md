## Easy Encryption Tool

Use the [live version](https://pedrokohler.github.io/easy-encryption-tool/) of this tool to generate an encrypted message and decrypt it later.

All encryption runs entirely in your browser (no servers, no network), so you can also save the built HTML file and use it fully offline.

### What’s New

- Default encryption now uses AES-GCM with PBKDF2 key derivation from your passphrase (no fixed length required).
- Ciphertext format is versioned as `v1:<b64 salt>:<b64 iv>:<b64 ciphertext>`.
- Backwards compatible decryption: legacy AES-CBC messages still decrypt seamlessly.
- Password strength meter: see real-time feedback while typing your secret.

### Legacy Compatibility

- Old messages encrypted by earlier versions used AES-128-CBC and required a 16-byte secret. They were formatted as `<b64 IV>:<b64 ciphertext>`.
- This app still decrypts those messages. When decrypting a legacy message, make sure your secret encodes to exactly 16 bytes (UTF‑8). The UI shows the byte count beneath the input.

### Offline Use

- Build once, then open `dist/index.html` directly in your browser without any network. You can save or share that single file and it will work offline.

### Development (Vite)

- Install deps: `npm install`
- Start dev server: `npm run dev`

### Build a Single HTML File

- Build: `npm run build`
- Output: `dist/index.html` (JS and CSS inlined via `vite-plugin-singlefile`)

### Notes on Security

- AES-GCM provides authenticated encryption (confidentiality + integrity). PBKDF2 derives a strong key from your passphrase using a random salt and many iterations.
- Passphrases with higher entropy are stronger. Avoid short or common phrases.
- The tool never sends your data anywhere; everything happens locally in the browser.
