import { SUBN, SUBS, subG, totG, type Assessor, type Group, type SdqRecord } from './sdq';
import { riskOf, type VisitRecord } from './visit';

export interface HelpRecord {
  date: string;
  areas: string;
  method: string;
  note: string;
  result: string;
  refer: string;
}

export interface Student {
  id: string;
  no: number;
  /** Login codes for the student and the parent portal. */
  sc: string;
  pc: string;
  pre: string;
  fn: string;
  ln: string;
  age: number;
  gpa: string;
  att: string;
  /** Teacher-assessed SDQ, which drives the student's group. */
  sdq: SdqRecord | null;
  sdq3: Partial<Record<Assessor, SdqRecord>>;
  visit: VisitRecord | null;
  helps: HelpRecord[];
}

export type Cat = Group | 'pend';

export const fullName = (s: Student) => `${s.pre}${s.fn} ${s.ln}`.trim();

/** A student's group is the more serious of the teacher SDQ total and the home-visit risk score. */
export function groupOf(s: Student): Group {
  return Math.max(s.sdq ? totG(s.sdq.total) : 0, s.visit ? riskOf(s.visit.v).g : 0) as Group;
}

export function cat(s: Student): Cat {
  const g = groupOf(s);
  return !s.sdq && g === 0 ? 'pend' : g;
}

export function reasons(s: Student): string[] {
  const o: string[] = [];
  if (s.sdq) {
    if (totG(s.sdq.total)) o.push('SDQ ' + s.sdq.total);
    SUBS.forEach((b) => { if (subG(s.sdq![b.k], b.c)) o.push(SUBN[b.k]); });
  }
  if (s.visit) {
    const k = riskOf(s.visit.v);
    if (k.g) o.push('เยี่ยมบ้าน: ' + k.factors.join(', '));
  }
  return o;
}

export function helpStatus(s: Student): string {
  if (!s.helps.length) return groupOf(s) ? 'รอดำเนินการ' : '—';
  const l = s.helps[s.helps.length - 1];
  return l.refer !== 'ไม่ส่งต่อ' ? 'ส่งต่อแล้ว' : `กำลังช่วยเหลือ (${s.helps.length} ครั้ง)`;
}

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Random login code such as S01-AB2C, using the browser's secure RNG. */
export function randomCode(prefix: 'S' | 'P', no: number): string {
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  const tail = Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('');
  return `${prefix}${String(no).padStart(2, '0')}-${tail}`;
}

export function newId(): string {
  const b = new Uint8Array(6);
  crypto.getRandomValues(b);
  return 's' + Array.from(b, (x) => x.toString(36).padStart(2, '0')).join('');
}

export function blankStudent(no: number, pre: string, fn: string, ln: string): Student {
  return {
    id: newId(), no, sc: randomCode('S', no), pc: randomCode('P', no), pre, fn, ln, age: 9,
    gpa: '—', att: '—', sdq: null, sdq3: {}, visit: null, helps: [],
  };
}

/** Parse pasted names (one per line, optionally prefixed ด.ช./ด.ญ./เด็กชาย/เด็กหญิง). */
export function parseNames(txt: string, start: number): Student[] {
  return txt.split(/\n+/).map((x) => x.trim()).filter(Boolean).map((line, i) => {
    let pre = 'ด.ช.';
    let rest = line;
    const m = line.match(/^(ด\.ช\.|ด\.ญ\.|เด็กชาย|เด็กหญิง)\s*/);
    if (m) {
      pre = /ญ|หญิง/.test(m[1]) ? 'ด.ญ.' : 'ด.ช.';
      rest = line.slice(m[0].length);
    }
    const sp = rest.split(/\s+/);
    return blankStudent(start + i, pre, sp[0], sp.slice(1).join(' '));
  });
}

/** Normalise data loaded from storage, a backup file or Google Sheets. */
export function normaliseStudents(list: unknown): Student[] {
  if (!Array.isArray(list)) return [];
  return list.filter((s) => s && typeof s === 'object' && typeof s.id === 'string').map((s, i) => ({
    ...s,
    no: Number(s.no) || i + 1,
    sc: s.sc || randomCode('S', Number(s.no) || i + 1),
    pc: s.pc || randomCode('P', Number(s.no) || i + 1),
    age: Number(s.age) || 9,
    gpa: s.gpa ?? '—',
    att: s.att ?? '—',
    sdq: s.sdq ?? null,
    sdq3: s.sdq3 ?? {},
    visit: s.visit ?? null,
    helps: Array.isArray(s.helps) ? s.helps : [],
  }));
}
