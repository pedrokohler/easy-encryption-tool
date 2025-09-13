import { decryptV1, encryptV1 } from './modern'
import { decryptLegacyAesCbc } from './legacy'
import { DecryptError } from './types'

export async function encrypt(plainText: string, passphrase: string): Promise<string> {
  // Always use v1 (AES-GCM + PBKDF2)
  return encryptV1(plainText, passphrase)
}

export async function decrypt(encoded: string, passphrase: string): Promise<string> {
  const trimmed = encoded.trim()
  if (trimmed.startsWith('v1:')) {
    return decryptV1(trimmed, passphrase)
  }
  // Fallback to legacy AES-CBC format (<iv>:<cipher>)
  try {
    return await decryptLegacyAesCbc(trimmed, passphrase)
  } catch (e) {
    if (e instanceof DecryptError) throw e
    // Normalize any unexpected errors
    throw new DecryptError('WRONG_KEY', 'unable to decrypt data')
  }
}

