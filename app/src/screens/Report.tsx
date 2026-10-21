import { SCHOOL } from '../config';
import { mediumDate, termLabel } from '../domain/dates';
import { FBY, RF, riskOf } from '../domain/visit';
import { Icon } from '../components/Icon';
import { BarChart, Card, Legend3, Ring, Seg3Chart } from '../components/ui';
import { useStore } from '../state/store';
import { GroupDonutCard, useClassStats } from './Dashboard';

export function Report() {
  const { year } = useStore();
  const { st, N, cats, sdqDone, visitDone, atRisk, helped, referred, areaBars, subBars } = useClassStats();
  const vis = st.filter((s) => s.visit).map((s) => s.visit!.v);
  const houseBars = RF.map(([k, name]) => ({ name, val: vis.filter((v) => riskOf(v).on[k]).length }));
  const talkBars = FBY.talk.o!.map((t) => ({ name: t, val: vis.filter((v) => Array.isArray(v.talk) && v.talk.includes(t)).length }))
    .filter((b) => b.val).sort((a, b) => b.val - a.val);
  const kpis: [string, number][] = [['นักเรียนทั้งหมด', N], ['กลุ่มเสี่ยง', cats[1]], ['กลุ่มมีปัญหา', cats[2]], ['ส่งต่อแล้ว', referred]];
  const rings: [string, number, number][] = [['คัดกรอง SDQ', sdqDone, N], ['เยี่ยมบ้าน', visitDone, N], ['ได้รับการช่วยเหลือ', helped, atRisk.length], ['ส่งต่อ', referred, atRisk.length]];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <h2 style={{ margin: '0 0 2px' }}>รายงานสรุปผล</h2>
          <div className="text-muted" style={{ fontSize: 14 }}>{SCHOOL.grade} {SCHOOL.name} · {termLabel(year)} · ข้อมูล ณ {mediumDate()}</div>
        </div>
        <button type="button" data-noprint="1" className="btn btn-secondary" onClick={() => window.print()}><Icon name="print" />พิมพ์รายงาน</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', border: '1px solid var(--color-divider)' }}>
        {kpis.map(([label, val], i) => (
          <div key={label} style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 6, borderLeft: i ? '1px solid var(--color-divider)' : 'none' }}>
            <div className="text-muted" style={{ fontSize: 12 }}>{label}</div>
            <div className="hnum" style={{ fontSize: 40, lineHeight: 1 }}>{val}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,360px),1fr))', gap: 20, alignItems: 'stretch' }}>
        <GroupDonutCard interactive={false} />
        <Card style={{ padding: '18px 20px', gap: 16 }}>
          <div className="card-title">ความคืบหน้าการดำเนินงาน</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(96px,1fr))', gap: 12, flex: 1, alignContent: 'center' }}>
            {rings.map(([label, val, of]) => (
              <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                <Ring value={val} of={of} size={96} />
                <div style={{ textAlign: 'center', lineHeight: 1.3 }}>
                  <div style={{ fontSize: 13 }}>{label}</div>
                  <div className="text-muted" style={{ fontSize: 12 }}>{val} / {of}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,360px),1fr))', gap: 20, alignItems: 'start' }}>
        <Card style={{ padding: '18px 20px', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
            <div className="card-title" style={{ flex: 1 }}>ผลคัดกรองรายด้าน</div><Legend3 />
          </div>
          <Seg3Chart rows={areaBars} />
        </Card>
        <Card style={{ padding: '18px 20px', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
            <div className="card-title" style={{ flex: 1 }}>SDQ รายด้าน</div>
            <span className="text-muted" style={{ fontSize: 12 }}>คัดกรองแล้ว {sdqDone} คน</span>
          </div>
          <Seg3Chart rows={subBars} />
        </Card>
        <Card style={{ padding: '18px 20px', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
            <div className="card-title" style={{ flex: 1 }}>ปัจจัยเสี่ยงจากการเยี่ยมบ้าน</div>
            <span className="text-muted" style={{ fontSize: 12 }}>จากการเยี่ยมบ้าน {visitDone} หลัง</span>
          </div>
          <BarChart rows={houseBars} of={vis.length} />
        </Card>
        <Card style={{ padding: '18px 20px', gap: 14 }}>
          <div className="card-title">ผู้ที่นักเรียนปรึกษาเมื่อมีปัญหา</div>
          <BarChart rows={talkBars} of={vis.length} />
          {!talkBars.length && <div className="text-muted" style={{ fontSize: 13 }}>ยังไม่มีข้อมูล</div>}
        </Card>
      </div>
    </div>
  );
}
