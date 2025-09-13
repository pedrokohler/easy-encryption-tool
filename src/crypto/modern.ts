import { base64ToBytes, bytesToBase64 } from './base64'
import { DecryptError, EncryptedPayloadV1, EncryptOptions } from './types'

const encoder = new TextEncoder()
const decoder = new TextDecoder()

// v1 constants
const PBKDF2_ITERATIONS_V1 = 200_000
const SALT_LENGTH_V1 = 16 // bytes
const IV_LENGTH_GCM = 12 // bytes (recommended for AES-GCM)

async function deriveKeyV1(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey('raw', encoder.encode(passphrase), 'PBKDF2', false, [
    'deriveKey',
  ])
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS_V1,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

export async function encryptV1(plainText: string, passphrase: string, _opts?: EncryptOptions): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH_V1))
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH_GCM))
  const key = await deriveKeyV1(passphrase, salt)
  const cipherBuf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoder.encode(plainText))
  const cipherBytes = new Uint8Array(cipherBuf)
  // Format: v1:<b64 salt>:<b64 iv>:<b64 ciphertext>
  return `v1:${bytesToBase64(salt)}:${bytesToBase64(iv)}:${bytesToBase64(cipherBytes)}`
}

export async function decryptV1(encoded: string, passphrase: string): Promise<string> {
  // Expect exactly 4 parts: v1, salt, iv, cipher
  const parts = encoded.split(':')
  if (parts.length !== 4 || parts[0] !== 'v1') {
    throw new DecryptError('INVALID_FORMAT', 'invalid encrypted message format')
  }
  const [, saltB64, ivB64, dataB64] = parts
  try {
    const salt = base64ToBytes(saltB64)
    const iv = base64ToBytes(ivB64)
    const data = base64ToBytes(dataB64)
    if (iv.length !== IV_LENGTH_GCM) {
      throw new DecryptError('INVALID_IV', 'invalid iv length')
    }
    const key = await deriveKeyV1(passphrase, salt)
    const plainBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data)
    return decoder.decode(plainBuf)
  } catch (e) {
    if (e instanceof DecryptError) throw e
    // Treat all other failures as wrong key/tampered data
    throw new DecryptError('WRONG_KEY', 'unable to decrypt data')
  }
}

