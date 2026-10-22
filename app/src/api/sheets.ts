// Client for the Google Apps Script web app in apps-script/Code.gs.
// Every call is a POST with a text/plain body, which Apps Script accepts without a CORS preflight.
import type { Student } from '../domain/students';
import type { YearData } from '../state/db';

export type ApiErrorCode =
  | 'offline' | 'network' | 'bad_response' | 'unreadable' | 'not_found' | 'busy' | 'outdated' | 'session' | 'password'
  | 'locked' | 'exists' | 'setup_code' | 'setup_default' | 'username' | 'weak_password' | 'code' | 'bad_request'
  | 'server' | 'action';

export class ApiError extends Error {
  /** `detail` carries the script's own error text for 'server' errors. */
  constructor(public code: ApiErrorCode, public detail = '') {
    super(detail ? `${code}: ${detail}` : code);
  }
}

const CHECK_LOG = 'ดูสาเหตุได้ที่ Apps Script › การดำเนินการ (Executions)';

export const API_MESSAGES: Record<ApiErrorCode, string> = {
  offline: 'อุปกรณ์นี้ไม่ได้เชื่อมต่ออินเทอร์เน็ต กรุณาเชื่อมต่อแล้วลองอีกครั้ง',
  network: 'ติดต่อ Google Sheets ไม่ได้ อาจเป็นเพราะอินเทอร์เน็ตไม่เสถียร กรุณาลองอีกครั้ง',
  bad_response: 'URL นี้ไม่ใช่เว็บแอปของระบบ ตรวจสอบว่าคัดลอก URL จาก การทำให้ใช้งานได้ › เว็บแอป ที่ลงท้ายด้วย /exec',
  unreadable: 'Google Sheets ตอบกลับไม่ถูกต้อง อาจเป็นข้อผิดพลาดชั่วคราวของ Google กรุณาลองอีกครั้ง หากยังไม่ได้ ' + CHECK_LOG,
  not_found: 'ไม่พบเว็บแอปนี้ การทำให้ใช้งานได้อาจถูกลบหรือ URL เปลี่ยน ตรวจสอบ URL ใน Apps Script › จัดการการทำให้ใช้งานได้',
  busy: 'Google Sheets มีผู้ใช้งานมากหรือขัดข้องชั่วคราว กรุณารอสักครู่แล้วลองอีกครั้ง',
  outdated: 'สคริปต์ใน Google Sheets เป็นเวอร์ชันเก่า กรุณาวางโค้ดใหม่จาก "วิธีตั้งค่า" แล้วทำให้ใช้งานได้เป็นเวอร์ชันใหม่',
  session: 'หมดเวลาการเข้าสู่ระบบ กรุณาเข้าสู่ระบบอีกครั้ง',
  password: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง',
  locked: 'ใส่รหัสผิดหลายครั้ง ระบบล็อกชั่วคราว กรุณารอ 15 นาทีแล้วลองใหม่',
  exists: 'มีบัญชีครูอยู่แล้ว ให้เข้าสู่ระบบ หรือใช้ "ลืมรหัสผ่าน"',
  setup_code: 'รหัสตั้งค่าไม่ตรงกับ SETUP_CODE ในสคริปต์',
  setup_default: 'สคริปต์ที่ใช้งานอยู่ยังเป็น SETUP_CODE ตั้งต้น แก้ค่าในโค้ด Apps Script กดบันทึก แล้วไปที่ การทำให้ใช้งานได้ › จัดการการทำให้ใช้งานได้ › ✏️ › เวอร์ชันใหม่ › ทำให้ใช้งานได้',
  username: 'ชื่อผู้ใช้ต้องเป็นตัวอักษรภาษาอังกฤษ ตัวเลข . _ - ยาว 3–32 ตัว',
  weak_password: 'รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร',
  code: 'รหัสเข้าใช้งานไม่ถูกต้อง กรุณาตรวจสอบตัวอักษรอีกครั้ง หรือติดต่อครูประจำชั้น',
  bad_request: 'ข้อมูลที่ส่งไม่ครบหรือไม่ถูกต้อง กรุณาโหลดหน้าใหม่แล้วลองอีกครั้ง',
  server: 'สคริปต์ใน Google Sheets ทำงานผิดพลาด กรุณาลองอีกครั้ง หากยังไม่ได้ ' + CHECK_LOG,
  action: 'สคริปต์ใน Google Sheets เป็นเวอร์ชันเก่า กรุณาวางโค้ดใหม่จาก "วิธีตั้งค่า"',
};

export function apiMessage(e: unknown): string {
  if (!(e instanceof ApiError)) return API_MESSAGES.network;
  return e.code === 'server' && e.detail ? `${API_MESSAGES.server} (ข้อความจากสคริปต์: ${e.detail})` : API_MESSAGES[e.code];
}

/** Errors that a later retry may fix on its own. */
export const isTransient = (e: unknown) => e instanceof ApiError && ['offline', 'network', 'unreadable', 'busy', 'server'].includes(e.code);

export const isApiUrl = (u: string) => /^https:\/\/script\.google(usercontent)?\.com\//.test(u.trim());

async function call<T>(url: string, body: Record<string, unknown>): Promise<T> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) throw new ApiError('offline');
  let res: Response;
  try {
    res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body) });
  } catch {
    throw new ApiError('network');
  }
  if (res.status === 404) throw new ApiError('not_found');
  if (res.status === 429 || res.status >= 500) throw new ApiError('busy');
  let j: { ok?: boolean; error?: string; message?: string } & T;
  try {
    j = await res.json();
  } catch {
    // Google answered with a web page (sign-in page, error page, …) instead of the script's JSON.
    throw new ApiError('unreadable');
  }
  if (!j || typeof j !== 'object') throw new ApiError('unreadable');
  if (!j.ok) {
    const code = j.error || '';
    // The version 1 script answered unknown actions with a token error.
    if (code === 'token') throw new ApiError('outdated');
    if (code in API_MESSAGES && code !== 'server') throw new ApiError(code as ApiErrorCode);
    throw new ApiError('server', String(j.message || '').slice(0, 200));
  }
  return j;
}

export interface RosterRow {
  sid: string; no: number; pre: string; fn: string; ln: string; age: number; sc: string; pc: string;
}

export const rosterOf = (students: Student[]): RosterRow[] =>
  students.map((s) => ({ sid: s.id, no: s.no, pre: s.pre, fn: s.fn, ln: s.ln, age: s.age, sc: s.sc, pc: s.pc }));

export const sheetsApi = {
  async status(url: string) {
    let j: { hasAccount?: boolean };
    try {
      j = await call<{ hasAccount?: boolean; version?: number }>(url, { action: 'status' });
    } catch (e) {
      // On the first check a web page instead of JSON most likely means a wrong URL.
      if (e instanceof ApiError && (e.code === 'unreadable' || e.code === 'not_found')) throw new ApiError('bad_response');
      throw e;
    }
    if (typeof j.hasAccount !== 'boolean') throw new ApiError('outdated');
    return { hasAccount: j.hasAccount };
  },
  register: (url: string, setupCode: string, username: string, password: string) =>
    call<{ session: string }>(url, { action: 'register', setupCode, username, password }),
  resetPassword: (url: string, setupCode: string, username: string, password: string) =>
    call<{ session: string }>(url, { action: 'resetPassword', setupCode, username, password }),
  login: (url: string, username: string, password: string) =>
    call<{ session: string; username: string }>(url, { action: 'login', username, password }),
  logout: (url: string, session: string) => call<object>(url, { action: 'logout', session }),
  changePassword: (url: string, session: string, oldPassword: string, newPassword: string) =>
    call<{ session: string }>(url, { action: 'changePassword', session, oldPassword, newPassword }),
  load: (url: string, session: string) => call<{ years: Record<string, YearData> }>(url, { action: 'load', session }),
  save: (url: string, session: string, year: string, data: YearData) =>
    call<object>(url, { action: 'save', session, year, data, roster: rosterOf(data.students) }),
  deleteYear: (url: string, session: string, year: string) => call<object>(url, { action: 'deleteYear', session, year }),
  responses: (url: string, session: string, year: string) =>
    call<{ rows: unknown[][] }>(url, { action: 'responses', session, year }),
  codeLogin: (url: string, role: 's' | 'p', code: string) =>
    call<{ student: { sid: string; pre: string; fn: string } }>(url, { action: 'codeLogin', role, code }),
  submitSdq: (url: string, body: { role: 's' | 'p'; code: string; ans: number[]; sc: object; severity: string; imp: object }) =>
    call<object>(url, { action: 'submitSdq', ...body }),
};
