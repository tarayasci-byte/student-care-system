// Thai (Buddhist calendar) date helpers.

/** e.g. "21 ต.ค. 69" — the short form used on records. */
export function shortDate(d = new Date()): string {
  return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
}

/** e.g. "21 ต.ค. 2569". */
export function mediumDate(d = new Date()): string {
  return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** e.g. "วันพุธที่ 21 ตุลาคม 2569". */
export function longDate(d = new Date()): string {
  const wd = d.toLocaleDateString('th-TH', { weekday: 'long' });
  const rest = d.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });
  return `${wd}ที่ ${rest}`;
}

export function stamp(d = new Date()): string {
  return `${shortDate(d)} ${d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}`;
}

/**
 * Thai school terms: term 1 runs May–October, term 2 November–March.
 * The academic year is the Buddhist year in which term 1 starts.
 */
export function currentTerm(d = new Date()): { year: string; term: 1 | 2 } {
  const be = d.getFullYear() + 543;
  const m = d.getMonth() + 1;
  if (m >= 5 && m <= 10) return { year: String(be), term: 1 };
  if (m >= 11) return { year: String(be), term: 2 };
  return { year: String(be - 1), term: 2 };
}

/** "ภาคเรียนที่ 1/2569" for the current academic year, otherwise "ปีการศึกษา 2568". */
export function termLabel(year: string, d = new Date()): string {
  const t = currentTerm(d);
  return t.year === year ? `ภาคเรียนที่ ${t.term}/${year}` : `ปีการศึกษา ${year}`;
}
