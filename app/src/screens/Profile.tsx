import { SCHOOL, TEACHER } from '../config';
import { AK, AKN, ASR, G, gOf, proG, SUBS, subG, totG, type Group } from '../domain/sdq';
import type { HelpRecord } from '../domain/students';
import { FBY, RF, riskOf, valText, VF, type Risk } from '../domain/visit';
import { Icon } from '../components/Icon';
import { Card, DOT, EmptyBox, GroupTag, KV, PEND, PrimaryButton, TAG } from '../components/ui';
import { useStore } from '../state/store';
import { ageText, view } from './common';

const TABS: [string, string][] = [['overview', 'ภาพรวม'], ['sdq', 'ผล SDQ'], ['visit', 'เยี่ยมบ้าน'], ['help', 'การช่วยเหลือ']];

export function RiskCard({ risk }: { risk: Risk }) {
  return (
    <Card style={{ padding: '16px 18px', gap: 12, gridColumn: '1 / -1' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div className="card-title" style={{ flex: 1 }}>ผลประเมินปัจจัยเสี่ยงจากการเยี่ยมบ้าน</div>
        <span className="hnum" style={{ fontSize: 28, lineHeight: 1 }}>{risk.score}<span className="text-muted" style={{ fontSize: 13 }}> คะแนน</span></span>
        <GroupTag c={risk.g} />
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {RF.map(([k, name, pts]) => (
          <span key={k} className="tag" style={risk.on[k]
            ? { background: 'var(--color-accent)', color: 'var(--color-neutral-100)' }
            : { boxShadow: 'inset 0 0 0 1px var(--color-divider)', color: 'var(--color-neutral-600)' }}>
            {name} ({pts})
          </span>
        ))}
      </div>
      <div className="text-muted" style={{ fontSize: 11 }}>ปกติ 0–2 · เสี่ยง 3–5 · มีปัญหา 6 ขึ้นไป · ตามเกณฑ์คัดกรองในไฟล์ข้อมูลนักเรียน</div>
    </Card>
  );
}

export function HelpTimeline({ records, emptyText = 'ยังไม่มีบันทึกการช่วยเหลือ' }: { records: HelpRecord[]; emptyText?: string }) {
  const list = [...records].reverse();
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {list.map((h, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '16px 1fr', gap: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ width: 9, height: 9, marginTop: 6, background: 'var(--color-accent)', flex: 'none' }} />
            <span style={{ flex: 1, width: 1, background: 'var(--color-divider)' }} />
          </div>
          <div style={{ paddingBottom: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }}>
              <span className="hnum" style={{ fontSize: 17 }}>{h.method}</span>
              <span className="text-muted" style={{ fontSize: 12 }}>{h.date}</span>
            </div>
            <div style={{ fontSize: 14, whiteSpace: 'pre-wrap' }}>{h.note}</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <span className="tag tag-neutral">{h.areas}</span>
              <span className="tag tag-accent">ผล: {h.result}</span>
              <span className="tag tag-outline">{h.refer}</span>
            </div>
          </div>
        </div>
      ))}
      {!list.length && <div className="text-muted" style={{ fontSize: 14, padding: '12px 0' }}>{emptyText}</div>}
    </div>
  );
}

export function Profile() {
  const { students: st, route, go } = useStore();
  const ps = st.find((s) => s.id === route.params.sid) || st[0];
  if (!ps) return <EmptyBox title="ยังไม่มีรายชื่อนักเรียน" />;
  const tab = TABS.some((t) => t[0] === route.params.tab) ? route.params.tab : 'overview';
  const v = view(ps);
  const pv = ps.visit;
  const pr = pv ? riskOf(pv.v) : null;
  const vt = (id: string) => (pv ? valText(FBY[id], pv.v) : 'ยังไม่เยี่ยมบ้าน');

  const pInfo: [string, string][] = [
    ['ชั้น/เลขที่', `${SCHOOL.grade} เลขที่ ${ps.no}`],
    ['ผู้ปกครอง', vt('gd')],
    ['พักอาศัยอยู่กับ', vt('live')],
    ['การเดินทาง', vt('trans')],
    ['ผลการเรียนเฉลี่ย', ps.gpa],
    ['การมาเรียน', ps.att],
  ];
  const pAreas: [string, Group | 'pend'][] = [
    ['ด้านครอบครัวและความเป็นอยู่ (เยี่ยมบ้าน)', pr ? pr.g : 'pend'],
    ['ด้านพฤติกรรม/อารมณ์ (SDQ ครูประเมิน)', ps.sdq ? totG(ps.sdq.total) : 'pend'],
  ];
  const pSubs = ps.sdq
    ? [...SUBS.map((b) => ({ name: b.n, v: ps.sdq![b.k], g: subG(ps.sdq![b.k], b.c) })),
      { name: 'ด้านสัมพันธภาพทางสังคม (จุดแข็ง)', v: ps.sdq.pro, g: proG(ps.sdq.pro) }]
    : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <button type="button" className="btn btn-ghost" style={{ alignSelf: 'flex-start' }} onClick={() => go('list')}><Icon name="back" />รายชื่อนักเรียน</button>
      <div style={{ display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap' }}>
        <div className="blueprint hnum" style={{ width: 72, height: 72, flex: 'none', display: 'grid', placeItems: 'center', fontSize: 30 }}>
          <i className="corner tl" /><i className="corner tr" /><i className="corner bl" /><i className="corner br" />{ps.no}
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}><h2 style={{ margin: 0 }}>{v.name}</h2><GroupTag c={v.c} /></div>
          <div className="text-muted" style={{ fontSize: 13 }}>{SCHOOL.grade} เลขที่ {ps.no} · อายุ {ageText(ps)}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-secondary" onClick={() => go('sdq', { mode: 'form', sid: ps.id })}><Icon name="clip" />คัดกรอง SDQ</button>
          <button type="button" className="btn btn-secondary" onClick={() => go('visit', { sid: ps.id })}><Icon name="home" />เยี่ยมบ้าน</button>
          <PrimaryButton icon={<Icon name="plus" />} onClick={() => go('help', { sid: ps.id })}>บันทึกการช่วยเหลือ</PrimaryButton>
        </div>
      </div>
      <div role="tablist" style={{ display: 'flex', gap: 22, borderBottom: '1px solid var(--color-divider)', overflowX: 'auto' }}>
        {TABS.map(([k, l]) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => go('profile', { sid: ps.id, tab: k }, { replace: true })} style={{
            border: 'none', background: 'transparent', padding: '8px 0', fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap',
            color: tab === k ? 'var(--color-accent-700)' : 'var(--color-text)', fontWeight: tab === k ? 500 : 400,
            boxShadow: tab === k ? 'inset 0 -2px 0 var(--color-accent)' : 'none',
          }}>{l}</button>
        ))}
      </div>

      {tab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,320px),1fr))', gap: 20, alignItems: 'start' }}>
          <Card style={{ padding: '16px 18px', gap: 0 }}>
            <div className="card-title" style={{ marginBottom: 8 }}>ข้อมูลทั่วไป</div>
            {pInfo.map(([k, val]) => <KV key={k} k={k} v={val} />)}
          </Card>
          <Card style={{ padding: '16px 18px', gap: 0 }}>
            <div className="card-title" style={{ marginBottom: 8 }}>ผลการคัดกรองรายด้าน</div>
            {pAreas.map(([name, g]) => (
              <div key={name} className="line-top" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', fontSize: 14 }}>
                <span style={{ flex: 1 }}>{name}</span><GroupTag c={g} />
              </div>
            ))}
          </Card>
        </div>
      )}

      {tab === 'sdq' && (ps.sdq || Object.keys(ps.sdq3).length ? (
        <>
          {ps.sdq ? (
            <Card style={{ padding: '18px 20px', gap: 14, maxWidth: 720 }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ flex: 1 }}>
                  <div className="card-kicker">คะแนนรวมปัญหา · ประเมินเมื่อ {ps.sdq.date}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span className="hnum" style={{ fontSize: 52, lineHeight: 1 }}>{ps.sdq.total}</span><span className="text-muted">/ 40</span>
                  </div>
                </div>
                <GroupTag c={totG(ps.sdq.total)} />
              </div>
              {pSubs.map((b) => (
                <div key={b.name} style={{ display: 'grid', gridTemplateColumns: 'minmax(140px,1.2fr) minmax(80px,2fr) 32px 78px', gap: 12, alignItems: 'center', fontSize: 14 }}>
                  <span>{b.name}</span>
                  <div style={{ height: 6, background: 'var(--color-neutral-200)' }}><div style={{ width: b.v * 10 + '%', height: '100%', background: DOT[b.g] }} /></div>
                  <span style={{ textAlign: 'right', fontWeight: 500 }}>{b.v}</span>
                  <span className="tag" style={TAG[b.g]}>{G[b.g]}</span>
                </div>
              ))}
            </Card>
          ) : (
            <EmptyBox title="ครูยังไม่ได้ประเมิน SDQ" sub="ผลของครูใช้จัดกลุ่มนักเรียน ด้านล่างเป็นผลจากผู้ประเมินอื่น"
              action={<PrimaryButton onClick={() => go('sdq', { mode: 'form', sid: ps.id })}>เริ่มคัดกรอง</PrimaryButton>} />
          )}
          <Card style={{ padding: '18px 20px', gap: 14, maxWidth: 720 }}>
            <div className="card-title">เปรียบเทียบ 3 ผู้ประเมิน</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,300px),1fr))', gap: '18px 24px' }}>
              {AK.map((k) => (
                <div key={k} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{AKN[k]}</div>
                  {ASR.map(([a, , short]) => {
                    const x = ps.sdq3[a];
                    const val = x ? x[k] : null;
                    const g = x && val != null ? gOf(a, k, val) : null;
                    return (
                      <div key={a} style={{ display: 'grid', gridTemplateColumns: '64px 1fr 24px 62px', gap: 8, alignItems: 'center', fontSize: 12 }}>
                        <span className="text-muted">{short}</span>
                        <div style={{ height: 8, background: 'var(--color-neutral-200)' }}>
                          <div style={{ width: ((val || 0) / (k === 'total' ? 40 : 10)) * 100 + '%', height: '100%', background: g == null ? 'transparent' : DOT[g] }} />
                        </div>
                        <span style={{ textAlign: 'right', fontWeight: 500 }}>{val ?? '—'}</span>
                        <span className="tag" style={g == null ? PEND : TAG[g]}>{g == null ? '—' : G[g]}</span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </Card>
        </>
      ) : (
        <EmptyBox title="ยังไม่ได้คัดกรอง SDQ" sub="ประเมินพฤติกรรม 25 ข้อ ใช้เวลาประมาณ 5 นาที"
          action={<PrimaryButton onClick={() => go('sdq', { mode: 'form', sid: ps.id })}>เริ่มคัดกรอง</PrimaryButton>} />
      ))}

      {tab === 'visit' && (pv ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 880 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
            <span className="text-muted" style={{ fontSize: 13, flex: 1 }}>เยี่ยมบ้านเมื่อ {pv.date} · {TEACHER.fullName}</span>
            <button type="button" className="btn btn-secondary" onClick={() => go('visit', { sid: ps.id })}>แก้ไขบันทึก</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,360px),1fr))', gap: 20, alignItems: 'start' }}>
            {pr && <RiskCard risk={pr} />}
            {VF.map((s, i) => {
              const rows = s.f.filter((f) => f.k !== 'photo' && f.k !== 'check').map((f) => ({ k: f.l, v: valText(f, pv.v) })).filter((r) => r.v !== '—');
              return (
                <Card key={s.t} style={{ padding: '16px 18px', gap: 0 }}>
                  <div className="card-kicker">ตอนที่ {i + 1}</div>
                  <div className="card-title" style={{ marginBottom: 8 }}>{s.t}</div>
                  {rows.map((r) => <KV key={r.k} k={r.k} v={r.v} kw={150} pad="7px 0" />)}
                  {!rows.length && <div className="text-muted line-top" style={{ fontSize: 13, padding: '7px 0' }}>ไม่มีข้อมูล</div>}
                </Card>
              );
            })}
          </div>
        </div>
      ) : (
        <EmptyBox title="ยังไม่มีบันทึกการเยี่ยมบ้าน" action={<PrimaryButton onClick={() => go('visit', { sid: ps.id })}>บันทึกการเยี่ยมบ้าน</PrimaryButton>} />
      ))}

      {tab === 'help' && <div style={{ maxWidth: 720 }}><HelpTimeline records={ps.helps} /></div>}
    </div>
  );
}
