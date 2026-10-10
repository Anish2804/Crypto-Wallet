// Simple Web Crypto API wrappers for secure encryption/decryption

function buf2b64(buf: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buf);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function b642buf(b64: string): ArrayBuffer {
  const binary_string = atob(b64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}

export async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as any,
      iterations: 210000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptData(data: string, password: string): Promise<{ encrypted: string, iv: string, salt: string }> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const key = await deriveKey(password, salt);
  const enc = new TextEncoder();
  
  const encryptedBuf = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc.encode(data)
  );

  return {
    encrypted: buf2b64(encryptedBuf),
    iv: buf2b64(iv.buffer),
    salt: buf2b64(salt.buffer)
  };
}

export async function decryptData(encryptedBase64: string, ivBase64: string, saltBase64: string, password: string): Promise<string> {
  const encrypted = b642buf(encryptedBase64);
  const iv = new Uint8Array(b642buf(ivBase64));
  const salt = new Uint8Array(b642buf(saltBase64));

  const key = await deriveKey(password, salt);

  const decryptedBuf = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    encrypted
  );

  const dec = new TextDecoder();
  return dec.decode(decryptedBuf);
}
