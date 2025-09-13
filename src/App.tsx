import React, { ChangeEvent, useState } from "react";
import styles from "./App.module.css";
import { encrypt as encryptModern, decrypt as decryptAny } from "./crypto";
import type { DecryptError } from "./crypto/types";

export default function App() {
  const [text, setText] = useState("");
  const [result, setResult] = useState("");
  const [secret, setSecret] = useState("");
  const [secretByteLength, setSecretByteLength] = useState(0);

  const handleOnMessageChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const value = event.target.value;
    setText(value);
  };

  const handleOnSecretChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    const secretBytes = new TextEncoder().encode(value);
    setSecretByteLength(secretBytes.length);
    setSecret(value);
  };

  const handleEncryption = async () => {
    setResult("");
    const encryptedText = await encryptModern(text, secret);
    setResult(encryptedText);
  };

  const handleDecryption = async () => {
    setResult("");
    try {
      const decryptedText = await decryptAny(text, secret);
      setResult(decryptedText);
    } catch (e: any) {
      const err = e as DecryptError | Error;
      // Maintain previous UX messages
      if ((err as any)?.code === "LEGACY_SECRET_LENGTH") {
        window.alert("Legacy encrypted messages require a 16-byte secret");
        return;
      }
      switch (true) {
        case err.message === "unable to decrypt data": {
          window.alert("Wrong secret");
          return;
        }
        case /invalid iv length|invalid encrypted message format/.test(
          err.message
        ): {
          window.alert("Invalid encrypted message format");
          return;
        }
        default:
          window.alert(err.message);
      }
    }
  };

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <h1>Secret</h1>
        <input
          className={styles.input}
          value={secret}
          onChange={handleOnSecretChange}
        />
        <span>{`Byte length: ${secretByteLength}`}</span>
        <span>
          New messages use AES-GCM with PBKDF2. Legacy AES-CBC messages still
          decrypt here (require a 16-byte secret).
        </span>
      </div>
      <div className={styles.splitContainer}>
        <div className={styles.splitContainerContent}>
          <h1>Message</h1>
          <textarea
            className={styles.textarea}
            value={text}
            onChange={handleOnMessageChange}
          />
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
  );
}
