export type VersionTag = 'v1'

export interface EncryptedPayloadV1 {
  version: VersionTag
  salt: Uint8Array
  iv: Uint8Array
  cipher: Uint8Array
}

export interface EncryptOptions {
  /**
   * PBKDF2 iterations for key derivation (AES‑GCM). Fixed for v1.
   */
  iterations?: number
}

export type DecryptErrorCode =
  | 'INVALID_FORMAT'
  | 'INVALID_IV'
  | 'WRONG_KEY'
  | 'LEGACY_SECRET_LENGTH'

export class DecryptError extends Error {
  code: DecryptErrorCode
  constructor(code: DecryptErrorCode, message?: string) {
    super(message || code)
    this.name = 'DecryptError'
    this.code = code
  }
}

