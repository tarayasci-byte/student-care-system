import type { CSSProperties, ReactNode } from 'react';
import { G, type Group } from '../domain/sdq';
import type { Cat } from '../domain/students';

/** The four "+" registration marks every .blueprint element wears. */
export function Corners() {
  return (
    <>
      <i className="corner tl" />
      <i className="corner tr" />
      <i className="corner bl" />
      <i className="corner br" />
    </>
  );
}

/** A transparent, hairline-framed card with corner marks. */
export function Card({ style, children, className = '' }: { style?: CSSProperties; children: ReactNode; className?: string }) {
  return (
    <div className={'card blueprint ' + className} style={style}>
      <Corners />
      {children}
    </div>
  );
}

type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { icon?: ReactNode };

/** The primary action: solid accent fill that keeps the corner marks. */
export function PrimaryButton({ icon, children, className = '', ...rest }: BtnProps) {
  return (
    <button type="button" className={'btn btn-primary blueprint ' + className} {...rest}>
      <Corners />
      {icon}
      {children}
    </button>
  );
}

// — status colours (mono: shades of the single steel accent) —

export const TAG: CSSProperties[] = [
  { boxShadow: 'inset 0 0 0 1px var(--color-divider)', color: 'var(--color-neutral-800)' },
  { background: 'var(--color-accent-200)', color: 'var(--color-accent-900)' },
  { background: 'var(--color-accent-900)', color: 'var(--color-neutral-100)' },
];
export const DOT = ['var(--color-accent-300)', 'var(--color-accent-500)', 'var(--color-accent-900)'];
export const PEND_COLOR = 'var(--color-neutral-300)';
export const PEND: CSSProperties = { background: 'var(--color-neutral-200)', color: 'var(--color-neutral-700)' };

export const catColor = (c: Cat) => (c === 'pend' ? PEND_COLOR : DOT[c]);
export const catLabel = (c: Cat) => (c === 'pend' ? 'รอคัดกรอง' : G[c]);
export const catTag = (c: Cat | null | undefined): CSSProperties => (c == null || c === 'pend' ? PEND : TAG[c]);

export function GroupTag({ c, children }: { c: Cat | null; children?: ReactNode }) {
  return <span className="tag" style={catTag(c)}>{children ?? (c == null ? '—' : catLabel(c))}</span>;
}

export function Dot({ c }: { c: Cat }) {
  return <span style={{ width: 10, height: 10, flex: 'none', display: 'inline-block', background: catColor(c) }} />;
}

export function Legend3({ size = 11 }: { size?: number }) {
  return (
    <div style={{ display: 'flex', gap: 12, fontSize: size }}>
      {([0, 1, 2] as Group[]).map((g) => (
        <span key={g} style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Dot c={g} />{G[g]}</span>
      ))}
    </div>
  );
}

export const chipStyle = (on: boolean): CSSProperties => ({
  whiteSpace: 'nowrap', flex: 'none', padding: '5px 12px', fontSize: 13, cursor: 'pointer',
  border: '1px solid ' + (on ? 'var(--color-accent)' : 'var(--color-divider)'),
  background: on ? 'var(--color-accent)' : 'transparent',
  color: on ? 'var(--color-neutral-100)' : 'var(--color-text)',
});

export function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" className={'chip' + (on ? ' on' : '')} aria-pressed={on} onClick={onClick} style={chipStyle(on)}>
      {children}
    </button>
  );
}

/** Segmented single-choice control built on native radios (.seg / .seg-opt). */
export function Seg<T extends string | number>({ name, options, value, onChange, optStyle, block }: {
  name: string;
  options: { value: T; label: ReactNode }[];
  value: T | null | undefined;
  onChange: (v: T) => void;
  optStyle?: CSSProperties;
  block?: boolean;
}) {
  return (
    <div className="seg" style={block ? { display: 'flex' } : undefined}>
      {options.map((o) => (
        <label key={String(o.value)} className="seg-opt" style={block ? { flex: 1, justifyContent: 'center', ...optStyle } : optStyle}>
          <input type="radio" name={name} checked={value === o.value} onChange={() => onChange(o.value)} />
          {o.label}
        </label>
      ))}
    </div>
  );
}

export function ScrollX({ children }: { children: ReactNode }) {
  return <div style={{ maxWidth: '100%', overflowX: 'auto' }}>{children}</div>;
}

// — charts —

export const pct = (n: number, of: number) => (of ? Math.round((n / of) * 100) : 0) + '%';

/** Group donut drawn with a conic gradient. */
export function Donut({ parts, total, size }: { parts: { color: string; n: number }[]; total: number; size: number }) {
  let acc = 0;
  const stops = total
    ? parts.map((p) => { const a = acc; acc += (p.n / total) * 100; return `${p.color} ${a}% ${acc}%`; }).join(',')
    : 'var(--color-neutral-200) 0 100%';
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', position: 'relative', flex: 'none', background: `conic-gradient(${stops})` }}>
      <div style={{ position: 'absolute', inset: '20%', background: 'var(--color-bg)', borderRadius: '50%', display: 'grid', placeItems: 'center', textAlign: 'center' }}>
        <div>
          <div className="hnum" style={{ fontSize: 40, lineHeight: 1 }}>{total}</div>
          <div className="text-muted" style={{ fontSize: 12 }}>คน</div>
        </div>
      </div>
    </div>
  );
}

/** Progress ring. */
export function Ring({ value, of, size }: { value: number; of: number; size: number }) {
  const p = of ? Math.round((value / of) * 100) : 0;
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', position: 'relative', flex: 'none', background: `conic-gradient(var(--color-accent) 0 ${p}%, var(--color-neutral-200) ${p}% 100%)` }}>
      <div style={{ position: 'absolute', inset: 9, background: 'var(--color-bg)', borderRadius: '50%', display: 'grid', placeItems: 'center' }}>
        <span className="hnum" style={{ fontSize: 22 }}>{p}%</span>
      </div>
    </div>
  );
}

/** Horizontal bar split into ปกติ / เสี่ยง / มีปัญหา segments. */
export function Seg3Bar({ counts }: { counts: number[] }) {
  return (
    <div style={{ display: 'flex', height: 14, gap: 2 }}>
      {counts.map((n, g) => (
        <div key={g} title={`${G[g]} ${n} คน`} style={{ flex: `${n} 0 0`, minWidth: n ? 3 : 0, background: DOT[g] }} />
      ))}
    </div>
  );
}

export interface Seg3Row { name: string; counts: number[] }

export function Seg3Chart({ rows, labelCol = 'minmax(96px,150px)', noteCol = '40px' }: { rows: Seg3Row[]; labelCol?: string; noteCol?: string }) {
  return (
    <>
      {rows.map((r) => (
        <div key={r.name} style={{ display: 'grid', gridTemplateColumns: `${labelCol} 1fr ${noteCol}`, gap: 12, alignItems: 'center', fontSize: 13 }}>
          <span>{r.name}</span>
          <Seg3Bar counts={r.counts} />
          <span style={{ textAlign: 'right', fontWeight: 500 }}>{r.counts[1] + r.counts[2]}</span>
        </div>
      ))}
    </>
  );
}

export function BarChart({ rows, of }: { rows: { name: string; val: number }[]; of: number }) {
  return (
    <>
      {rows.map((r) => (
        <div key={r.name} style={{ display: 'grid', gridTemplateColumns: 'minmax(96px,150px) 1fr 40px', gap: 12, alignItems: 'center', fontSize: 13 }}>
          <span>{r.name}</span>
          <div style={{ height: 14, background: 'var(--color-neutral-200)' }}>
            <div style={{ width: (of ? (r.val / of) * 100 : 0) + '%', height: '100%', background: 'var(--color-accent)' }} />
          </div>
          <span style={{ textAlign: 'right', fontWeight: 500 }}>{r.val}</span>
        </div>
      ))}
    </>
  );
}

export function KV({ k, v, kw = 130, pad = '8px 0' }: { k: ReactNode; v: ReactNode; kw?: number; pad?: string }) {
  return (
    <div className="line-top" style={{ display: 'grid', gridTemplateColumns: `${kw}px 1fr`, gap: 10, padding: pad, fontSize: 14 }}>
      <span className="text-muted">{k}</span>
      <span>{v}</span>
    </div>
  );
}

export function EmptyBox({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="blueprint" style={{ padding: 36, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, textAlign: 'center', maxWidth: 720 }}>
      <Corners />
      <div className="card-title">{title}</div>
      {sub && <div className="text-muted" style={{ fontSize: 14 }}>{sub}</div>}
      {action}
    </div>
  );
}
