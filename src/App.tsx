import React, { ChangeEvent, useState } from 'react'
import styles from './App.module.css'

const encoder = new TextEncoder()
const decoder = new TextDecoder()

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  const len = bytes.byteLength
  for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64)
  const len = binary.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

async function encryptAesCbc(plainText: string, secret: string): Promise<string> {
  const secretBytes = encoder.encode(secret)
  const iv = crypto.getRandomValues(new Uint8Array(16))
  const key = await crypto.subtle.importKey(
    'raw',
    secretBytes,
    { name: 'AES-CBC' },
    false,
    ['encrypt']
  )
  const cipherBuf = await crypto.subtle.encrypt(
    { name: 'AES-CBC', iv },
    key,
    encoder.encode(plainText)
  )
  const cipherBytes = new Uint8Array(cipherBuf)
  return `${bytesToBase64(iv)}:${bytesToBase64(cipherBytes)}`
}

async function decryptAesCbc(encoded: string, secret: string): Promise<string> {
  const parts = encoded.split(':')
  if (parts.length !== 2) {
    throw new Error('invalid encrypted message format')
  }
  const [ivB64, dataB64] = parts
  const iv = base64ToBytes(ivB64)
  if (iv.length !== 16) {
    throw new Error('invalid iv length')
  }

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'AES-CBC' },
    false,
    ['decrypt']
  )
  try {
    const plainBuf = await crypto.subtle.decrypt(
      { name: 'AES-CBC', iv },
      key,
      base64ToBytes(dataB64)
    )
    return decoder.decode(plainBuf)
  } catch {
    throw new Error('unable to decrypt data')
  }
}

export default function App() {
  const [text, setText] = useState('')
  const [result, setResult] = useState('')
  const [secret, setSecret] = useState('')
  const [secretByteLength, setSecretByteLength] = useState(0)

  const handleOnMessageChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const value = event.target.value
    setText(value)
  }

  const handleOnSecretChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    const secretBytes = encoder.encode(value)
    setSecretByteLength(secretBytes.length)
    setSecret(value)
  }

  const isValidSecretLength = () => {
    if (secretByteLength !== 16) {
      window.alert(
        'Secret must be exactly 16 bytes long.\nTip: typically one character = 1 byte, but there are exceptions.'
      )
      return false
    }
    return true
  }

  const handleEncryption = async () => {
    if (!isValidSecretLength()) return
    const encryptedText = await encryptAesCbc(text, secret)
    setResult(encryptedText)
  }

  const handleDecryption = async () => {
    if (!isValidSecretLength()) return
    try {
      const decryptedText = await decryptAesCbc(text, secret)
      setResult(decryptedText)
    } catch (e: any) {
      switch (true) {
        case e.message === 'unable to decrypt data': {
          window.alert('Wrong secret')
          return
        }
        case /invalid iv length|invalid encrypted message format/.test(e.message): {
          window.alert('Invalid encrypted message format')
          return
        }
        default:
          window.alert(e.message)
      }
    }
  }

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <h1>Secret</h1>
        <input className={styles.input} value={secret} onChange={handleOnSecretChange} />
        <span>{`Byte length: ${secretByteLength}`}</span>
      </div>
      <div className={styles.splitContainer}>
        <div className={styles.splitContainerContent}>
          <h1>Message</h1>
          <textarea className={styles.textarea} value={text} onChange={handleOnMessageChange} />
          <div>
            <button className={styles.button} onClick={handleEncryption}>
              Encrypt
            </button>
            <button className={styles.button} onClick={handleDecryption}>
              Decrypt
            </button>
          </div>
        </div>
        <div className={styles.splitContainerContent}>
          <h1>Result</h1>
          <textarea className={styles.textarea} value={result} readOnly />
        </div>
      </div>
    </main>
  )
}

