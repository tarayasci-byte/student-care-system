// Fictional sample class used on first run so the teacher can try every screen.
// None of these names, scores or home-visit details belong to real students.
import { scoreAns, type Assessor, type SdqRecord } from '../domain/sdq';
import { fromLabels, type VisitValue } from '../domain/visit';
import { randomCode, type HelpRecord, type Student } from '../domain/students';

const ROSTER: [string, string, string, number][] = [
  ['ด.ช.', 'ตัวอย่าง', 'ใจดี', 9], ['ด.ญ.', 'สมใจ', 'รักเรียน', 10], ['ด.ช.', 'กล้า', 'มั่นคง', 10],
  ['ด.ญ.', 'น้ำฝน', 'ใสสะอาด', 9], ['ด.ช.', 'ภูผา', 'สูงส่ง', 10], ['ด.ญ.', 'ดาวเรือง', 'บานเย็น', 9],
  ['ด.ช.', 'ทะเล', 'กว้างไกล', 10], ['ด.ญ.', 'ใบเตย', 'หอมหวาน', 10], ['ด.ช.', 'พายุ', 'แรงดี', 9],
  ['ด.ช.', 'ต้นกล้า', 'เติบโต', 10], ['ด.ญ.', 'แสงดาว', 'พราวฟ้า', 10],
];

const ANSWERS: Record<Assessor, string[]> = {
  t: ['2002112120200210101200012', '1001002122200200211222002', '1102112220001202120210002', '2001001020100210202220102', '1001201011200101110200012', '2112000010210200220221102', '2012102010101200111110101', '2112100120211210202111101', '2002012010100200210120102', '2012112110212111211222111', '2012100020211200201220102'],
  s: ['2222002020110200200210002', '2002102221112112100220000', '1112121220211110201221100', '2112102011201201200211002', '2212101120100111201211121', '1102101121100210220120202', '1002112212222200100210012', '2201102121100011110210111', '1101102020201200201220000', '1012111121011121111211110', '2101011220111210211211101'],
  p: ['1011002010100101220200002', '2202002121100120210210101', '1101002210201111220220021', '2102002020201210210121012', '1111101112100112110121001', '1012002020110101210220212', '2102011010100201201210011', '1111011021011001200110112', '2002002010120200111121000', '2112211111110111211222101', '1002112020211011220211012'],
};

const BM = 'บิดาและมารดา', OWN = 'บ้านของตนเอง/เจ้าของบ้าน', ONE = 'บ้านชั้นเดียว', SAFE = 'ดี/มั่นคง/ปลอดภัย';
const KM = '0-5 กม.', LT = 'น้อยกว่า 30 นาที', BT = 'น้ำบรรจุขวด/ตู้หยอดน้ำ', TAP = 'น้ำประปา', BIKE = 'จักรยาน', MC = 'จักรยานยนต์ส่วนตัว';
const NODEP = ['ไม่มีภาระพึ่งพิง'];

const VISITS: Record<string, VisitValue>[] = [
  { wt: '31', ht: '134', ill: 0, order: '1', kids: '2', ps: 'อยู่ด้วยกัน', gd: 'มารดา', close: ['มารดา'], talk: ['มารดา'], own: OWN, type: ONE, dep: NODEP, safe: SAFE, live: BM, trans: BIKE, dist: KM, time: LT, route: 'ปลอดภัย', water: [TAP], sum: 'ครอบครัวอบอุ่น ผู้ปกครองติดตามการบ้านทุกวัน' },
  { wt: '29', ht: '132', ill: 0, order: '2', kids: '2', ps: 'อยู่ด้วยกัน', gd: 'บิดา', close: ['บิดา', 'พี่ชาย'], talk: ['บิดา'], own: OWN, type: ONE, dep: NODEP, safe: SAFE, live: BM, trans: MC, dist: KM, time: LT, route: 'ปลอดภัย', water: [BT] },
  { wt: '35', ht: '136', ill: 0, order: '1', kids: '1', ps: 'แยกกันอยู่', gd: 'ปู่/ย่า/ตา/ยาย', close: ['ผู้ปกครอง'], talk: ['เพื่อน'], own: OWN, type: ONE, dep: ['ผู้สูงอายุเกิน 60 ปี'], safe: SAFE, live: 'ญาติ', trans: BIKE, dist: KM, time: LT, route: 'ปลอดภัย', water: [BT], needNote: 'ผู้ปกครองสูงอายุ ช่วยดูแลการบ้านได้น้อย', sum: 'อาศัยอยู่กับตายาย บิดามารดาทำงานต่างจังหวัด' },
  { wt: '26', ht: '130', ill: 0, order: '3', kids: '3', ps: 'อยู่ด้วยกัน', gd: 'มารดา', close: ['มารดา', 'พี่สาว'], talk: ['มารดา', 'พี่น้อง'], own: OWN, type: ONE, dep: NODEP, safe: SAFE, live: BM, trans: BIKE, dist: KM, time: LT, route: 'ปลอดภัย', water: [TAP] },
  { wt: '30', ht: '135', ill: 0, order: '1', kids: '2', ps: 'อยู่ด้วยกัน', gd: 'บิดา', close: ['บิดา'], talk: ['บิดา', 'ครู'], own: OWN, type: 'บ้านสองชั้น', dep: NODEP, safe: SAFE, live: BM, trans: 'รถส่วนตัว', dist: '6-10 กม.', time: LT, route: 'ปลอดภัย', water: [BT] },
  { wt: '24', ht: '127', ill: 0, order: '2', kids: '3', ps: 'อยู่ด้วยกัน', gd: 'มารดา', close: ['มารดา'], talk: ['มารดา'], own: 'บ้านเช่า', type: ONE, dep: NODEP, safe: 'เสี่ยง', live: BM, trans: 'เดิน', dist: KM, time: LT, route: 'เสี่ยงอันตราย', routeNote: 'ต้องข้ามถนนสายหลัก', water: [BT], needNote: 'หลังคาบ้านรั่วช่วงฝนตก', sum: 'ครอบครัวรายได้ไม่แน่นอน ผู้ปกครองให้ความร่วมมือดี', lowInc: 1 },
  { wt: '28', ht: '133', ill: 0, order: '1', kids: '2', ps: 'อยู่ด้วยกัน', gd: 'บิดา', close: ['มารดา'], talk: ['มารดา'], own: OWN, type: ONE, dep: NODEP, safe: SAFE, live: BM, trans: MC, dist: KM, time: LT, route: 'ปลอดภัย', water: [TAP] },
  { wt: '27', ht: '131', ill: 0, order: '2', kids: '2', ps: 'อยู่ด้วยกัน', gd: 'มารดา', close: ['น้องชาย'], talk: ['ครู'], own: OWN, type: ONE, dep: NODEP, safe: SAFE, live: BM, trans: BIKE, dist: KM, time: LT, route: 'ปลอดภัย', water: [BT] },
  { wt: '30', ht: '134', ill: 0, order: '1', kids: '1', ps: 'อยู่ด้วยกัน', gd: 'บิดา', close: ['บิดา', 'มารดา'], talk: ['บิดา'], own: OWN, type: ONE, dep: NODEP, safe: SAFE, live: BM, trans: MC, dist: KM, time: LT, route: 'ปลอดภัย', water: [TAP] },
  { wt: '33', ht: '137', ill: 0, order: '2', kids: '3', ps: 'หย่าร้าง', gd: 'มารดา', close: ['มารดา'], talk: ['เก็บไว้ในใจ'], own: 'อาศัยอยู่กับผู้อื่น/ไม่มีค่าใช้จ่าย', type: ONE, dep: ['บิดาหรือมารดาเลี้ยงเดี่ยว'], safe: SAFE, live: 'มารดา', trans: MC, dist: '6-10 กม.', time: '30-50 นาที', route: 'ปลอดภัย', water: [BT], needNote: 'ควรติดตามด้านอารมณ์และการคบเพื่อน', sum: 'มารดาเลี้ยงเดี่ยว ทำงานกลับบ้านค่ำ' },
];

const HELPS: Record<number, HelpRecord[]> = {
  9: [
    { date: '5 ต.ค. 69', areas: 'พฤติกรรม, อารมณ์', method: 'ให้คำปรึกษารายบุคคล', note: 'ข้อมูลตัวอย่าง: นัดพูดคุยสัปดาห์ละครั้งเรื่องสมาธิในห้องเรียน', result: 'คงเดิม', refer: 'ไม่ส่งต่อ' },
    { date: '14 ต.ค. 69', areas: 'พฤติกรรม', method: 'ประสานผู้ปกครอง', note: 'ข้อมูลตัวอย่าง: ตกลงกิจวัตรที่บ้านร่วมกับผู้ปกครอง และส่งต่อครูแนะแนว', result: 'ดีขึ้น', refer: 'ส่งต่อภายใน · ครูแนะแนว' },
  ],
  5: [{ date: '9 ต.ค. 69', areas: 'ครอบครัว/เศรษฐกิจ', method: 'ขอทุนการศึกษา', note: 'ข้อมูลตัวอย่าง: เสนอชื่อรับทุนปัจจัยพื้นฐาน', result: 'ดีขึ้น', refer: 'ไม่ส่งต่อ' }],
};

const SAMPLE_SDQ_DATE = '2 ต.ค. 69';
const SAMPLE_VISIT_DATE = 'ภาคเรียนที่ 1/2569';

export function makeSampleStudents(): Student[] {
  return ROSTER.map(([pre, fn, ln, age], i) => {
    const sdq3: Partial<Record<Assessor, SdqRecord>> = {};
    (['t', 's', 'p'] as Assessor[]).forEach((a) => {
      const ans = ANSWERS[a][i].split('').map(Number);
      sdq3[a] = { ...scoreAns(ans), ans, date: SAMPLE_SDQ_DATE };
    });
    const no = i + 1;
    return {
      id: 's' + no, no, sc: randomCode('S', no), pc: randomCode('P', no), pre, fn, ln, age,
      gpa: (2.8 + ((i * 37) % 11) / 10).toFixed(2), att: 94 + ((i * 5) % 6) + '%',
      sdq: { ...sdq3.t! }, sdq3,
      // The last student has not been visited yet, so the "not visited" states are visible.
      visit: VISITS[i] ? { date: SAMPLE_VISIT_DATE, v: fromLabels(VISITS[i]) } : null,
      helps: HELPS[i] || [],
    };
  });
}
