import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

// AES-256-GCM for the clinic's Meta/OpenAI tokens. Server only (.server.ts keeps it out of the browser bundle).
// Format: "<keyVersion>:<iv b64>:<tag b64>:<ciphertext b64>". The clinic id is bound as authenticated data,
// so a value copied to another clinic's row fails to decrypt.

export type Keyring = { current: string; keys: Record<string, Buffer> };

/** ENCRYPTION_KEY_V1, ENCRYPTION_KEY_V2... (each 32 bytes in base64) and ENCRYPTION_KEY_CURRENT=v1. */
export function keyringFromEnv(env: Record<string, string | undefined>): Keyring {
  const keys: Record<string, Buffer> = {};
  for (const [name, value] of Object.entries(env)) {
    const m = /^ENCRYPTION_KEY_(V\d+)$/.exec(name);
    if (m?.[1] && value) keys[m[1].toLowerCase()] = Buffer.from(value, "base64");
  }
  const current = (env["ENCRYPTION_KEY_CURRENT"] ?? "v1").toLowerCase();
  const key = keys[current];
  if (!key || key.length !== 32) throw new Error("Chave de criptografia ausente ou inválida.");
  return { current, keys };
}

export function encryptSecret(plain: string, clinicId: string, ring: Keyring): string {
  const key = ring.keys[ring.current];
  if (!key || key.length !== 32) throw new Error("Chave de criptografia inválida.");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(Buffer.from(clinicId, "utf8"));
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return [ring.current, iv.toString("base64"), cipher.getAuthTag().toString("base64"), data.toString("base64")].join(":");
}

export function decryptSecret(payload: string, clinicId: string, ring: Keyring): string {
  const [version, iv, tag, data] = payload.split(":");
  const key = version ? ring.keys[version] : undefined;
  if (!key || !iv || !tag || !data || key.length !== 32) throw new Error("Segredo ilegível.");
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(iv, "base64"));
  decipher.setAAD(Buffer.from(clinicId, "utf8"));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(data, "base64")), decipher.final()]).toString("utf8");
}

export const needsRotation = (payload: string, ring: Keyring) => payload.split(":")[0] !== ring.current;

/** What the screen may show: never the value itself. */
export const maskSecret = (plain: string) => `••••${plain.slice(-4)}`;
