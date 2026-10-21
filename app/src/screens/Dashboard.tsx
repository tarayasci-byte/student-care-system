import { TEACHER, SCHOOL } from '../config';
import { longDate } from '../domain/dates';
import { proG, SUBS, subG, totG, type Group } from '../domain/sdq';
import { cat, groupOf, type Cat, type Student } from '../domain/students';
import { riskOf } from '../domain/visit';
import { Icon } from '../components/Icon';
import { useIsMobile } from '../components/Shell';
import { Card, catColor, catLabel, Donut, Dot, GroupTag, Legend3, PrimaryButton, pct, Ring, Seg3Chart, type Seg3Row } from '../components/ui';
import { useStore } from '../state/store';
import { view } from './common';

export const CATS: Cat[] = [0, 1, 2, 'pend'];

const count3 = (list: Student[], fn: (s: Student) => Group) => [0, 1, 2].map((g) => list.filter((s) => fn(s) === g).length);

/** Shared by the dashboard and the report. */
export function useClassStats() {
  const { students: st } = useStore();
  const N = st.length;
  const cats = CATS.map((k) => st.filter((s) => cat(s) === k).length);
  const scr = st.filter((s) => s.sdq);
  const vis = st.filter((s) => s.visit);
  const atRisk = st.filter((s) => groupOf(s) >= 1);
  const helped = atRisk.filter((s) => s.helps.length).length;
  const referred = atRisk.filter((s) => s.helps.some((h) => h.refer !== 'ไม่ส่งต่อ')).length;
  const areaBars: Seg3Row[] = [
    { name: 'เยี่ยมบ้าน (ปัจจัยเสี่ยง)', counts: count3(vis, (s) => riskOf(s.visit!.v).g) },
    { name: 'SDQ รวม (ครูประเมิน)', counts: count3(scr, (s) => totG(s.sdq!.total)) },
  ];
  const subBars: Seg3Row[] = [
    ...SUBS.map((b) => ({ name: b.n, counts: count3(scr, (s) => subG(s.sdq![b.k], b.c)) })),
    { name: 'ด้านสัมพันธภาพทางสังคม', counts: count3(scr, (s) => proG(s.sdq!.pro)) },
  ];
  return { st, N, cats, sdqDone: scr.length, visitDone: vis.length, atRisk, helped, referred, areaBars, subBars };
}

export function GroupDonutCard({ interactive }: { interactive: boolean }) {
  const { go } = useStore();
  const mob = useIsMobile();
  const { N, cats } = useClassStats();
  return (
    <Card style={{ padding: '18px 20px', gap: 16 }}>
      <div className="card-title">การจัดกลุ่มนักเรียน</div>
      <div style={{ display: 'flex', gap: 28, alignItems: 'center', flexWrap: 'wrap' }}>
        <Donut size={mob ? 150 : 176} total={N} parts={CATS.map((k, i) => ({ color: catColor(k), n: cats[i] }))} />
        <div style={{ flex: 1, minWidth: 150, display: 'flex', flexDirection: 'column', gap: interactive ? 0 : 10 }}>
          {CATS.map((k, i) => interactive ? (
            <button key={String(k)} type="button" className="plain hover-accent" onClick={() => go('list', { filter: k })}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 4px', borderBottom: '1px solid color-mix(in srgb, var(--color-text) 8%, transparent)' }}>
              <Dot c={k} /><span style={{ flex: 1, fontSize: 14 }}>{catLabel(k)}</span>
              <span className="hnum" style={{ fontSize: 22, lineHeight: 1 }}>{cats[i]}</span>
              <span className="text-muted" style={{ fontSize: 12, width: 34, textAlign: 'right' }}>{pct(cats[i], N)}</span>
            </button>
          ) : (
            <div key={String(k)} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14 }}>
              <Dot c={k} /><span style={{ flex: 1 }}>{catLabel(k)}</span>
              <span className="hnum" style={{ fontSize: 20 }}>{cats[i]}</span>
              <span className="text-muted" style={{ fontSize: 12, width: 34, textAlign: 'right' }}>{pct(cats[i], N)}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

export function Dashboard() {
  const { go } = useStore();
  const mob = useIsMobile();
  const { N, sdqDone, visitDone, atRisk, helped, areaBars, subBars } = useClassStats();
  const rings: [string, number, number, () => void][] = [
    ['คัดกรอง SDQ', sdqDone, N, () => go('sdq')],
    ['เยี่ยมบ้าน', visitDone, N, () => go('visit')],
    ['ได้รับการช่วยเหลือ', helped, atRisk.length, () => go('help')],
  ];
  const follow = atRisk.slice().sort((a, b) => groupOf(b) - groupOf(a) || (b.sdq?.total ?? 0) - (a.sdq?.total ?? 0)).slice(0, 5);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div className="card-kicker">{longDate()}</div>
          <h2 style={{ margin: '4px 0 2px' }}>สวัสดี {TEACHER.shortName}</h2>
          <div className="text-muted" style={{ fontSize: 14 }}>ภาพรวมนักเรียน{SCHOOL.grade} ทั้งหมด {N} คน</div>
        </div>
        <PrimaryButton icon={<Icon name="clip" />} onClick={() => go('sdq')}>ทำแบบคัดกรอง SDQ</PrimaryButton>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,340px),1fr))', gap: 20, alignItems: 'stretch' }}>
        <GroupDonutCard interactive />
        <Card style={{ padding: '18px 20px', gap: 16 }}>
          <div className="card-title">ความคืบหน้าการดำเนินงาน</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 12, flex: 1, alignContent: 'center' }}>
            {rings.map(([label, val, of, onClick]) => (
              <button key={label} type="button" className="plain" onClick={onClick} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: 4 }}>
                <Ring value={val} of={of} size={mob ? 80 : 96} />
                <div style={{ textAlign: 'center', lineHeight: 1.3 }}>
                  <div style={{ fontSize: 13 }}>{label}</div>
                  <div className="text-muted" style={{ fontSize: 12 }}>{val} / {of} คน</div>
                </div>
              </button>
            ))}
          </div>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,340px),1fr))', gap: 20, alignItems: 'start' }}>
        <Card style={{ padding: '18px 20px', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
            <div className="card-title" style={{ flex: 1 }}>ผลคัดกรองรายด้าน</div>
            <Legend3 />
          </div>
          <Seg3Chart rows={[...areaBars, ...subBars]} />
          <div className="text-muted" style={{ fontSize: 11 }}>ตัวเลขด้านขวา = จำนวนนักเรียนกลุ่มเสี่ยงและมีปัญหา</div>
        </Card>
        <Card style={{ padding: '18px 20px', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 6 }}>
            <div className="card-title" style={{ flex: 1 }}>ต้องติดตาม</div>
            <button type="button" className="btn btn-ghost" onClick={() => go('help')}>ดูทั้งหมด</button>
          </div>
          {follow.map((s) => {
            const v = view(s);
            return (
              <button key={s.id} type="button" className="plain hover-text line-top" onClick={() => go('profile', { sid: s.id })}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 4px' }}>
                <span className="hnum" style={{ width: 26, flex: 'none', fontSize: 18, color: 'var(--color-neutral-600)' }}>{s.no}</span>
                <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', lineHeight: 1.35 }}>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{v.name}</span>
                  <span className="text-muted" style={{ fontSize: 12 }}>{v.reason}</span>
                </span>
                <GroupTag c={v.c} />
              </button>
            );
          })}
          {!follow.length && <div className="text-muted" style={{ fontSize: 14, padding: '10px 4px' }}>ยังไม่มีนักเรียนกลุ่มเสี่ยงหรือมีปัญหา</div>}
        </Card>
      </div>
    </div>
  );
}
