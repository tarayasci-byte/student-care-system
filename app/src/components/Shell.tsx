import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { FOOTER, SCHOOL, TEACHER } from '../config';
import { useStore, type Screen } from '../state/store';
import { Icon, type IconName } from './Icon';
import { Corners } from './ui';

export function useIsMobile() {
  const q = '(max-width: 760px)';
  const [m, setM] = useState(() => window.matchMedia(q).matches);
  useEffect(() => {
    const mq = window.matchMedia(q);
    const on = () => setM(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return m;
}

const NAV: [Screen, string, string, IconName][] = [
  ['dash', 'หน้าหลัก', 'หน้าหลัก', 'dash'],
  ['list', 'นักเรียน', 'นักเรียน', 'users'],
  ['sdq', 'คัดกรอง SDQ', 'SDQ', 'clip'],
  ['visit', 'เยี่ยมบ้าน', 'เยี่ยมบ้าน', 'home'],
  ['help', 'ช่วยเหลือ/ส่งต่อ', 'ช่วยเหลือ', 'send'],
  ['report', 'รายงานสรุป', 'รายงาน', 'chart'],
  ['data', 'ข้อมูลและสำรอง', 'ข้อมูล', 'db'],
];

function Avatar({ size = 32, fontSize = 13 }: { size?: number; fontSize?: number }) {
  return (
    <div style={{ width: size, height: size, flex: 'none', display: 'grid', placeItems: 'center', background: 'var(--color-accent-200)', color: 'var(--color-accent-900)', fontWeight: 600, fontSize }}>
      {TEACHER.initial}
    </div>
  );
}

function Sidebar({ active }: { active: Screen }) {
  const { go, logout, year, students } = useStore();
  return (
    <aside data-noprint="1" style={{
      width: 236, flex: 'none', position: 'sticky', top: 0, height: '100vh', display: 'flex', flexDirection: 'column', gap: 20, padding: '22px 14px',
      background: 'var(--color-accent-900)', color: 'var(--color-neutral-100)',
      ['--color-text' as string]: 'var(--color-neutral-100)',
      ['--color-divider' as string]: 'color-mix(in srgb, var(--color-neutral-100) 22%, transparent)',
    } as CSSProperties}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '0 8px' }}>
        <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 19, lineHeight: 1.2 }}>ระบบดูแลช่วยเหลือนักเรียน</div>
        <div className="text-muted" style={{ fontSize: 12, lineHeight: 1.4 }}>{SCHOOL.name}<br />{SCHOOL.areaShort}</div>
      </div>
      <div className="blueprint" style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 2, margin: '0 8px' }}>
        <Corners />
        <div className="card-kicker" style={{ color: 'var(--color-accent-300)' }}>ห้องเรียน</div>
        <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 18, lineHeight: 1.2 }}>{SCHOOL.grade}</div>
        <div className="text-muted" style={{ fontSize: 12 }}>ปีการศึกษา {year} · {students.length} คน</div>
      </div>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
        {NAV.map(([k, l, , i]) => {
          const a = active === k;
          return (
            <button key={k} type="button" onClick={() => go(k)} className={a ? '' : 'plain hover-side'} aria-current={a ? 'page' : undefined} style={{
              display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 12px', border: 'none',
              background: a ? 'var(--color-accent-600)' : undefined, color: a ? 'var(--color-neutral-100)' : 'var(--color-neutral-300)',
              fontSize: 14, fontWeight: a ? 500 : 400, cursor: 'pointer', textAlign: 'left',
            }}>
              <Icon name={i} size={18} />
              <span style={{ flex: 1 }}>{l}</span>
            </button>
          );
        })}
      </nav>
      <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 8px', borderTop: '1px solid var(--color-divider)' }}>
        <Avatar size={34} fontSize={15} />
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.3, minWidth: 0 }}>
          <span style={{ fontSize: 13, fontWeight: 500 }}>{TEACHER.fullName}</span>
          <span className="text-muted" style={{ fontSize: 11 }}>{TEACHER.role}</span>
        </div>
        <button type="button" title="ออกจากระบบ" aria-label="ออกจากระบบ" onClick={logout} className="plain hover-side" style={{
          marginLeft: 'auto', width: 32, height: 32, flex: 'none', display: 'grid', placeItems: 'center',
          border: '1px solid var(--color-divider)', color: 'inherit',
        }}>
          <Icon name="logout" />
        </button>
      </div>
    </aside>
  );
}

function MobileHeader() {
  const { logout } = useStore();
  return (
    <header data-noprint="1" style={{ position: 'sticky', top: 0, zIndex: 5, background: 'var(--color-bg)', display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px 10px', borderBottom: '1px solid var(--color-divider)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15, flex: 1, minWidth: 0 }}>
        <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 17 }}>ระบบดูแลช่วยเหลือนักเรียน</span>
        <span className="text-muted" style={{ fontSize: 11 }}>{SCHOOL.grade} · {SCHOOL.name}</span>
      </div>
      <Avatar />
      <button type="button" className="btn btn-secondary btn-icon" title="ออกจากระบบ" aria-label="ออกจากระบบ" onClick={logout}><Icon name="logout" /></button>
    </header>
  );
}

function BottomNav({ active }: { active: Screen }) {
  const { go } = useStore();
  return (
    <nav data-noprint="1" style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 10, display: 'flex', borderTop: '1px solid var(--color-divider)', background: 'var(--color-bg)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {NAV.map(([k, , ml, i]) => {
        const a = active === k;
        return (
          <button key={k} type="button" onClick={() => go(k)} aria-current={a ? 'page' : undefined} style={{
            flex: 1, minWidth: 0, minHeight: 56, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
            padding: '6px 0 8px', border: 'none', background: 'transparent', fontSize: 10.5, cursor: 'pointer',
            color: a ? 'var(--color-accent-700)' : 'var(--color-neutral-600)', boxShadow: a ? 'inset 0 2px 0 var(--color-accent)' : 'none',
          }}>
            <Icon name={i} size={20} />
            <span>{ml}</span>
          </button>
        );
      })}
    </nav>
  );
}

export function Footer() {
  return (
    <footer style={{ marginTop: 48, paddingTop: 16, borderTop: '1px solid var(--color-divider)', display: 'flex', flexDirection: 'column', gap: 2, fontSize: 12, lineHeight: 1.5, color: 'var(--color-neutral-700)', textWrap: 'pretty' } as CSSProperties}>
      {FOOTER.map((l) => <div key={l}>{l}</div>)}
    </footer>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const { route } = useStore();
  const mob = useIsMobile();
  const active: Screen = route.screen === 'profile' ? 'list' : route.screen;
  if (mob) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <MobileHeader />
        <main style={{ flex: 1, padding: '16px 14px 92px', minWidth: 0 }}>
          {children}
          <Footer />
        </main>
        <BottomNav active={active} />
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar active={active} />
      <main style={{ flex: 1, minWidth: 0, padding: '28px 36px 56px' }}>
        <div style={{ maxWidth: 1280 }}>
          {children}
          <Footer />
        </div>
      </main>
    </div>
  );
}
