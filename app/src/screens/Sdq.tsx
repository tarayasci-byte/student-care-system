import { useEffect, useState } from 'react';
import { shortDate } from '../domain/dates';
import { AK, AKN, ASR, asrLabel, cutText, G, gOf, scoreAns, SEVERITY, type Assessor, type SdqRecord } from '../domain/sdq';
import { fullName } from '../domain/students';
import { Icon } from '../components/Icon';
import { useIsMobile } from '../components/Shell';
import { Card, EmptyBox, Legend3, PEND, PrimaryButton, ScrollX, Seg, Seg3Chart, TAG } from '../components/ui';
import { useMemoryState } from '../state/memory';
import { useStore } from '../state/store';
import { cleanImpact, emptyDraft, ImpactFields, SdqList, SdqStepCard, type SdqDraft } from './SdqParts';

function CodesCard() {
  const { students: st, mode } = useStore();
  const [show, setShow] = useState(false);
  return (
    <Card style={{ padding: '18px 20px', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
        <div className="card-title" style={{ flex: 1 }}>รหัสเข้าใช้งานสำหรับนักเรียนและผู้ปกครอง</div>
        <button type="button" className="btn btn-secondary" onClick={() => setShow((s) => !s)}>{show ? 'ซ่อนรหัส' : 'แสดงรหัส'}</button>
      </div>
      <div className="text-muted" style={{ fontSize: 12 }}>
        แจกรหัสให้นักเรียนหรือผู้ปกครองเพื่อเข้าทำแบบประเมิน SDQ ฉบับของตนเอง รหัสหนึ่งผูกกับนักเรียนหนึ่งคน
        {mode === 'sheets'
          ? ' · รหัสใหม่ลงทะเบียนใน Google Sheets อัตโนมัติเมื่อระบบบันทึกข้อมูล'
          : ' · ตอนนี้ข้อมูลอยู่ในเครื่องนี้เท่านั้น นักเรียนและผู้ปกครองต้องทำแบบประเมินบนเครื่องนี้ หากต้องการให้ทำจากโทรศัพท์ของตนเอง ให้เชื่อมต่อ Google Sheets ในเมนูข้อมูลและสำรอง'}
      </div>
      {show && (
        <div style={{ overflowX: 'auto' }}>
          <div style={{ minWidth: 600, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '28px minmax(150px,1fr) 100px 110px 100px 110px', gap: 8, padding: '6px 0', fontSize: 11, color: 'var(--color-neutral-700)', borderBottom: '1px solid var(--color-divider)' }}>
              <span /><span>นักเรียน</span><span>รหัสนักเรียน</span><span>สถานะ</span><span>รหัสผู้ปกครอง</span><span>สถานะ</span>
            </div>
            {st.map((s) => (
              <div key={s.id} className="line-bottom" style={{ display: 'grid', gridTemplateColumns: '28px minmax(150px,1fr) 100px 110px 100px 110px', gap: 8, padding: '7px 0', fontSize: 13, alignItems: 'center' }}>
                <span style={{ color: 'var(--color-neutral-600)' }}>{s.no}</span>
                <span>{fullName(s)}</span>
                <span className="mono">{s.sc}</span>
                <span className="text-muted" style={{ fontSize: 12 }}>{s.sdq3.s ? 'ส่งแล้ว ' + s.sdq3.s.date : 'ยังไม่ส่ง'}</span>
                <span className="mono">{s.pc}</span>
                <span className="text-muted" style={{ fontSize: 12 }}>{s.sdq3.p ? 'ส่งแล้ว ' + s.sdq3.p.date : 'ยังไม่ส่ง'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

function Results({ asr }: { asr: Assessor }) {
  const { students: st, go } = useStore();
  const done = st.filter((s) => s.sdq3[asr]);
  const classRows = AK.map((k) => ({ name: AKN[k], counts: [0, 1, 2].map((g) => done.filter((s) => gOf(asr, k, s.sdq3[asr]![k]) === g).length) }));
  const cell = (g: number | null) => ({ ...(g == null ? PEND : TAG[g]), display: 'grid', placeItems: 'center', height: 30, fontSize: 13, fontWeight: 500 });
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,360px),1fr))', gap: 20, alignItems: 'start' }}>
        <Card style={{ padding: '18px 20px', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
            <div className="card-title" style={{ flex: 1 }}>ผลรายด้านทั้งห้อง</div>
            <span className="text-muted" style={{ fontSize: 12 }}>{asrLabel(asr)} · {done.length} คน</span>
          </div>
          <Legend3 />
          <Seg3Chart rows={classRows} labelCol="minmax(110px,170px)" noteCol="28px" />
          <div className="text-muted" style={{ fontSize: 11 }}>ตัวเลขด้านขวา = จำนวนนักเรียนกลุ่มเสี่ยงและมีปัญหา</div>
        </Card>
        <Card style={{ padding: '18px 20px', gap: 8 }}>
          <div className="card-title" style={{ marginBottom: 4 }}>คะแนนรายบุคคล</div>
          <div style={{ overflowX: 'auto' }}>
            <div style={{ minWidth: 380, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '24px minmax(120px,1fr) repeat(6,42px)', gap: 4, fontSize: 11, color: 'var(--color-neutral-700)', textAlign: 'center' }}>
                <span /><span style={{ textAlign: 'left' }}>นักเรียน</span><span>อารมณ์</span><span>เกเร</span><span>สมาธิ</span><span>เพื่อน</span><span>สังคม</span><span>รวม</span>
              </div>
              {st.map((s) => {
                const x = s.sdq3[asr];
                return (
                  <button key={s.id} type="button" className="plain hover-text" onClick={() => go('profile', { sid: s.id, tab: 'sdq' })}
                    style={{ display: 'grid', gridTemplateColumns: '24px minmax(120px,1fr) repeat(6,42px)', gap: 4, alignItems: 'center' }}>
                    <span className="hnum" style={{ color: 'var(--color-neutral-600)' }}>{s.no}</span>
                    <span style={{ fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{fullName(s)}</span>
                    {AK.map((k) => <span key={k} style={cell(x ? gOf(asr, k, x[k]) : null)}>{x ? x[k] : '—'}</span>)}
                  </button>
                );
              })}
            </div>
          </div>
        </Card>
      </div>
      <CodesCard />
    </>
  );
}

function Form({ asr, initialSid }: { asr: Assessor; initialSid?: string }) {
  const { students: st, updateStudent, go, toast } = useStore();
  const mob = useIsMobile();
  const first = st.find((s) => s.id === initialSid)?.id ?? st[0].id;
  const [draft, setDraftRaw] = useMemoryState<SdqDraft>('sdq.draft', () => emptyDraft(first));
  const setDraft = (fn: (d: SdqDraft) => SdqDraft) => setDraftRaw(fn);
  // Opening the form for a specific student (from a profile) starts a fresh draft for them.
  useEffect(() => {
    if (initialSid && initialSid !== draft.sid && st.some((s) => s.id === initialSid)) setDraftRaw(emptyDraft(initialSid));
    else if (!st.some((s) => s.id === draft.sid)) setDraftRaw(emptyDraft(st[0].id));
  }, [initialSid]); // eslint-disable-line react-hooks/exhaustive-deps

  const student = st.find((s) => s.id === draft.sid) || st[0];
  const sc = scoreAns(draft.ans);
  const answered = draft.ans.filter((v) => v != null).length;
  const full = answered === 25;
  const tg = gOf(asr, 'total', sc.total);

  const save = () => {
    const rec: SdqRecord = { ...sc, ans: draft.ans as number[], imp: cleanImpact(draft.imp), date: shortDate(), ...(asr === 't' ? { hrs: draft.hrs } : {}) };
    updateStudent(student.id, (x) => ({ ...x, sdq3: { ...x.sdq3, [asr]: rec }, sdq: asr === 't' ? rec : x.sdq }));
    setDraftRaw(emptyDraft(student.id));
    go('profile', { sid: student.id, tab: 'sdq' });
    toast('บันทึกผล SDQ ของ ' + student.fn + ' แล้ว');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div className="text-muted" style={{ fontSize: 13 }}>{asrLabel(asr)} · 25 ข้อ · พฤติกรรมในรอบ 6 เดือนที่ผ่านมา · ใช้เกณฑ์ตัดคะแนนของผู้ประเมินที่เลือก</div>
      <div className="field" style={{ maxWidth: 420 }}>
        <label htmlFor="sdq-sid">นักเรียนที่ประเมิน</label>
        <select id="sdq-sid" className="input" value={student.id} onChange={(e) => setDraftRaw(emptyDraft(e.target.value))}>
          {st.map((s) => <option key={s.id} value={s.id}>{s.no}. {fullName(s)}{s.sdq3[asr] ? ' (ประเมินแล้ว)' : ''}</option>)}
        </select>
      </div>
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div style={{ flex: '2 1 460px', minWidth: 0 }}>
          {mob ? <SdqStepCard asr={asr} draft={draft} setDraft={setDraft} showSub /> : <SdqList asr={asr} draft={draft} setDraft={setDraft} />}
          <Card style={{ padding: '18px 20px', gap: 14, marginTop: 24 }}>
            <div><div className="card-kicker">หน้า 2 ของแบบประเมิน</div><div className="card-title">ผลกระทบและระดับความรุนแรงของปัญหา</div></div>
            <ImpactFields asr={asr} draft={draft} setDraft={setDraft} />
            {asr === 't' && (
              <div className="field" style={{ maxWidth: 280 }}>
                <label htmlFor="sdq-hrs">ในแต่ละสัปดาห์ เด็กอยู่กับคุณโดยเฉลี่ย (ชั่วโมง)</label>
                <input id="sdq-hrs" className="input" type="number" min={0} max={168} value={draft.hrs} placeholder="เช่น 25" onChange={(e) => setDraft((d) => ({ ...d, hrs: e.target.value }))} />
              </div>
            )}
          </Card>
        </div>
        <div style={{ flex: '1 1 280px', minWidth: 0, position: 'sticky', top: 20 }}>
          <Card style={{ padding: '16px 18px', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'baseline' }}>
              <div className="card-title" style={{ flex: 1 }}>ผลการประเมิน</div>
              <span className="text-muted" style={{ fontSize: 12 }}>ตอบแล้ว {answered}/25</span>
            </div>
            <div style={{ height: 4, background: 'var(--color-neutral-200)' }}><div style={{ width: (answered / 25) * 100 + '%', height: '100%', background: 'var(--color-accent)' }} /></div>
            {(['emo', 'con', 'hyp', 'peer', 'pro'] as const).map((k) => {
              const g = gOf(asr, k, sc[k]);
              return (
                <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                  <span style={{ flex: 1 }}>{AKN[k]}</span><span style={{ fontWeight: 500 }}>{sc[k]}</span>
                  <span className="tag" style={full ? TAG[g] : PEND}>{full ? G[g] : '—'}</span>
                </div>
              );
            })}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 10, borderTop: '1px solid var(--color-divider)' }}>
              <div style={{ flex: 1 }}>
                <div className="text-muted" style={{ fontSize: 12 }}>คะแนนรวมปัญหา</div>
                <div className="hnum" style={{ fontSize: 36, lineHeight: 1 }}>{sc.total}<span className="text-muted" style={{ fontSize: 14 }}> / 40</span></div>
              </div>
              <span className="tag" style={full ? TAG[tg] : PEND}>{full ? G[tg] : 'กำลังประเมิน'}</span>
            </div>
            <div className="text-muted" style={{ fontSize: 11, lineHeight: 1.4 }}>{cutText(asr)}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
              <span style={{ flex: 1 }}>ระดับความรุนแรง (หน้า 2)</span><span className="tag tag-neutral">{SEVERITY[draft.imp.overall || 0]}</span>
            </div>
            <PrimaryButton className="btn-block" disabled={!full} icon={<Icon name="check" />} onClick={save}>บันทึกผลการคัดกรอง</PrimaryButton>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <button type="button" className="btn btn-ghost" onClick={() => setDraftRaw(emptyDraft(student.id))}>ล้างคำตอบ</button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export function Sdq() {
  const { students: st, route, go } = useStore();
  const [asr, setAsr] = useMemoryState<Assessor>('sdq.asr', 't');
  const mode = route.params.mode === 'form' ? 'form' : 'result';
  const dates = [...new Set(st.map((s) => s.sdq?.date).filter(Boolean))];
  if (!st.length) return <EmptyBox title="ยังไม่มีรายชื่อนักเรียน" sub="เพิ่มรายชื่อได้ที่เมนู ข้อมูลและสำรอง" action={<PrimaryButton onClick={() => go('data')}>ไปที่ข้อมูลและสำรอง</PrimaryButton>} />;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <h2 style={{ margin: '0 0 2px' }}>แบบประเมินจุดแข็งและจุดอ่อน SDQ</h2>
          <div className="text-muted" style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {dates.length ? `ครูประเมินล่าสุด ${dates[dates.length - 1]} · ` : ''}3 ผู้ประเมิน · คัดกรองแล้ว {st.filter((s) => s.sdq).length} จาก {st.length} คน
          </div>
        </div>
        <Seg name="sdqmode" value={mode} onChange={(m) => go('sdq', { mode: m === 'form' ? 'form' : undefined, sid: route.params.sid }, { replace: true })}
          options={[{ value: 'result', label: 'ผลการประเมิน' }, { value: 'form', label: 'ทำแบบประเมิน' }]} />
      </div>
      <ScrollX>
        <Seg name="asr" value={asr} onChange={setAsr} options={ASR.map(([k, l]) => ({ value: k, label: l }))} />
      </ScrollX>
      {mode === 'result' ? <Results asr={asr} /> : <Form asr={asr} initialSid={route.params.sid} />}
    </div>
  );
}

