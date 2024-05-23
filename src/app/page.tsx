"use client";

import styles from "./page.module.css";
import { ChangeEvent, useState } from "react";
import { randomBytes, createCipheriv, createDecipheriv } from "crypto";
import { Buffer } from "buffer";

export default function Home() {
  const [text, setText] = useState("");
  const [result, setResult] = useState("");
  const [secret, setSecret] = useState("");

  const handleOnMessageChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const value = event.target.value;
    setText(value);
  };

  const handleOnSecretChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSecret(value);
  };

  const isValidSecretLength = () => {
    if (secret.length != 16) {
      window.alert("Secret must be exactly 16 characters long.");
      return false;
    }

    return true;
  };

  const handleEncryption = () => {
    if (!isValidSecretLength()) {
      return;
    }

    const secretBuffer = Buffer.from(secret, "utf8");
    const initializationVector = randomBytes(16);
    const cipher = createCipheriv(
      "aes-128-cbc",
      secretBuffer,
      initializationVector
    );

    const encryptedText = `${initializationVector.toString("base64")}:${(
      cipher.update(text, "utf8", "base64") + cipher.final("base64")
    ).toString()}`;

    setResult(encryptedText);
  };

  const handleDecryption = () => {
    if (!isValidSecretLength()) {
      return;
    }

    try {
      const secretBuffer = Buffer.from(secret, "utf8");
      const [initializationVector, encryptedValue] = text.split(":");
      const decipher = createDecipheriv(
        "aes-128-cbc",
        secretBuffer,
        Buffer.from(initializationVector, "base64")
      );

      const decryptedText = Buffer.concat([
        decipher.update(Buffer.from(encryptedValue, "base64")),
        decipher.final(),
      ]).toString();

      setResult(decryptedText);
    } catch (e: any) {
      if (e.message === "unable to decrypt data") {
        window.alert("Wrong secret");
        return;
      }
      window.alert(e.message);
    }
  };

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <h1>Secret</h1>
        <input
          className={styles.input}
          value={secret}
          onInput={handleOnSecretChange}
        />
        <span>{`Secret length: ${secret.length}`}</span>
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
          <textarea className={styles.textarea} value={result} disabled />
        </div>
      </div>
    </main>
  );
}
