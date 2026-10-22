// Home visit form (แบบเก็บข้อมูลการรู้จักนักเรียนรายบุคคล), reduced to the 4 sections the teacher asked for
// and stripped of personal details (names, phone numbers, jobs, incomes, address, ID, birth date).
import { TEACHER } from '../config';
import type { Group } from './sdq';

export type FieldKind = 'num' | 'calc' | 'seg' | 'chips' | 'select' | 'line' | 'text' | 'check' | 'photo';

export interface VisitField {
  id: string;
  l: string;
  k: FieldKind;
  o?: string[];
  ph?: string;
}

export interface VisitSection {
  t: string;
  d: string;
  f: VisitField[];
}

export type VisitValue = string | number | boolean | string[] | undefined;
/** seg/select store the option index (-1 = unset), chips store labels, num/line/text store strings. */
export type VisitValues = Record<string, VisitValue>;

export interface VisitRecord {
  date: string;
  v: VisitValues;
}

export const VF: VisitSection[] = [
  { t: 'ข้อมูลพื้นฐาน', d: 'ชื่อ เลขประจำตัว วันเกิด และที่อยู่ ดึงจากระบบ DMC อัตโนมัติ ไม่แสดงในหน้านี้', f: [
    { id: 'wt', l: 'น้ำหนัก (กก.)', k: 'num' },
    { id: 'ht', l: 'ส่วนสูง (ซม.)', k: 'num' },
    { id: 'bmi', l: 'ภาวะโภชนาการ', k: 'calc' },
    { id: 'ill', l: 'โรคประจำตัว', k: 'seg', o: ['ไม่มี', 'มี'] },
    { id: 'dp', l: 'ความด้อยโอกาส', k: 'chips', o: ['ไม่ด้อยโอกาส', 'เด็กยากจน', 'เด็กถูกทอดทิ้ง', 'กำพร้า', 'ทำงานรับผิดชอบตนเองและครอบครัว', 'อื่น ๆ'] },
    { id: 'dsb', l: 'ความพิการ', k: 'seg', o: ['ไม่พิการ', 'มี (ระบุในระบบ DMC)'] },
  ] },
  { t: 'ข้อมูลครอบครัว', d: 'ไม่เก็บชื่อ เบอร์โทรศัพท์ อาชีพ และรายได้ของบิดามารดาหรือผู้ปกครอง', f: [
    { id: 'ps', l: 'สถานภาพบิดามารดา', k: 'select', o: ['อยู่ด้วยกัน', 'แยกกันอยู่', 'หย่าร้าง', 'บิดาเสียชีวิต/สาบสูญ', 'มารดาเสียชีวิต/สาบสูญ', 'บิดามารดาเสียชีวิต/สาบสูญ', 'บิดาหรือมารดาสมรสใหม่', 'บิดามารดาทอดทิ้ง', 'อื่น ๆ'] },
    { id: 'gd', l: 'ผู้ปกครองเกี่ยวข้องเป็น', k: 'select', o: ['บิดา', 'มารดา', 'ปู่/ย่า/ตา/ยาย', 'ลุง/ป้า/น้า/อา', 'อื่น ๆ'] },
    { id: 'order', l: 'เป็นบุตรคนที่', k: 'num' },
    { id: 'kids', l: 'จากจำนวนบุตรทั้งหมด (คน)', k: 'num' },
    { id: 'close', l: 'สนิทกับใครมากที่สุด', k: 'chips', o: ['บิดา', 'มารดา', 'พี่สาว', 'น้องสาว', 'พี่ชาย', 'น้องชาย', 'ผู้ปกครอง', 'อื่น ๆ'] },
    { id: 'talk', l: 'เมื่อทุกข์ใจหรือมีปัญหา มักปรึกษา', k: 'chips', o: ['บิดา', 'มารดา', 'ผู้ปกครอง', 'พี่น้อง', 'ญาติ', 'เพื่อน', 'ครู', 'เพื่อนในโลกออนไลน์', 'เก็บไว้ในใจ', 'Hotline', 'อื่น ๆ'] },
  ] },
  { t: 'ข้อมูลสถานะครัวเรือน', d: 'กรณีนักเรียนเข้าคัดกรองความยากจน ระบบดึงข้อมูลจากแบบ นร.01 ให้อัตโนมัติ', f: [
    { id: 'own', l: 'สถานะที่อยู่อาศัย', k: 'select', o: ['บ้านของตนเอง/เจ้าของบ้าน', 'บ้านเช่า', 'อาศัยอยู่กับผู้อื่น/ไม่มีค่าใช้จ่าย', 'บ้านพัก/หอพัก', 'อื่น ๆ'] },
    { id: 'type', l: 'ลักษณะบ้าน', k: 'select', o: ['บ้านชั้นเดียว', 'บ้านสองชั้น', 'ทาวน์เฮาส์', 'อื่น ๆ'] },
    { id: 'live', l: 'พักอาศัยอยู่กับ', k: 'select', o: ['บิดาและมารดา', 'บิดา', 'มารดา', 'ญาติ', 'พี่/น้อง', 'ผู้ปกครองที่ไม่ใช่บิดามารดา', 'อื่น ๆ'] },
    { id: 'trans', l: 'การเดินทางมาโรงเรียน', k: 'select', o: ['เดิน', 'จักรยาน', 'รถโรงเรียน', 'จักรยานยนต์ส่วนตัว', 'รถส่วนตัว', 'จักรยานยนต์รับจ้าง', 'รถโดยสาร', 'อื่น ๆ'] },
    { id: 'dist', l: 'ระยะทางถึงโรงเรียน', k: 'select', o: ['0-5 กม.', '6-10 กม.', '11-15 กม.', '16-20 กม.', '21-40 กม.', '40 กม. ขึ้นไป'] },
    { id: 'time', l: 'เวลาเดินทาง', k: 'select', o: ['น้อยกว่า 30 นาที', '30-50 นาที', '1-3 ชั่วโมง', 'มากกว่า 3 ชั่วโมง'] },
    { id: 'dep', l: 'ภาระพึ่งพิงในครัวเรือน', k: 'chips', o: ['ไม่มีภาระพึ่งพิง', 'คนพิการ/เจ็บป่วยเรื้อรัง', 'ผู้สูงอายุเกิน 60 ปี', 'บิดาหรือมารดาเลี้ยงเดี่ยว', 'คนอายุ 15–60 ปีว่างงาน'] },
    { id: 'safe', l: 'ความปลอดภัยของที่อยู่อาศัย', k: 'seg', o: ['ดี/มั่นคง/ปลอดภัย', 'เสี่ยง'] },
    { id: 'route', l: 'สภาพแวดล้อมระหว่างทาง', k: 'seg', o: ['ปลอดภัย', 'เสี่ยงอันตราย'] },
    { id: 'routeNote', l: 'ระบุความเสี่ยงระหว่างทาง', k: 'line', ph: 'เช่น ผ่านถนนใหญ่ มีสุนัขดุ' },
    { id: 'elec', l: 'แหล่งไฟฟ้าหลัก', k: 'seg', o: ['ไฟบ้าน/มิเตอร์', 'ไฟต่อพ่วง/แบตเตอรี่', 'ปั่นไฟ/โซลาร์เซลล์', 'ไม่มีไฟฟ้า'] },
    { id: 'water', l: 'แหล่งน้ำดื่ม', k: 'chips', o: ['น้ำบรรจุขวด/ตู้หยอดน้ำ', 'น้ำประปา', 'น้ำบ่อ/บาดาล', 'น้ำฝน/ประปาภูเขา/ลำธาร'] },
    { id: 'haz', l: 'ความเสี่ยงด้านภัยพิบัติ', k: 'chips', o: ['ไม่มีความเสี่ยง', 'วาตภัย', 'มลพิษทางอากาศ', 'มลพิษทางเสียง', 'แผ่นดินไหว/ดินถล่ม', 'อุทกภัย', 'โรคระบาด'] },
    { id: 'photo', l: 'ภาพประกอบการเยี่ยมบ้าน', k: 'photo' },
  ] },
  { t: 'ความคิดเห็นครู', d: 'ผู้บันทึก: ' + TEACHER.recorder, f: [
    { id: 'need', l: 'การช่วยเหลือที่ต้องการ', k: 'chips', o: ['ทุนการศึกษา', 'อาหาร/โภชนาการ', 'อุปกรณ์การเรียน/เครื่องแบบ', 'ซ่อมแซมที่อยู่อาศัย', 'การเดินทาง', 'ส่งต่อครูแนะแนว/นักจิตวิทยา', 'ส่งต่อหน่วยงานภายนอก'] },
    { id: 'needNote', l: 'สภาพที่น่าเป็นห่วงและความต้องการจำเป็น', k: 'text', ph: 'การช่วยเหลือเบื้องต้นที่ควรได้รับ' },
    { id: 'sum', l: 'ข้อสรุปจากการเยี่ยมบ้าน', k: 'text', ph: 'ภาพรวมความเป็นอยู่และการดูแลของครอบครัว' },
    { id: 'consent', l: 'แจ้งวัตถุประสงค์การขอข้อมูลแก่ผู้ให้ข้อมูลเรียบร้อยแล้ว', k: 'check' },
  ] },
];

export const FBY: Record<string, VisitField> = {};
VF.forEach((s) => s.f.forEach((x) => { FBY[x.id] = x; }));

/** Fields that span the full grid width. */
export const WIDE: Partial<Record<FieldKind, true>> = { seg: true, chips: true, text: true, photo: true, check: true, line: true };

/** Risk factors from the "เกณฑ์คัดกรอง" tab of the student data sheet: [key, label, points]. */
export const RF: [string, string, number][] = [
  ['lowInc', 'รายได้น้อย', 2], ['dp', 'ด้อยโอกาส', 2], ['house', 'ที่อยู่อาศัยเสี่ยง', 2], ['noTalk', 'ไม่มีที่ปรึกษา', 2],
  ['fam', 'ครอบครัวไม่สมบูรณ์', 1], ['route', 'การเดินทางเสี่ยง', 1], ['dep', 'ภาระพึ่งพิง', 1], ['health', 'สุขภาพ', 1],
];

export function vDefaults(): VisitValues {
  const o: VisitValues = {};
  VF.forEach((s) => s.f.forEach((x) => {
    o[x.id] = x.k === 'chips' ? [] : x.k === 'text' || x.k === 'line' || x.k === 'num' ? '' : x.k === 'check' ? false : -1;
  }));
  o.nut = '';
  return o;
}

const arr = (x: VisitValue): string[] => (Array.isArray(x) ? x : []);

export function bmiText(v: VisitValues): string {
  const w = parseFloat(String(v.wt ?? ''));
  const h = parseFloat(String(v.ht ?? '')) / 100;
  if (!w || !h) return '—';
  const b = w / (h * h);
  return b < 14.5 ? 'ผอม' : b < 19.5 ? 'สมส่วน' : b < 22 ? 'ท้วม' : 'อ้วน';
}

export function valText(f: VisitField, v: VisitValues): string {
  const x = v[f.id];
  if (f.k === 'seg' || f.k === 'select') return x == null || typeof x !== 'number' || x < 0 ? '—' : f.o![x];
  if (f.k === 'chips') return arr(x).length ? arr(x).join(', ') : '—';
  if (f.k === 'calc') return (v.nut as string) || bmiText(v);
  return x ? String(x) : '—';
}

export interface Risk {
  on: Record<string, boolean>;
  score: number;
  g: Group;
  factors: string[];
}

export function riskOf(v: VisitValues): Risk {
  const T = (id: string) => valText(FBY[id], v);
  const live = T('live');
  const nutrition = (v.nut as string) || '';
  const bmi = bmiText(v);
  const on: Record<string, boolean> = {
    lowInc: !!v.lowInc,
    dp: arr(v.dp).some((x) => x !== 'ไม่ด้อยโอกาส'),
    house: T('safe') === 'เสี่ยง',
    noTalk: arr(v.talk).includes('เก็บไว้ในใจ'),
    fam: live !== 'บิดาและมารดา' && live !== '—',
    route: T('route') === 'เสี่ยงอันตราย' || ['1-3 ชั่วโมง', 'มากกว่า 3 ชั่วโมง'].includes(T('time')),
    dep: arr(v.dep).some((x) => x !== 'ไม่มีภาระพึ่งพิง'),
    health: v.ill === 1 || v.dsb === 1 || (nutrition ? nutrition !== 'สมส่วน' : bmi !== 'สมส่วน' && bmi !== '—'),
  };
  const score = RF.reduce((a, r) => a + (on[r[0]] ? r[2] : 0), 0);
  return { on, score, g: score <= 2 ? 0 : score <= 5 ? 1 : 2, factors: RF.filter((r) => on[r[0]]).map((r) => r[1]) };
}

/** Convert a record that uses option labels for seg/select fields into stored indexes. */
export function fromLabels(raw: Record<string, VisitValue>): VisitValues {
  const v = vDefaults();
  v.dp = ['ไม่ด้อยโอกาส'];
  v.dsb = 0;
  v.elec = 0;
  v.haz = ['ไม่มีความเสี่ยง'];
  v.consent = true;
  Object.keys(raw).forEach((k) => {
    const x = FBY[k];
    const r = raw[k];
    v[k] = x && (x.k === 'seg' || x.k === 'select') && typeof r === 'string' ? x.o!.indexOf(r) : r;
  });
  return v;
}
