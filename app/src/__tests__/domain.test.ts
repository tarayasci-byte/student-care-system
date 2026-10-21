import { describe, expect, it } from 'vitest';
import { makeSampleStudents } from '../data/sample';
import { currentTerm, termLabel } from '../domain/dates';
import { cutText, gOf, scoreAns, totG } from '../domain/sdq';
import { cat, groupOf, parseNames } from '../domain/students';
import { fromLabels, riskOf, vDefaults } from '../domain/visit';
import { mergeResponses } from '../state/db';

describe('SDQ scoring', () => {
  it('reverse-scores items 7, 11, 14, 21 and 25', () => {
    const ans = Array(25).fill(0);
    const s = scoreAns(ans);
    // All "ไม่จริง": reversed items count 2 each → con 2, peer 4, hyp 4.
    expect(s).toEqual({ emo: 0, con: 2, hyp: 4, peer: 4, pro: 0, total: 10 });
  });

  it('uses teacher total cut-offs 0–11 / 12–15 / 16–40', () => {
    expect([11, 12, 15, 16].map(totG)).toEqual([0, 1, 1, 2]);
    expect([11, 12, 15, 16].map((v) => gOf('t', 'total', v))).toEqual([0, 1, 1, 2]);
  });

  it('applies each assessor’s own cut-offs', () => {
    expect(gOf('s', 'total', 16)).toBe(1);
    expect(gOf('s', 'total', 20)).toBe(2);
    expect(gOf('p', 'peer', 3)).toBe(1);
    expect(gOf('t', 'pro', 5)).toBe(1);
    expect(cutText('t')).toContain('ปกติ 0–11 · เสี่ยง 12–15 · มีปัญหา 16–40');
  });
});

describe('home-visit risk score', () => {
  it('is 0 for a complete, safe household', () => {
    const r = riskOf(fromLabels({ live: 'บิดาและมารดา', safe: 'ดี/มั่นคง/ปลอดภัย', route: 'ปลอดภัย', dep: ['ไม่มีภาระพึ่งพิง'], talk: ['มารดา'], nut: 'สมส่วน' }));
    expect(r.score).toBe(0);
    expect(r.g).toBe(0);
  });

  it('adds the weighted factors and groups 3–5 as เสี่ยง, 6+ as มีปัญหา', () => {
    const v = fromLabels({ live: 'ญาติ', talk: ['เก็บไว้ในใจ'], nut: 'สมส่วน', dep: ['ไม่มีภาระพึ่งพิง'] });
    expect(riskOf(v).score).toBe(3); // fam 1 + noTalk 2
    expect(riskOf(v).g).toBe(1);
    const w = fromLabels({ live: 'ญาติ', talk: ['เก็บไว้ในใจ'], safe: 'เสี่ยง', lowInc: 1, nut: 'สมส่วน', dep: ['ไม่มีภาระพึ่งพิง'] });
    expect(riskOf(w).score).toBe(7);
    expect(riskOf(w).g).toBe(2);
  });

  it('treats an empty form as no risk', () => {
    expect(riskOf(vDefaults()).score).toBe(0);
  });
});

describe('students', () => {
  it('groups by the more serious of SDQ and home visit', () => {
    const st = makeSampleStudents();
    expect(st).toHaveLength(11);
    expect(st.map(groupOf).filter((g) => g === 2)).toHaveLength(1);
    expect(st.every((s) => /^S\d\d-[A-Z2-9]{4}$/.test(s.sc) && /^P\d\d-[A-Z2-9]{4}$/.test(s.pc))).toBe(true);
    const fresh = { ...st[0], sdq: null, visit: null };
    expect(cat(fresh)).toBe('pend');
  });

  it('parses pasted names with Thai prefixes', () => {
    const [a, b] = parseNames('เด็กหญิงมาลี ดีใจ\nด.ช.ชาย  ใจดี', 5);
    expect([a.pre, a.fn, a.ln, a.no]).toEqual(['ด.ญ.', 'มาลี', 'ดีใจ', 5]);
    expect([b.pre, b.fn, b.ln, b.no]).toEqual(['ด.ช.', 'ชาย', 'ใจดี', 6]);
  });
});

describe('responses from Google Sheets', () => {
  it('recomputes scores from answers and keeps the latest row per assessor', () => {
    const st = makeSampleStudents();
    const row = (role: string, v: number) => [new Date().toISOString(), '2569', 's2', 2, 'x', role, ...Array(25).fill(v)];
    const { students, count } = mergeResponses(st, [row('ตนเอง', 0), row('ตนเอง', 2), row('ผู้ปกครอง', 1), row('ครู', 1)]);
    expect(count).toBe(3);
    const s2 = students.find((s) => s.id === 's2')!;
    expect(s2.sdq3.s!.total).toBe(scoreAns(Array(25).fill(2)).total);
    expect(s2.sdq3.p!.ans).toEqual(Array(25).fill(1));
    expect(s2.sdq).toEqual(st[1].sdq); // teacher result is never overwritten by portal rows
  });
});

describe('Thai school terms', () => {
  it('maps months to term and academic year', () => {
    expect(currentTerm(new Date(2026, 9, 21))).toEqual({ year: '2569', term: 1 });
    expect(currentTerm(new Date(2026, 10, 2))).toEqual({ year: '2569', term: 2 });
    expect(currentTerm(new Date(2027, 1, 2))).toEqual({ year: '2569', term: 2 });
    expect(termLabel('2568', new Date(2026, 9, 21))).toBe('ปีการศึกษา 2568');
  });
});
