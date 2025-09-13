import { base64ToBytes } from './base64'
import { DecryptError } from './types'

const encoder = new TextEncoder()
const decoder = new TextDecoder()

/**
 * Decrypts legacy AES-CBC payloads in format: <b64 IV>:<b64 ciphertext>
 * Requires that the provided secret (passphrase) encodes to exactly 16 bytes (AES-128 key).
 */
export async function decryptLegacyAesCbc(encoded: string, secret: string): Promise<string> {
  const parts = encoded.split(':')
  if (parts.length !== 2) {
    throw new DecryptError('INVALID_FORMAT', 'invalid encrypted message format')
  }
  const [ivB64, dataB64] = parts
  const iv = safeBase64ToBytes(ivB64)
  if (iv.length !== 16) {
    throw new DecryptError('INVALID_IV', 'invalid iv length')
  }
  const data = safeBase64ToBytes(dataB64)
  const secretBytes = encoder.encode(secret)
  if (secretBytes.length !== 16) {
    throw new DecryptError('LEGACY_SECRET_LENGTH', 'Legacy AES-CBC requires a 16-byte secret')
  }
  try {
    const key = await crypto.subtle.importKey('raw', secretBytes, { name: 'AES-CBC' }, false, ['decrypt'])
    const plainBuf = await crypto.subtle.decrypt({ name: 'AES-CBC', iv }, key, data)
    return decoder.decode(plainBuf)
  } catch {
    // Wrong legacy key or padding modified
    throw new DecryptError('WRONG_KEY', 'unable to decrypt data')
  }
}

function safeBase64ToBytes(b64: string): Uint8Array {
  try {
    return base64ToBytes(b64)
  } catch {
    // Normalize parsing errors to INVALID_FORMAT for UI handling
    throw new DecryptError('INVALID_FORMAT', 'invalid encrypted message format')
  }
}

