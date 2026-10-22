// SDQ (Strengths and Difficulties Questionnaire) items, wording and scoring criteria.
// Wording and cut-offs follow the attached แบบประเมิน SDQ (page 9 of the handbook).

export type Group = 0 | 1 | 2; // ปกติ / เสี่ยง / มีปัญหา
export const G = ['ปกติ', 'เสี่ยง', 'มีปัญหา'] as const;

export type Assessor = 't' | 's' | 'p'; // teacher / self / parent
export type SubKey = 'emo' | 'con' | 'hyp' | 'peer' | 'pro';
export type AreaKey = SubKey | 'total';

export interface SdqScores {
  emo: number;
  con: number;
  hyp: number;
  peer: number;
  pro: number;
  total: number;
}

export type Answer = 0 | 1 | 2 | null;

export interface SdqRecord extends SdqScores {
  ans: number[];
  date: string;
  imp?: Record<string, number>;
  hrs?: string;
}

/** [subscale, reverse-scored] for each of the 25 items, in form order. */
export const ITEMS: [SubKey, boolean][] = [
  ['pro', false], ['hyp', false], ['emo', false], ['pro', false], ['con', false],
  ['peer', false], ['con', true], ['emo', false], ['pro', false], ['hyp', false],
  ['peer', true], ['con', false], ['emo', false], ['peer', true], ['hyp', false],
  ['emo', false], ['pro', false], ['con', false], ['peer', false], ['pro', false],
  ['hyp', true], ['con', false], ['peer', false], ['emo', false], ['hyp', true],
];

/** Teacher and parent wording (third person). */
export const QT = ['ใส่ใจความรู้สึกของผู้อื่น', 'อยู่ไม่สุข เคลื่อนไหวมาก ไม่สามารถอยู่นิ่งได้นาน', 'บ่นปวดศีรษะ ปวดท้องหรือคลื่นไส้บ่อย ๆ', 'เต็มใจแบ่งปันกับผู้อื่น (ขนม ของเล่น ดินสอ ฯลฯ)', 'แผลงฤทธิ์บ่อย หรืออารมณ์ร้อน', 'ค่อนข้างอยู่โดดเดี่ยว มักเล่นตามลำพัง', 'โดยปกติแล้ว เชื่อฟัง ทำตามที่ผู้ใหญ่บอก', 'มีความกังวลหลายเรื่อง ดูเหมือนกังวลบ่อย', 'ช่วยเหลือถ้ามีใครบาดเจ็บ ไม่สบายใจ หรือเจ็บป่วย', 'หยุกหยิก หรือดิ้นไปดิ้นมาตลอดเวลา', 'มีเพื่อนสนิทอย่างน้อยหนึ่งคน', 'มีเรื่องต่อสู้หรือรังแกเด็กอื่นบ่อย ๆ', 'ไม่มีความสุข เศร้าหรือร้องไห้บ่อย', 'โดยทั่วไปเป็นที่ชอบพอของเด็กอื่น', 'วอกแวกง่าย ไม่มีสมาธิ', 'วิตกกังวลหรือติดแจเมื่ออยู่ในสถานการณ์ใหม่ เสียความมั่นใจง่าย', 'ใจดีกับเด็กที่อายุน้อยกว่า', 'พูดปดหรือขี้โกงบ่อย ๆ', 'ถูกเด็กคนอื่นแกล้งหรือรังแก', 'มักอาสาช่วยเหลือผู้อื่น (พ่อแม่ ครู เด็กอื่น)', 'คิดก่อนทำ', 'ขโมยของที่บ้าน ที่โรงเรียน หรือที่อื่น', 'เข้ากับผู้ใหญ่ได้ดีกว่าเข้ากับเด็กอื่น', 'มีความกลัวหลายเรื่อง หวาดกลัวง่าย', 'มีสมาธิในการติดตามทำงานจนเสร็จ'];

/** Self-assessment wording (first person). */
export const QS = ['ฉันพยายามทำดีต่อผู้อื่น ฉันใส่ใจความรู้สึกของผู้อื่น', 'ฉันอยู่ไม่สุข ฉันไม่สามารถอยู่นิ่งได้นาน', 'ฉันปวดศีรษะ ปวดท้องหรือคลื่นไส้บ่อย ๆ', 'โดยปกติแล้ว ฉันแบ่งปันกับผู้อื่น (อาหาร เกม ปากกา ฯลฯ)', 'ฉันโกรธรุนแรงและมักควบคุมอารมณ์ไม่ได้', 'ฉันมักอยู่กับตัวเอง ฉันมักเล่นคนเดียวหรืออยู่ตามลำพัง', 'โดยปกติแล้ว ฉันทำตามที่คนอื่นบอก', 'ฉันกังวลมาก', 'ฉันช่วยเหลือถ้ามีใครบาดเจ็บ ไม่สบายใจหรือเจ็บป่วย', 'ฉันหยุกหยิก หรือดิ้นไปดิ้นมาตลอดเวลา', 'ฉันมีเพื่อนสนิทอย่างน้อยหนึ่งคน', 'ฉันมีเรื่องต่อสู้บ่อย ๆ ฉันบังคับให้ผู้อื่นทำตามที่ฉันต้องการได้', 'ฉันมักไม่มีความสุข เศร้าหรือร้องไห้บ่อย', 'คนอื่นในวัยเดียวกับฉันมักชอบฉัน', 'ฉันวอกแวกง่าย ฉันมีความลำบากที่จะใช้สมาธิ', 'ฉันวิตกกังวลเมื่ออยู่ในสถานการณ์ใหม่ ๆ ฉันเสียความมั่นใจง่าย', 'ฉันใจดีกับเด็กที่อายุน้อยกว่า', 'ฉันถูกกล่าวหาว่า พูดปดหรือขี้โกงบ่อย ๆ', 'เด็กคนอื่น ๆ แกล้งหรือรังแกฉัน', 'ฉันมักอาสาช่วยเหลือผู้อื่น (พ่อแม่ ครู เด็ก)', 'ฉันคิดก่อนทำ', 'ฉันเอาของที่ไม่ใช่ของฉันออกไปจากบ้าน โรงเรียนหรือที่อื่น', 'ฉันเข้ากับผู้ใหญ่ได้ดีกว่าเข้ากับเด็กวัยเดียวกัน', 'ฉันมีความกลัวหลายอย่าง ฉันหวาดกลัวง่าย', 'ฉันทำงานที่ทำอยู่ได้เสร็จ ฉันมีสมาธิดี'];

export const ANSWER_LABELS = ['ไม่จริง', 'จริงบ้าง', 'จริงแน่นอน'];

export const SUBN: Record<SubKey, string> = {
  emo: 'ด้านอารมณ์',
  con: 'ด้านพฤติกรรมเกเร',
  hyp: 'ด้านสมาธิสั้น',
  peer: 'ด้านความสัมพันธ์กับเพื่อน',
  pro: 'ด้านสัมพันธภาพทางสังคม',
};

export const AK: AreaKey[] = ['emo', 'con', 'hyp', 'peer', 'pro', 'total'];
export const AKN: Record<AreaKey, string> = { ...SUBN, total: 'รวมจุดอ่อน 4 ด้าน' };

/** Teacher cut-offs used for a student's overall group across the system. */
export const SUBS: { k: Exclude<SubKey, 'pro'>; n: string; c: [number, number] }[] = [
  { k: 'emo', n: 'ด้านอารมณ์', c: [4, 5] },
  { k: 'con', n: 'ด้านพฤติกรรมเกเร', c: [2, 3] },
  { k: 'hyp', n: 'ด้านสมาธิสั้น', c: [5, 6] },
  { k: 'peer', n: 'ด้านความสัมพันธ์กับเพื่อน', c: [3, 4] },
];

/** [upper bound of ปกติ, upper bound of เสี่ยง] per assessor. */
export const CUT: Record<Assessor, Record<Exclude<AreaKey, 'pro'> | 'tot', [number, number]>> = {
  t: { emo: [4, 5], con: [2, 3], hyp: [5, 6], peer: [3, 4], tot: [11, 15], total: [11, 15] },
  s: { emo: [5, 6], con: [3, 4], hyp: [5, 6], peer: [3, 5], tot: [15, 19], total: [15, 19] },
  p: { emo: [4, 5], con: [2, 3], hyp: [5, 6], peer: [2, 3], tot: [13, 16], total: [13, 16] },
};

export const ASR: [Assessor, string, string][] = [
  ['t', 'ครูประเมิน', 'ครู'],
  ['s', 'นักเรียนประเมินตนเอง', 'ตนเอง'],
  ['p', 'ผู้ปกครองประเมิน', 'ผู้ปกครอง'],
];
export const asrLabel = (a: Assessor) => ASR.find((x) => x[0] === a)![1];
export const asrShort = (a: Assessor) => ASR.find((x) => x[0] === a)![2];

export const subG = (v: number, c: [number, number]): Group => (v <= c[0] ? 0 : v <= c[1] ? 1 : 2);
export const proG = (v: number): Group => (v >= 6 ? 0 : v === 5 ? 1 : 2);
/** Teacher total-difficulty group: 0–11 ปกติ, 12–15 เสี่ยง, 16–40 มีปัญหา. */
export const totG = (t: number): Group => (t >= 16 ? 2 : t >= 12 ? 1 : 0);

export function gOf(a: Assessor, k: AreaKey, v: number): Group {
  if (k === 'pro') return proG(v);
  if (k === 'total') {
    const [lo, hi] = CUT[a].tot;
    return v > hi ? 2 : v > lo ? 1 : 0;
  }
  return subG(v, CUT[a][k]);
}

export function scoreAns(ans: Answer[] | number[]): SdqScores {
  const o = { emo: 0, con: 0, hyp: 0, peer: 0, pro: 0, total: 0 };
  ans.forEach((v, i) => {
    if (v == null) return;
    const [k, rev] = ITEMS[i];
    o[k] += rev ? 2 - v : v;
  });
  o.total = o.emo + o.con + o.hyp + o.peer;
  return o;
}

export function cutText(a: Assessor): string {
  const [lo, hi] = CUT[a].tot;
  const mid = hi > lo + 1 ? `${lo + 1}–${hi}` : String(hi);
  return `เกณฑ์คะแนนรวม (${asrShort(a)}): ปกติ 0–${lo} · เสี่ยง ${mid} · มีปัญหา ${hi + 1}–40`;
}

export const SEVERITY = ['ไม่มีปัญหา', 'มีปัญหาเล็กน้อย', 'มีปัญหาชัดเจน', 'มีปัญหาอย่างรุนแรง'];
const LV4 = ['ไม่เลย', 'เล็กน้อย', 'ค่อนข้างมาก', 'มากที่สุด'];

/** Page 2 of the form: impact and severity. Questions 1)–4) only apply when a problem is reported. */
export function impactQuestions(a: Assessor): [string, string, string[]][] {
  const self = a === 's';
  const kid = self ? 'คุณ' : 'เด็ก';
  const q: [string, string, string[]][] = [
    ['overall', self
      ? 'โดยรวมคิดว่าตัวเองมีปัญหาในด้านอารมณ์ ด้านสมาธิ ด้านพฤติกรรม หรือความสามารถเข้ากับผู้อื่นด้านใดด้านหนึ่งหรือไม่'
      : 'โดยรวมคุณคิดว่าเด็กมีปัญหาในด้านอารมณ์ ด้านสมาธิ ด้านพฤติกรรม หรือความสามารถเข้ากับผู้อื่นด้านใดด้านหนึ่งหรือไม่', SEVERITY],
    ['dur', '1) ปัญหาที่มี เกิดขึ้นมานานเท่าไรแล้ว', ['น้อยกว่า 1 เดือน', '1–5 เดือน', '6–12 เดือน', 'มากกว่า 1 ปี']],
    ['dis', `2) ${kid}รู้สึกหงุดหงิดหรือไม่สบายใจกับปัญหาที่มีหรือไม่`, LV4],
  ];
  const areas = a === 't' ? ['การคบเพื่อน', 'การเรียนในห้องเรียน'] : ['ความเป็นอยู่ที่บ้าน', 'การคบเพื่อน', 'การเรียนในห้องเรียน', 'กิจกรรมยามว่าง'];
  areas.forEach((l, i) => q.push(['in' + i, (i ? '' : `3) ปัญหาที่มี รบกวนชีวิตประจำวันของ${kid} · `) + l, LV4]));
  q.push(['bur', '4) ' + (a === 't'
    ? 'ปัญหาที่มี ทำให้คุณหรือชั้นเรียนเกิดความยุ่งยากหรือไม่'
    : a === 'p'
      ? 'ปัญหาที่มี ทำให้คุณหรือครอบครัวเกิดความยุ่งยากหรือไม่'
      : 'ปัญหาที่มี ทำให้คนรอบข้างเกิดความยุ่งยากหรือไม่ (ครอบครัว เพื่อน ครู ฯลฯ)'), LV4]);
  return q;
}
