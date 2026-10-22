import { cat, type Cat } from '../domain/students';
import { Icon } from '../components/Icon';
import { useIsMobile } from '../components/Shell';
import { Card, GroupTag, ScrollX } from '../components/ui';
import { useStore } from '../state/store';
import { ageText, view } from './common';

type Filter = 'all' | Cat;
const FILTERS: [Filter, string][] = [['all', 'ทั้งหมด'], [0, 'ปกติ'], [1, 'เสี่ยง'], [2, 'มีปัญหา'], ['pend', 'รอคัดกรอง']];
const COLS = '56px minmax(200px,2fr) 72px 64px 104px minmax(120px,1fr) minmax(130px,1fr) 24px';

function parseFilter(p: string | undefined): Filter {
  if (p === '0' || p === '1' || p === '2') return Number(p) as Cat;
  return p === 'pend' ? 'pend' : 'all';
}

export function StudentList() {
  const { students: st, route, go } = useStore();
  const mob = useIsMobile();
  const filter = parseFilter(route.params.filter);
  const q = (route.params.q || '').trim();
  const setParams = (f: Filter, query: string) => go('list', { filter: f === 'all' ? undefined : f, q: query || undefined }, { replace: true });
  const rows = st.filter((s) => (filter === 'all' || cat(s) === filter) && (!q || (s.fn + s.ln).includes(q) || `${s.fn} ${s.ln}`.includes(q) || String(s.no) === q));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <h2 style={{ margin: '0 0 2px' }}>รายชื่อนักเรียน</h2>
        <div className="text-muted" style={{ fontSize: 14 }}>แสดง {rows.length} จาก {st.length} คน</div>
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: 360 }}>
          <span style={{ position: 'absolute', left: 10, top: 9, color: 'var(--color-neutral-600)' }}><Icon name="search" /></span>
          <input className="input" style={{ paddingLeft: 34 }} placeholder="ค้นหาชื่อ นามสกุล หรือเลขที่" aria-label="ค้นหานักเรียน"
            value={route.params.q || ''} onChange={(e) => setParams(filter, e.target.value)} />
        </div>
        <ScrollX>
          <div className="seg">
            {FILTERS.map(([k, l]) => (
              <label key={String(k)} className="seg-opt">
                <input type="radio" name="flt" checked={filter === k} onChange={() => setParams(k, q)} />
                {l} <span style={{ opacity: 0.7 }}>{k === 'all' ? st.length : st.filter((s) => cat(s) === k).length}</span>
              </label>
            ))}
          </div>
        </ScrollX>
      </div>

      {!mob ? (
        <div style={{ overflowX: 'auto' }}>
          <div style={{ minWidth: 780, fontSize: 14 }} role="table">
            <div role="row" style={{ display: 'grid', gridTemplateColumns: COLS, gap: 8, padding: 8, borderBottom: '1px solid var(--color-divider)', fontSize: 11, letterSpacing: '.06em', color: 'color-mix(in srgb, var(--color-text) 60%, transparent)' }}>
              <span>เลขที่</span><span>ชื่อ-สกุล</span><span>อายุ</span><span>SDQ</span><span>กลุ่ม</span><span>เยี่ยมบ้าน</span><span>การช่วยเหลือ</span><span />
            </div>
            {rows.map((s) => {
              const v = view(s);
              return (
                <button key={s.id} type="button" role="row" className="plain hover-text line-bottom" onClick={() => go('profile', { sid: s.id })}
                  style={{ width: '100%', display: 'grid', gridTemplateColumns: COLS, gap: 8, alignItems: 'center', padding: '9px 8px', fontSize: 14 }}>
                  <span style={{ color: 'var(--color-neutral-600)' }}>{s.no}</span>
                  <span style={{ fontWeight: 500 }}>{v.name}</span>
                  <span>{ageText(s)}</span>
                  <span>{v.sdqText}</span>
                  <span><GroupTag c={v.c} /></span>
                  <span style={{ fontSize: 13 }}>{v.visitText}</span>
                  <span style={{ fontSize: 13 }}>{v.statusText}</span>
                  <span style={{ color: 'var(--color-neutral-500)' }}><Icon name="chev" /></span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%,250px),1fr))', gap: 16 }}>
          {rows.map((s) => {
            const v = view(s);
            return (
              <button key={s.id} type="button" className="plain hover-accent" onClick={() => go('profile', { sid: s.id })} style={{ display: 'block', width: '100%' }}>
                <Card style={{ padding: '12px 14px', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="hnum" style={{ width: 36, height: 36, flex: 'none', display: 'grid', placeItems: 'center', border: '1px solid var(--color-divider)', fontSize: 17 }}>{s.no}</span>
                    <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', lineHeight: 1.3 }}>
                      <span style={{ fontSize: 14, fontWeight: 500 }}>{v.name}</span>
                      <span className="text-muted" style={{ fontSize: 12 }}>อายุ {ageText(s)}</span>
                    </span>
                    <GroupTag c={v.c} />
                  </div>
                  <div style={{ display: 'flex', gap: 14, fontSize: 12, color: 'var(--color-neutral-700)', flexWrap: 'wrap' }}>
                    <span>SDQ {v.sdqText}</span><span>{v.visitText}</span>
                  </div>
                </Card>
              </button>
            );
          })}
        </div>
      )}
      {!rows.length && (
        <div className="text-muted" style={{ padding: '32px 0', textAlign: 'center' }}>
          {st.length ? 'ไม่พบนักเรียนที่ตรงกับการค้นหา' : 'ยังไม่มีรายชื่อนักเรียน เพิ่มได้ที่เมนู ข้อมูลและสำรอง'}
        </div>
      )}
    </div>
  );
}
