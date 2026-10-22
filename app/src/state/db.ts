// Data model and browser storage.
//
// Local mode keeps everything in localStorage on this computer.
// Google Sheets mode treats the sheet as the source of truth and keeps only a tab-scoped cache in
// sessionStorage, cleared on logout, so personal data does not linger on shared computers.
import { DEFAULT_API_URL } from '../config';
import { scoreAns, type Assessor } from '../domain/sdq';
import { normaliseStudents, type Student } from '../domain/students';

export interface YearData {
  students: Student[];
  updatedAt: string;
}

export interface DB {
  current: string;
  years: Record<string, YearData>;
}

const K = {
  config: 'scs-config-v1',
  localDb: 'scs-db-v2',
  sheetCache: 'scs-sheet-cache-v2',
  auth: 'scs-auth-v1',
};

function read<T>(store: Storage, key: string): T | null {
  try {
    const raw = store.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(store: Storage, key: string, value: unknown): boolean {
  try {
    store.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function remove(store: Storage, key: string) {
  try { store.removeItem(key); } catch { /* storage blocked */ }
}

// — configuration —

interface Config {
  /** null = use the build-time default; '' = local mode chosen explicitly. */
  apiUrl: string | null;
}

export function getApiUrl(): string {
  const c = read<Config>(localStorage, K.config);
  return (c && c.apiUrl !== null && c.apiUrl !== undefined ? c.apiUrl : DEFAULT_API_URL).trim();
}

export function setApiUrl(apiUrl: string) {
  write(localStorage, K.config, { apiUrl: apiUrl.trim() } satisfies Config);
}

// — data —

export function validDb(d: unknown): d is DB {
  const x = d as DB;
  return !!x && typeof x === 'object' && typeof x.current === 'string' && !!x.years && !!x.years[x.current];
}

export function normaliseDb(d: DB): DB {
  const years: Record<string, YearData> = {};
  Object.keys(d.years).forEach((y) => {
    years[y] = { students: normaliseStudents(d.years[y].students), updatedAt: d.years[y].updatedAt || '' };
  });
  return { current: d.current, years };
}

export function loadDb(mode: 'local' | 'sheets'): DB | null {
  const d = mode === 'local' ? read<DB>(localStorage, K.localDb) : read<DB>(sessionStorage, K.sheetCache);
  return validDb(d) ? normaliseDb(d) : null;
}

export function saveDb(mode: 'local' | 'sheets', db: DB): boolean {
  return mode === 'local' ? write(localStorage, K.localDb, db) : write(sessionStorage, K.sheetCache, db);
}

export function clearDb(mode: 'local' | 'sheets') {
  remove(mode === 'local' ? localStorage : sessionStorage, mode === 'local' ? K.localDb : K.sheetCache);
}

export function newDb(year: string, students: Student[]): DB {
  return { current: year, years: { [year]: { students, updatedAt: new Date().toISOString() } } };
}

// — teacher session (tab-scoped) —

export interface TeacherSession {
  username: string;
  mode: 'local' | 'sheets';
  /** Apps Script session token (sheets mode). */
  token?: string;
  lastActive: number;
}

export const loadSession = () => read<TeacherSession>(sessionStorage, K.auth);
export const saveSession = (s: TeacherSession) => write(sessionStorage, K.auth, s);
export const clearSession = () => remove(sessionStorage, K.auth);

// — parent/student responses pulled from the ระบบ_SDQ tab —

/** Merge SDQ rows ([time, year, sid, no, name, role, ans×25, …]) into students; scores are recomputed from answers. */
export function mergeResponses(students: Student[], rows: unknown[][]): { students: Student[]; count: number } {
  const by: Record<string, Partial<Record<Assessor, Student['sdq3']['s']>>> = {};
  let count = 0;
  rows.forEach((r) => {
    const role: Assessor | null = r[5] === 'ตนเอง' ? 's' : r[5] === 'ผู้ปกครอง' ? 'p' : null;
    if (!role) return;
    const ans = r.slice(6, 31).map(Number);
    if (ans.length < 25 || ans.some((x) => isNaN(x) || x < 0 || x > 2)) return;
    const d = new Date(String(r[0]));
    let imp: Record<string, number> | undefined;
    try { imp = r[38] ? JSON.parse(String(r[38])) : undefined; } catch { imp = undefined; }
    const sid = String(r[2]);
    by[sid] = by[sid] || {};
    by[sid][role] = {
      ...scoreAns(ans), ans, imp,
      date: isNaN(d.getTime()) ? '' : d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' }),
    };
    count++;
  });
  return {
    count,
    students: students.map((s) => (by[s.id] ? { ...s, sdq3: { ...s.sdq3, ...by[s.id] } } : s)),
  };
}
