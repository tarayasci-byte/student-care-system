// Client for the Google Apps Script web app in apps-script/Code.gs.
// Every call is a POST with a text/plain body, which Apps Script accepts without a CORS preflight.
import type { Student } from '../domain/students';
import type { YearData } from '../state/db';

export type ApiErrorCode =
  | 'network' | 'bad_response' | 'outdated' | 'session' | 'password' | 'locked' | 'exists'
  | 'setup_code' | 'setup_default' | 'username' | 'weak_password' | 'code' | 'bad_request' | 'server' | 'action';

export class ApiError extends Error {
  constructor(public code: ApiErrorCode) {
    super(code);
  }
}

export const API_MESSAGES: Record<ApiErrorCode, string> = {
  network: 'เชื่อมต่อ Google Sheets ไม่สำเร็จ ตรวจสอบอินเทอร์เน็ตและ URL ของเว็บแอป',
  bad_response: 'URL นี้ไม่ใช่เว็บแอปของระบบ ตรวจสอบว่าคัดลอก URL ที่ลงท้ายด้วย /exec',
  outdated: 'สคริปต์ใน Google Sheets เป็นเวอร์ชันเก่า กรุณาวางโค้ดใหม่จาก "วิธีตั้งค่า" แล้วทำให้ใช้งานได้เป็นเวอร์ชันใหม่',
  session: 'หมดเวลาการเข้าสู่ระบบ กรุณาเข้าสู่ระบบอีกครั้ง',
  password: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง',
  locked: 'ใส่รหัสผิดหลายครั้ง ระบบล็อกชั่วคราว กรุณารอ 15 นาทีแล้วลองใหม่',
  exists: 'มีบัญชีครูอยู่แล้ว ให้เข้าสู่ระบบ หรือใช้ "ลืมรหัสผ่าน"',
  setup_code: 'รหัสตั้งค่าไม่ตรงกับ SETUP_CODE ในสคริปต์',
  setup_default: 'ยังไม่ได้เปลี่ยน SETUP_CODE ในสคริปต์ กรุณาแก้ในโค้ด Apps Script แล้วทำให้ใช้งานได้ใหม่',
  username: 'ชื่อผู้ใช้ต้องเป็นตัวอักษรภาษาอังกฤษ ตัวเลข . _ - ยาว 3–32 ตัว',
  weak_password: 'รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร',
  code: 'รหัสเข้าใช้งานไม่ถูกต้อง กรุณาติดต่อครูประจำชั้น',
  bad_request: 'ข้อมูลที่ส่งไม่ถูกต้อง',
  server: 'Google Sheets ทำงานผิดพลาด กรุณาลองใหม่อีกครั้ง',
  action: 'สคริปต์ใน Google Sheets เป็นเวอร์ชันเก่า กรุณาวางโค้ดใหม่จาก "วิธีตั้งค่า"',
};

export const apiMessage = (e: unknown) => (e instanceof ApiError ? API_MESSAGES[e.code] : API_MESSAGES.network);

export const isApiUrl = (u: string) => /^https:\/\/script\.google(usercontent)?\.com\//.test(u.trim());

async function call<T>(url: string, body: Record<string, unknown>): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body) });
  } catch {
    throw new ApiError('network');
  }
  let j: { ok?: boolean; error?: ApiErrorCode } & T;
  try {
    j = await res.json();
  } catch {
    throw new ApiError('bad_response');
  }
  if (!j || typeof j !== 'object') throw new ApiError('bad_response');
  // The version 1 script answered unknown actions with a token error.
  if (!j.ok) throw new ApiError(j.error && j.error in API_MESSAGES ? j.error : (j.error as string) === 'token' ? 'outdated' : 'server');
  return j;
}

export interface RosterRow {
  sid: string; no: number; pre: string; fn: string; ln: string; age: number; sc: string; pc: string;
}

export const rosterOf = (students: Student[]): RosterRow[] =>
  students.map((s) => ({ sid: s.id, no: s.no, pre: s.pre, fn: s.fn, ln: s.ln, age: s.age, sc: s.sc, pc: s.pc }));

export const sheetsApi = {
  async status(url: string) {
    const j = await call<{ hasAccount?: boolean; version?: number }>(url, { action: 'status' });
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
