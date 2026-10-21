import { useEffect } from 'react';
import { shortDate } from '../domain/dates';
import { fullName } from '../domain/students';
import { bmiText, riskOf, vDefaults, VF, WIDE, type VisitField, type VisitValues } from '../domain/visit';
import { Icon } from '../components/Icon';
import { useIsMobile } from '../components/Shell';
import { Card, Chip, EmptyBox, PrimaryButton, Seg } from '../components/ui';
import { useMemoryState } from '../state/memory';
import { useStore } from '../state/store';
import { RiskCard } from './Profile';

interface VisitDraft {
  sid: string;
  sec: number;
  vf: VisitValues;
}

function Field({ f, vf, set }: { f: VisitField; vf: VisitValues; set: (id: string, v: VisitValues[string]) => void }) {
  const x = vf[f.id];
  const id = 'vf-' + f.id;
  return (
    <div className="field" style={WIDE[f.k] ? { gridColumn: '1 / -1' } : undefined}>
      {f.k !== 'check' && <label htmlFor={id}>{f.l}</label>}
      {f.k === 'seg' && (
        <div style={{ overflowX: 'auto' }}>
          <Seg name={id} value={x as number} onChange={(v) => set(f.id, v)} options={f.o!.map((l, i) => ({ value: i, label: l }))} />
        </div>
      )}
      {f.k === 'chips' && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {f.o!.map((l) => {
            const list = Array.isArray(x) ? x : [];
            const on = list.includes(l);
            return <Chip key={l} on={on} onClick={() => set(f.id, on ? list.filter((y) => y !== l) : [...list, l])}>{l}</Chip>;
          })}
        </div>
      )}
      {f.k === 'select' && (
        <select id={id} className="input" value={x as number} onChange={(e) => set(f.id, +e.target.value)}>
          <option value={-1}>— ไม่ระบุ —</option>
          {f.o!.map((l, i) => <option key={l} value={i}>{l}</option>)}
        </select>
      )}
      {f.k === 'num' && <input id={id} className="input" type="number" min={0} step="any" value={String(x ?? '')} onChange={(e) => set(f.id, e.target.value)} />}
      {f.k === 'line' && <input id={id} className="input" placeholder={f.ph} value={String(x ?? '')} onChange={(e) => set(f.id, e.target.value)} />}
      {f.k === 'calc' && (
        <div style={{ minHeight: 36, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="tag tag-accent">{(vf.nut as string) || bmiText(vf)}</span>
          <span className="text-muted" style={{ fontSize: 12 }}>จากน้ำหนักและส่วนสูง</span>
        </div>
      )}
      {f.k === 'text' && <textarea id={id} className="input" placeholder={f.ph} value={String(x ?? '')} onChange={(e) => set(f.id, e.target.value)} />}
      {f.k === 'check' && (
        <label className="radio" style={{ padding: '10px 12px', border: '1px solid var(--color-divider)', width: '100%' }}>
          <input type="checkbox" checked={!!x} onChange={(e) => set(f.id, e.target.checked)} />
          <span className="dot" />{f.l}
        </label>
      )}
      {f.k === 'photo' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12 }}>
          {[['รูปที่ 1 ภายนอกที่พักอาศัย', 'ให้เห็นหลังคาและฝาบ้าน'], ['รูปที่ 2 ภายในที่พักอาศัย', 'ให้เห็นพื้นบ้านและภายในบริเวณบ้าน']].map(([t, d]) => (
            <div key={t} style={{ aspectRatio: '4/3', border: '1px dashed var(--color-neutral-400)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, color: 'var(--color-neutral-700)', fontSize: 13, textAlign: 'center', padding: 8 }}>
              <span>{t}</span>
              <span className="text-muted" style={{ fontSize: 11 }}>{d} · เก็บรูปไว้ในระบบ DMC ไม่อัปโหลดที่นี่</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function Visit() {
  const { students: st, route, go, updateStudent, toast } = useStore();
  const mob = useIsMobile();
  const load = (sid: string): VisitDraft => {
    const s = st.find((x) => x.id === sid);
    return { sid, sec: 0, vf: s?.visit ? { ...s.visit.v } : vDefaults() };
  };
  const [draft, setDraft] = useMemoryState<VisitDraft | null>('visit.draft', null);
  const want = route.params.sid;
  useEffect(() => {
    if (!st.length) return;
    if (want && st.some((s) => s.id === want) && draft?.sid !== want) setDraft(load(want));
    else if (!draft || !st.some((s) => s.id === draft.sid)) setDraft(load(st[0].id));
  }, [want, st.length]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!st.length) return <EmptyBox title="ยังไม่มีรายชื่อนักเรียน" sub="เพิ่มรายชื่อได้ที่เมนู ข้อมูลและสำรอง" action={<PrimaryButton onClick={() => go('data')}>ไปที่ข้อมูลและสำรอง</PrimaryButton>} />;
  if (!draft) return null;

  const vs = st.find((s) => s.id === draft.sid) || st[0];
  const sec = VF[draft.sec];
  const vf = draft.vf;
  const set = (id: string, val: VisitValues[string]) =>
    setDraft((d) => d && { ...d, vf: { ...d.vf, [id]: val, ...(id === 'wt' || id === 'ht' ? { nut: '' } : {}) } });
  const toSec = (i: number) => { setDraft((d) => d && { ...d, sec: i }); window.scrollTo(0, 0); };
  const visitDone = st.filter((s) => s.visit).length;

  const save = () => {
    updateStudent(vs.id, (x) => ({ ...x, visit: { date: shortDate(), v: { ...vf } } }));
    setDraft(null);
    go('profile', { sid: vs.id, tab: 'visit' });
    toast('บันทึกการเยี่ยมบ้านของ ' + vs.fn + ' แล้ว');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 920 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 320px', minWidth: 0 }}>
          <h2 style={{ margin: '0 0 2px' }}>บันทึกการเยี่ยมบ้าน</h2>
          <div className="text-muted" style={{ fontSize: 14 }}>แบบเก็บข้อมูลการรู้จักนักเรียนรายบุคคล · เยี่ยมแล้ว {visitDone} จาก {st.length} คน</div>
        </div>
        <div className="field" style={{ flex: '0 1 340px', minWidth: 260 }}>
          <label htmlFor="v-sid">นักเรียน</label>
          <select id="v-sid" className="input" value={vs.id} onChange={(e) => setDraft(load(e.target.value))}>
            {st.map((s) => <option key={s.id} value={s.id}>{s.no}. {fullName(s)}{s.visit ? ' (เยี่ยมแล้ว)' : ''}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', border: '1px solid var(--color-divider)' }}>
        {VF.map((s, i) => {
          const a = i === draft.sec;
          const done = i < draft.sec;
          return (
            <button key={s.t} type="button" aria-current={a ? 'step' : undefined} onClick={() => toSec(i)} style={{
              display: 'flex', flexDirection: mob ? 'column' : 'row', alignItems: mob ? 'flex-start' : 'center', gap: mob ? 2 : 10,
              padding: mob ? '8px 8px' : '12px 14px', border: 'none', borderLeft: i ? '1px solid var(--color-divider)' : 'none',
              background: a ? 'var(--color-accent)' : done ? 'var(--color-accent-100)' : 'transparent',
              color: a ? 'var(--color-neutral-100)' : 'var(--color-text)', cursor: 'pointer', textAlign: 'left', minHeight: 52,
            }}>
              <span className="hnum" style={{ fontSize: 20, lineHeight: 1 }}>{i + 1}</span>
              <span style={{ fontSize: mob ? 10.5 : 13, lineHeight: 1.25 }}>{s.t}</span>
            </button>
          );
        })}
      </div>

      <Card style={{ padding: '20px 22px', gap: 18 }}>
        <div>
          <div className="card-kicker">ตอนที่ {draft.sec + 1} จาก 4</div>
          <h3 style={{ margin: '2px 0 2px' }}>{sec.t}</h3>
          <div className="text-muted" style={{ fontSize: 12, display: 'flex', gap: 6, alignItems: 'center' }}><Icon name="lock" size={13} />{sec.d}</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,260px),1fr))', gap: '18px 20px' }}>
          {sec.f.map((f) => <Field key={f.id} f={f} vf={vf} set={set} />)}
        </div>
      </Card>

      {draft.sec === 3 && <RiskCard risk={riskOf(vf)} />}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <button type="button" className="btn btn-secondary" disabled={draft.sec === 0} onClick={() => toSec(Math.max(0, draft.sec - 1))}><Icon name="back" />ย้อนกลับ</button>
        <span style={{ flex: 1 }} />
        {draft.sec < 3
          ? <PrimaryButton onClick={() => toSec(draft.sec + 1)}>ถัดไป<Icon name="chev" /></PrimaryButton>
          : <PrimaryButton disabled={!vf.consent} icon={<Icon name="check" />} onClick={save}>บันทึกการเยี่ยมบ้าน</PrimaryButton>}
      </div>
    </div>
  );
}
