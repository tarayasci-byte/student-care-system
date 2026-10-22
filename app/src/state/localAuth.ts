// Teacher account for local mode: a PBKDF2-SHA256 hash of the password, stored on this computer.
const KEY = 'scs-teacher-v1';
const ITERATIONS = 210_000;

interface LocalAccount {
  username: string;
  salt: string;
  hash: string;
  iterations: number;
}

const b64 = (buf: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function derive(password: string, salt: Uint8Array, iterations: number): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256);
  return b64(bits);
}

function read(): LocalAccount | null {
  try {
    const a = JSON.parse(localStorage.getItem(KEY) || 'null');
    return a && a.username && a.salt && a.hash ? a : null;
  } catch {
    return null;
  }
}

export const normaliseUsername = (u: string) => u.trim().toLowerCase();
export const validUsername = (u: string) => /^[a-z0-9._-]{3,32}$/.test(normaliseUsername(u));
export const MIN_PASSWORD = 8;

export function hasLocalAccount(): boolean {
  return !!read();
}

export function localUsername(): string {
  return read()?.username || '';
}

export async function setLocalAccount(username: string, password: string): Promise<void> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derive(password, salt, ITERATIONS);
  localStorage.setItem(KEY, JSON.stringify({ username: normaliseUsername(username), salt: b64(salt), hash, iterations: ITERATIONS }));
}

export async function verifyLocal(username: string, password: string): Promise<boolean> {
  const a = read();
  if (!a || a.username !== normaliseUsername(username)) return false;
  const hash = await derive(password, unb64(a.salt), a.iterations);
  let d = hash.length ^ a.hash.length;
  for (let i = 0; i < hash.length; i++) d |= hash.charCodeAt(i) ^ (a.hash.charCodeAt(i) || 0);
  return d === 0;
}

export function removeLocalAccount() {
  try { localStorage.removeItem(KEY); } catch { /* storage blocked */ }
}
