## Easy Encryption Tool

Use the [live version](https://pedrokohler.github.io/easy-encryption-tool/) of this tool to generate an encrypted message and decrypt it later.

This tool runs a AES-128 encryption algorithm in your browser (no servers) and thus secret keys must be exactly 16 bytes long (utf8).

### Development (Vite)

- Install deps: `npm install`
- Start dev server: `npm run dev`

### Build a Single HTML File

- Build: `npm run build`
- Output: `dist/index.html` (JS and CSS inlined via `vite-plugin-singlefile`)
