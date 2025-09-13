export type StrengthScore = 0 | 1 | 2 | 3 | 4

export interface StrengthResult {
  score: StrengthScore
  label: string
  entropyBits: number
  suggestions: string[]
}

const LOG2 = Math.log2

function estimateCharsetSize(pw: string): number {
  let size = 0
  if (/[a-z]/.test(pw)) size += 26
  if (/[A-Z]/.test(pw)) size += 26
  if (/[0-9]/.test(pw)) size += 10
  if (/[^A-Za-z0-9]/.test(pw)) size += 33 // rough printable ASCII symbols set
  // Non-ASCII characters (e.g., emoji) are counted above as symbols via the regex.
  // If nothing matched (empty), return 1 to avoid NaN.
  return size || 1
}

function hasRepeatRuns(pw: string): boolean {
  return /(.)\1{2,}/.test(pw)
}

function hasSequentialRun(pw: string): boolean {
  // Detect simple ascending sequences of length >= 3 (e.g., abc, 123)
  if (pw.length < 3) return false
  let run = 1
  for (let i = 1; i < pw.length; i++) {
    if (pw.charCodeAt(i) === pw.charCodeAt(i - 1) + 1) {
      run++
      if (run >= 3) return true
    } else {
      run = 1
    }
  }
  return false
}

function scoreFromEntropy(bits: number): StrengthScore {
  if (bits < 28) return 0
  if (bits < 36) return 1
  if (bits < 60) return 2
  if (bits < 128) return 3
  return 4
}

export function estimateStrength(passphrase: string): StrengthResult {
  const len = passphrase.length
  if (len === 0) {
    return { score: 0, label: 'Empty', entropyBits: 0, suggestions: ['Use a passphrase.'] }
  }

  const charset = estimateCharsetSize(passphrase)
  let bits = len * LOG2(charset)

  const suggestions: string[] = []

  // Simple penalties for patterns
  if (len < 12) {
    bits -= 10
    suggestions.push('Use at least 12–16 characters')
  }
  if (hasRepeatRuns(passphrase)) {
    bits -= 10
    suggestions.push('Avoid repeated characters')
  }
  if (hasSequentialRun(passphrase)) {
    bits -= 10
    suggestions.push('Avoid sequential patterns like abc or 123')
  }
  if (!/[A-Z]/.test(passphrase) || !/[a-z]/.test(passphrase) || !/[0-9]/.test(passphrase)) {
    suggestions.push('Mix upper/lowercase, digits, and symbols')
  }

  // Clamp bits to non-negative
  if (!Number.isFinite(bits) || bits < 0) bits = 0

  const score = scoreFromEntropy(bits)
  const label = ['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'][score]

  return { score, label, entropyBits: bits, suggestions }
}

