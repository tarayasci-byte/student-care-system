// Lucide icons at stroke-width 1.5, as the design system asks.
const IP: Record<string, string[]> = {
  db: ['M21 5a9 3 0 1 1-18 0a9 3 0 1 1 18 0', 'M3 5v14a9 3 0 0 0 18 0V5', 'M3 12a9 3 0 0 0 18 0'],
  logout: ['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4', 'm16 17 5-5-5-5', 'M21 12H9'],
  dash: ['r:3,3,7,9', 'r:14,3,7,5', 'r:14,12,7,9', 'r:3,16,7,5'],
  users: ['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', 'c:9,7,4', 'M22 21v-2a4 4 0 0 0-3-3.87', 'M16 3.13a4 4 0 0 1 0 7.75'],
  clip: ['r:8,2,8,4', 'M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2', 'm9 14 2 2 4-4'],
  home: ['m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', 'M9 22V12h6v10'],
  send: ['m22 2-7 20-4-9-9-4Z', 'M22 2 11 13'],
  chart: ['M3 3v18h18', 'M18 17V9', 'M13 17V5', 'M8 17v-3'],
  search: ['c:11,11,8', 'm21 21-4.3-4.3'],
  chev: ['m9 18 6-6-6-6'],
  back: ['m12 19-7-7 7-7', 'M19 12H5'],
  plus: ['M5 12h14', 'M12 5v14'],
  check: ['M20 6 9 17l-5-5'],
  print: ['M6 9V2h12v7', 'M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2', 'r:6,14,12,8'],
  lock: ['r:3,11,18,11', 'M7 11V7a5 5 0 0 1 10 0v4'],
  user: ['M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2', 'c:12,7,4'],
};

export type IconName = keyof typeof IP;

export function Icon({ name, size = 16 }: { name: IconName; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}
      strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none', display: 'block' }} aria-hidden="true">
      {IP[name].map((d, i) => {
        if (d.startsWith('c:')) {
          const [cx, cy, r] = d.slice(2).split(',');
          return <circle key={i} cx={cx} cy={cy} r={r} />;
        }
        if (d.startsWith('r:')) {
          const [x, y, w, h] = d.slice(2).split(',');
          return <rect key={i} x={x} y={y} width={w} height={h} rx={1} />;
        }
        return <path key={i} d={d} />;
      })}
    </svg>
  );
}
