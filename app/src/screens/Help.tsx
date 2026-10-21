import { useState } from 'react';
import { shortDate } from '../domain/dates';
import { EXTERNAL, HAREAS, INTERNAL, METHODS, REFER, RESULTS } from '../domain/help';
import { groupOf } from '../domain/students';
import { Icon } from '../components/Icon';
import { Card, Chip, EmptyBox, GroupTag, PrimaryButton, ScrollX, Seg } from '../components/ui';
import { useStore } from '../state/store';
import { view } from './common';
import { HelpTimeline } from './Profile';

const blank = { areas: [] as string[], method: 0, note: '', result: 0, refer: 0, agency: 0 };

export function Help() {
  const { students: st, route, go, updateStudent, toast } = useStore();
  const [form, setForm] = useState(blank);
  const atRisk = st.filter((s) => groupOf(s) >= 1);
  const caseList = st.filter((s) => groupOf(s) >= 1 || s.helps.length).sort((a, b) => groupOf(b) - groupOf(a) || a.no - b.no);
  const hs = st.find((s) => s.id === route.params.sid) || caseList[0] || st[0];
  if (!hs) return <EmptyBox title="ยังไม่มีรายชื่อนักเรียน" />;
  const hv = view(hs);
  const agList = form.refer === 1 ? INTERNAL : EXTERNAL;
  // A student opened from a profile may not be in the case list yet; show them at the top.
  const list = caseList.some((s) => s.id === hs.id) ? caseList : [hs, ...caseList];

  const save = () => {
    const rec = {
      date: shortDate(), areas: form.areas.join(', ') || 'ทั่วไป', method: METHODS[form.method], note: form.note.trim() || '—',
      result: RESULTS[form.result], refer: form.refer === 0 ? 'ไม่ส่งต่อ' : `${REFER[form.refer]} · ${agList[form.agency]}`,
    };
    updateStudent(hs.id, (x) => ({ ...x, helps: [...x.helps, rec] }));
    setForm(blank);
    toast('บันทึกการช่วยเหลือ ' + hs.fn + ' แล้ว');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <h2 style={{ margin: '0 0 2px' }}>การช่วยเหลือและส่งต่อ</h2>
        <div className="text-muted" style={{ fontSize: 14 }}>นักเรียนกลุ่มเสี่ยงและมีปัญหา {atRisk.length} คน</div>
      </div>
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div style={{ flex: '1 1 260px', minWidth: 0, display: 'flex', flexDirection: 'column', borderTop: '1px solid var(--color-divider)' }}>
          {list.map((s) => {
            const v = view(s);
            const on = s.id === hs.id;
            return (
              <button key={s.id} type="button" className={'plain line-bottom' + (on ? '' : ' hover-text')} aria-current={on || undefined}
                onClick={() => { go('help', { sid: s.id }, { replace: true }); setForm(blank); }}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 8px', width: '100%', ...(on ? { background: 'var(--color-accent-100)' } : {}) }}>
                <span className="hnum" style={{ width: 26, flex: 'none', fontSize: 17, color: 'var(--color-neutral-600)' }}>{s.no}</span>
                <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', lineHeight: 1.35 }}>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{v.name}</span>
                  <span className="text-muted" style={{ fontSize: 12 }}>{v.statusText}</span>
                </span>
                <GroupTag c={v.c} />
              </button>
            );
          })}
        </div>
        <div style={{ flex: '2 1 420px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h3 style={{ margin: 0 }}>{hv.name}</h3><GroupTag c={hv.c} />
            <button type="button" className="btn btn-ghost" style={{ marginLeft: 'auto' }} onClick={() => go('profile', { sid: hs.id })}>ดูโปรไฟล์</button>
          </div>
          <div className="text-muted" style={{ fontSize: 13, marginTop: -10 }}>{hv.reason}</div>
          <HelpTimeline records={hs.helps} />
          <Card style={{ padding: '16px 18px', gap: 14 }}>
            <div className="card-title">เพิ่มบันทึกการช่วยเหลือ</div>
            <div className="field">
              <label>ด้านที่ช่วยเหลือ</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {HAREAS.map((l) => {
                  const on = form.areas.includes(l);
                  return <Chip key={l} on={on} onClick={() => setForm((f) => ({ ...f, areas: on ? f.areas.filter((x) => x !== l) : [...f.areas, l] }))}>{l}</Chip>;
                })}
              </div>
            </div>
            <div className="field">
              <label htmlFor="h-method">วิธีการช่วยเหลือ</label>
              <select id="h-method" className="input" value={form.method} onChange={(e) => setForm((f) => ({ ...f, method: +e.target.value }))}>
                {METHODS.map((l, i) => <option key={l} value={i}>{l}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="h-note">รายละเอียด</label>
              <textarea id="h-note" className="input" placeholder="สิ่งที่ทำ ผู้ที่เกี่ยวข้อง และข้อตกลงกับนักเรียน" value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} />
            </div>
            <div className="field">
              <label>ผลการช่วยเหลือ</label>
              <Seg name="hres" value={form.result} onChange={(v) => setForm((f) => ({ ...f, result: v }))} options={RESULTS.map((l, i) => ({ value: i, label: l }))} />
            </div>
            <div className="field">
              <label>การส่งต่อ</label>
              <ScrollX><Seg name="href" value={form.refer} onChange={(v) => setForm((f) => ({ ...f, refer: v, agency: 0 }))} options={REFER.map((l, i) => ({ value: i, label: l }))} /></ScrollX>
            </div>
            {form.refer > 0 && (
              <div className="field">
                <label htmlFor="h-agency">ส่งต่อไปยัง</label>
                <select id="h-agency" className="input" value={form.agency} onChange={(e) => setForm((f) => ({ ...f, agency: +e.target.value }))}>
                  {agList.map((l, i) => <option key={l} value={i}>{l}</option>)}
                </select>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <PrimaryButton icon={<Icon name="check" />} onClick={save}>บันทึก</PrimaryButton>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
