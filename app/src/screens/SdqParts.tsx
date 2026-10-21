import { ANSWER_LABELS, impactQuestions, ITEMS, QS, QT, SUBN, type Answer, type Assessor } from '../domain/sdq';
import { Icon } from '../components/Icon';
import { Card, Seg } from '../components/ui';

export interface SdqDraft {
  sid: string;
  ans: Answer[];
  imp: Record<string, number>;
  hrs: string;
  step: number;
}

export const emptyDraft = (sid: string): SdqDraft => ({ sid, ans: Array(25).fill(null), imp: {}, hrs: '', step: 0 });

export const questionText = (a: Assessor, i: number) => (a === 's' ? QS : QT)[i];

/** One question at a time (mobile and the student/parent portal). */
export function SdqStepCard({ asr, draft, setDraft, showSub, compact }: {
  asr: Assessor;
  draft: SdqDraft;
  setDraft: (fn: (d: SdqDraft) => SdqDraft) => void;
  showSub?: boolean;
  compact?: boolean;
}) {
  const i = draft.step;
  const pick = (v: Answer) => setDraft((d) => {
    const ans = [...d.ans];
    ans[i] = v;
    return { ...d, ans, step: d.step < 24 ? d.step + 1 : d.step };
  });
  return (
    <Card style={{ padding: '22px 22px 18px', gap: 18 }}>
      <span className="card-kicker">ข้อ {i + 1} จาก 25{showSub ? ' · ' + SUBN[ITEMS[i][0]] : ''}</span>
      <div className="hnum" style={{ fontSize: compact ? 26 : 28, lineHeight: 1.25, minHeight: compact ? 66 : 72, textWrap: 'pretty' } as React.CSSProperties}>{questionText(asr, i)}</div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit,minmax(${compact ? 110 : 120}px,1fr))`, gap: 10 }}>
        {ANSWER_LABELS.map((l, v) => {
          const on = draft.ans[i] === v;
          return (
            <button key={l} type="button" aria-pressed={on} onClick={() => pick(v as Answer)} style={{
              minHeight: 52, padding: '10px 12px', fontSize: 15, cursor: 'pointer',
              border: '1px solid ' + (on ? 'var(--color-accent)' : 'var(--color-divider)'),
              background: on ? 'var(--color-accent)' : 'transparent', color: on ? 'var(--color-neutral-100)' : 'var(--color-text)',
            }}>{l}</button>
          );
        })}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {ITEMS.map((_, k) => (
          <button key={k} type="button" title={'ข้อ ' + (k + 1)} aria-label={'ไปข้อ ' + (k + 1)} onClick={() => setDraft((d) => ({ ...d, step: k }))} style={{
            width: 14, height: 14, padding: 0, cursor: 'pointer',
            border: k === i ? '1.5px solid var(--color-accent-900)' : '1px solid var(--color-divider)',
            background: draft.ans[k] != null ? 'var(--color-accent)' : 'transparent',
          }} />
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between' }}>
        <button type="button" className="btn btn-secondary" disabled={i === 0} onClick={() => setDraft((d) => ({ ...d, step: Math.max(0, d.step - 1) }))}><Icon name="back" />ก่อนหน้า</button>
        <button type="button" className="btn btn-secondary" disabled={i === 24} onClick={() => setDraft((d) => ({ ...d, step: Math.min(24, d.step + 1) }))}>ถัดไป<Icon name="chev" /></button>
      </div>
    </Card>
  );
}

/** All 25 questions on one page (desktop teacher form). */
export function SdqList({ asr, draft, setDraft }: { asr: Assessor; draft: SdqDraft; setDraft: (fn: (d: SdqDraft) => SdqDraft) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {ITEMS.map((_, i) => (
        <div key={i} className="line-bottom" style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', padding: '10px 0' }}>
          <span className="hnum" style={{ width: 26, flex: 'none', fontSize: 17, color: 'var(--color-neutral-600)' }}>{i + 1}</span>
          <span style={{ flex: '1 1 200px', fontSize: 14 }}>{questionText(asr, i)}</span>
          <Seg<number> name={'q' + i} value={draft.ans[i]} optStyle={{ fontSize: 12, padding: '6px 10px' }}
            options={ANSWER_LABELS.map((l, v) => ({ value: v, label: l }))}
            onChange={(v) => setDraft((d) => { const ans = [...d.ans]; ans[i] = v as Answer; return { ...d, ans }; })} />
        </div>
      ))}
    </div>
  );
}

/** Page 2: impact and severity. Follow-up questions appear once a problem is reported. */
export function ImpactFields({ asr, draft, setDraft }: { asr: Assessor; draft: SdqDraft; setDraft: (fn: (d: SdqDraft) => SdqDraft) => void }) {
  const hasProb = (draft.imp.overall || 0) > 0;
  return (
    <>
      {impactQuestions(asr).filter((_, i) => i === 0 || hasProb).map(([k, label, opts]) => (
        <div key={k} className="field">
          <label style={{ fontSize: 13, color: 'var(--color-text)' }}>{label}</label>
          <div style={{ overflowX: 'auto' }}>
            <Seg name={'imp_' + k} value={draft.imp[k] || 0} optStyle={{ fontSize: 12, padding: '6px 10px' }}
              options={opts.map((l, v) => ({ value: v, label: l }))}
              onChange={(v) => setDraft((d) => ({ ...d, imp: { ...d.imp, [k]: v } }))} />
          </div>
        </div>
      ))}
    </>
  );
}

/** Only answers to the questions actually shown are kept. */
export function cleanImpact(imp: Record<string, number>): Record<string, number> {
  return (imp.overall || 0) > 0 ? { ...imp } : { overall: 0 };
}
