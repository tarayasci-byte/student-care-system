import { cat, fullName, helpStatus, reasons, type Student } from '../domain/students';

export const ageText = (s: Student) => `${s.age} ปี`;

/** Fields shown wherever a student appears in a list. */
export function view(s: Student) {
  const c = cat(s);
  return {
    c,
    name: fullName(s),
    sdqText: s.sdq ? String(s.sdq.total) : '—',
    visitText: s.visit ? 'เยี่ยมแล้ว · ' + s.visit.date : 'ยังไม่เยี่ยม',
    statusText: helpStatus(s),
    reason: reasons(s).join(' · ') || 'ไม่พบความเสี่ยง',
  };
}
