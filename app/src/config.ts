// School and teacher details shown throughout the UI. Change these to reuse the system elsewhere.
export const SCHOOL = {
  name: 'โรงเรียนบ้านคลองขุด',
  areaShort: 'สพป.กำแพงเพชร เขต 2',
  areaFull: 'สำนักงานเขตพื้นที่การศึกษาประถมศึกษากำแพงเพชร เขต 2',
  grade: 'ชั้นประถมศึกษาปีที่ 4',
};

export const TEACHER = {
  fullName: 'ครูอารยา ทองนาค',
  shortName: 'ครูอารยา',
  initial: 'อ',
  role: 'ครูประจำชั้นประถมศึกษาปีที่ 4',
  recorder: 'ครูอารยา ทองนาค · ครูผู้ช่วย',
};

export const FOOTER = [
  'จัดทำโดย นางสาวอารยา ทองนาค ตำแหน่ง ครูผู้ช่วย',
  'โรงเรียนบ้านคลองขุด สังกัดสำนักงานเขตพื้นที่การศึกษาประถมศึกษากำแพงเพชร เขต 2',
];

/** Build-time default for the Apps Script web app, so student/parent phones work without setup. */
export const DEFAULT_API_URL: string = (import.meta.env.VITE_SHEET_API_URL || '').trim();

/** Teacher sessions end after this much inactivity. */
export const IDLE_LOGOUT_MS = 30 * 60 * 1000;
