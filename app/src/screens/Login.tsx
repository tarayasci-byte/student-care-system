import { useEffect, useState, type CSSProperties } from 'react';
import { SCHOOL } from '../config';
import { apiMessage, sheetsApi } from '../api/sheets';
import { currentTerm } from '../domain/dates';
import { Icon } from '../components/Icon';
import { useIsMobile } from '../components/Shell';
import { Card, PrimaryButton, Seg } from '../components/ui';
import { hasLocalAccount, MIN_PASSWORD, validUsername } from '../state/localAuth';
import { useStore } from '../state/store';

type Role = 't' | 's' | 'p';
type View = 'checking' | 'offline' | 'login' | 'setup' | 'forgot';

function Field({ id, label, ...rest }: { id: string; label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input id={id} className="input" {...rest} />
    </div>
  );
}

export function Login() {
  const s = useStore();
  const mob = useIsMobile();
  const [role, setRole] = useState<Role>('t');
  const [view, setView] = useState<View>(s.mode === 'local' ? (hasLocalAccount() ? 'login' : 'setup') : 'checking');
  const [f, setF] = useState({ username: '', password: '', password2: '', setupCode: '', code: '', sample: true });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [fails, setFails] = useState({ n: 0, until: 0 });
  const upd = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF((x) => ({ ...x, [k]: e.target.value }));
  const term = currentTerm();

  const checkSheets = () => {
    setView('checking');
    setErr('');
    sheetsApi.status(s.apiUrl)
      .then(({ hasAccount }) => setView(hasAccount ? 'login' : 'setup'))
      .catch((e) => { setErr(apiMessage(e)); setView('offline'); });
  };
  useEffect(() => { if (s.mode === 'sheets') checkSheets(); }, [s.mode]); // eslint-disable-line react-hooks/exhaustive-deps

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setErr('');
    try {
      await fn();
    } catch (e) {
      setErr(apiMessage(e));
      setBusy(false);
      return false;
    }
    setBusy(false);
    return true;
  };

  const validateNew = () => {
    if (!validUsername(f.username)) return 'ชื่อผู้ใช้ต้องเป็นตัวอักษรภาษาอังกฤษ ตัวเลข . _ - ยาว 3–32 ตัว';
    if (f.password.length < MIN_PASSWORD) return `รหัสผ่านต้องยาวอย่างน้อย ${MIN_PASSWORD} ตัวอักษร`;
    if (f.password !== f.password2) return 'ยืนยันรหัสผ่านไม่ตรงกัน';
    if (s.mode === 'sheets' && !f.setupCode) return 'กรุณาใส่รหัสตั้งค่า (SETUP_CODE)';
    return '';
  };

  const submit = async () => {
    if (role !== 't') {
      await run(() => s.codeLogin(role, f.code));
      return;
    }
    if (view === 'login') {
      if (s.mode === 'local' && Date.now() < fails.until) {
        setErr('ใส่รหัสผ่านผิดหลายครั้ง กรุณารอสักครู่แล้วลองใหม่');
        return;
      }
      const ok = await run(() => (s.mode === 'local' ? s.loginLocal(f.username, f.password) : s.loginSheets(f.username, f.password)));
      if (!ok && s.mode === 'local') setFails((x) => ({ n: x.n + 1, until: x.n + 1 >= 5 ? Date.now() + 30000 : 0 }));
      setF((x) => ({ ...x, password: '' }));
      return;
    }
    if (view === 'setup' || (view === 'forgot' && s.mode === 'sheets')) {
      const v = validateNew();
      if (v) return setErr(v);
      if (view === 'forgot') await run(() => s.resetSheets(f.setupCode, f.username, f.password));
      else await run(() => (s.mode === 'local' ? s.setupLocal(f.username, f.password, f.sample) : s.setupSheets(f.setupCode, f.username, f.password, f.sample)));
    }
  };

  const resetLocal = () => s.ask('รีเซ็ตบัญชีครูในเครื่องนี้?',
    'เพื่อความปลอดภัยของข้อมูลนักเรียน การรีเซ็ตรหัสผ่านจะลบข้อมูลทั้งหมดในเครื่องนี้ด้วย หลังตั้งบัญชีใหม่ สามารถกู้คืนจากไฟล์สำรอง (.json) ได้ที่เมนูข้อมูลและสำรอง',
    'ลบข้อมูลและตั้งบัญชีใหม่', () => { s.resetLocal(); setView('setup'); setErr(''); });

  const title = role !== 't' ? 'เข้าสู่ระบบ' : view === 'setup' ? 'ตั้งค่าบัญชีครูผู้ดูแล' : view === 'forgot' ? 'ตั้งรหัสผ่านใหม่' : 'เข้าสู่ระบบ';
  const subtitle = role !== 't' || view === 'login' || view === 'checking' || view === 'offline'
    ? 'เลือกประเภทผู้ใช้งาน'
    : view === 'setup' ? 'ใช้งานครั้งแรก · สร้างชื่อผู้ใช้และรหัสผ่านสำหรับครู' : 'ใช้รหัสตั้งค่า (SETUP_CODE) จากสคริปต์ Google Sheets';
  const btnLabel = busy ? 'กำลังตรวจสอบ…' : role !== 't' || view === 'login' ? 'เข้าสู่ระบบ' : view === 'setup' ? 'สร้างบัญชีและเข้าสู่ระบบ' : 'ตั้งรหัสผ่านใหม่';

  const wrap: CSSProperties = mob
    ? { minHeight: '100vh', display: 'flex', flexWrap: 'wrap', alignContent: 'flex-start' }
    : { minHeight: '100vh', display: 'flex', flexWrap: 'wrap' };

  return (
    <div style={wrap}>
      <div style={{ flex: '1 1 340px', background: 'var(--color-accent-900)', color: 'var(--color-neutral-100)', padding: mob ? '32px 24px' : '44px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 28, minHeight: 220 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="card-kicker" style={{ color: 'var(--color-accent-300)' }}>{SCHOOL.name}</div>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 40, lineHeight: 1.1, textWrap: 'pretty' } as CSSProperties}>ระบบดูแลช่วยเหลือนักเรียน</div>
          <div style={{ fontSize: 14, color: 'var(--color-neutral-300)' }}>{SCHOOL.grade} · ภาคเรียนที่ {term.term}/{term.year}</div>
        </div>
        <div style={{ fontSize: 12, color: 'var(--color-neutral-300)', lineHeight: 1.6 }}>สังกัด{SCHOOL.areaFull}</div>
      </div>
      <div style={{ flex: '1 1 380px', display: 'grid', placeItems: 'center', padding: '40px 24px' }}>
        <Card style={{ width: '100%', maxWidth: 400, padding: 24, gap: 16 }}>
          <form style={{ display: 'contents' }} onSubmit={(e) => { e.preventDefault(); submit(); }}>
            <div><h3 style={{ margin: 0 }}>{title}</h3><div className="text-muted" style={{ fontSize: 13 }}>{subtitle}</div></div>
            {s.loginNotice && <div className="notice-strong">{s.loginNotice}</div>}
            <Seg name="lrole" block value={role} onChange={(r) => { setRole(r); setErr(''); }}
              options={[{ value: 't', label: 'ครู (ผู้ดูแล)' }, { value: 's', label: 'นักเรียน' }, { value: 'p', label: 'ผู้ปกครอง' }]} />

            {role === 't' && view === 'checking' && <div className="text-muted" style={{ fontSize: 13 }}>กำลังเชื่อมต่อ Google Sheets…</div>}
            {role === 't' && view === 'offline' && (
              <button type="button" className="btn btn-secondary" onClick={checkSheets}>ลองเชื่อมต่ออีกครั้ง</button>
            )}
            {role === 't' && view === 'login' && (
              <>
                <Field id="l-user" label="ชื่อผู้ใช้" autoComplete="username" autoCapitalize="none" value={f.username} onChange={upd('username')} />
                <Field id="l-pw" label="รหัสผ่าน" type="password" autoComplete="current-password" value={f.password} onChange={upd('password')} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="text-muted" style={{ fontSize: 12, flex: 1 }}>สิทธิ์ผู้ดูแลระบบ เข้าถึงข้อมูลนักเรียนทั้งหมด</span>
                  <button type="button" className="link-btn" onClick={() => { setErr(''); if (s.mode === 'local') resetLocal(); else setView('forgot'); }}>ลืมรหัสผ่าน?</button>
                </div>
              </>
            )}
            {role === 't' && (view === 'setup' || view === 'forgot') && (
              <>
                {s.mode === 'sheets' && <Field id="l-code" label="รหัสตั้งค่า (SETUP_CODE ในสคริปต์)" type="password" autoComplete="off" value={f.setupCode} onChange={upd('setupCode')} />}
                <Field id="l-user" label="ชื่อผู้ใช้ (ภาษาอังกฤษ เช่น arraya)" autoComplete="username" autoCapitalize="none" value={f.username} onChange={upd('username')} />
                <Field id="l-pw" label={`รหัสผ่าน (อย่างน้อย ${MIN_PASSWORD} ตัวอักษร)`} type="password" autoComplete="new-password" value={f.password} onChange={upd('password')} />
                <Field id="l-pw2" label="ยืนยันรหัสผ่าน" type="password" autoComplete="new-password" value={f.password2} onChange={upd('password2')} />
                {view === 'setup' && (
                  <label className="radio" style={{ fontSize: 13 }}>
                    <input type="checkbox" checked={f.sample} onChange={(e) => setF((x) => ({ ...x, sample: e.target.checked }))} />
                    <span className="dot" />เริ่มด้วยข้อมูลตัวอย่าง (ชื่อสมมติ) เพื่อทดลองใช้
                  </label>
                )}
                <div className="text-muted" style={{ fontSize: 12 }}>
                  {s.mode === 'sheets'
                    ? 'บัญชีเก็บใน Google Sheets ของครู รหัสผ่านถูกเก็บเป็นค่าแฮช ไม่เก็บรหัสผ่านจริง'
                    : 'บัญชีเก็บในเบราว์เซอร์เครื่องนี้ รหัสผ่านถูกเก็บเป็นค่าแฮช ต่อมาสามารถเชื่อมต่อ Google Sheets เพื่อใช้หลายเครื่องได้'}
                </div>
                {view === 'forgot' && <button type="button" className="link-btn" style={{ alignSelf: 'flex-start' }} onClick={() => { setView('login'); setErr(''); }}>กลับไปเข้าสู่ระบบ</button>}
              </>
            )}
            {role !== 't' && (
              <>
                <Field id="l-acode" label="รหัสเข้าใช้งาน (ได้รับจากครูประจำชั้น)" autoComplete="off" autoCapitalize="characters"
                  style={{ fontFamily: 'ui-monospace,Menlo,monospace', letterSpacing: '.05em' }}
                  placeholder={role === 's' ? 'เช่น S01-AB2C' : 'เช่น P01-AB2C'} value={f.code} onChange={upd('code')} />
                <div className="text-muted" style={{ fontSize: 12 }}>ทำได้เฉพาะแบบประเมิน SDQ ของนักเรียนที่ผูกกับรหัสนี้ ไม่สามารถดูข้อมูลอื่นในระบบ</div>
              </>
            )}
            {err && <div className="notice-strong" role="alert">{err}</div>}
            <PrimaryButton type="submit" className="btn-block" disabled={busy || (role === 't' && (view === 'checking' || view === 'offline'))} icon={<Icon name="lock" size={13} />}>{btnLabel}</PrimaryButton>
            <div className="text-muted" style={{ fontSize: 11, lineHeight: 1.5 }}>ข้อมูลในระบบเป็นข้อมูลส่วนบุคคลของนักเรียน คุ้มครองตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562</div>
          </form>
        </Card>
      </div>
    </div>
  );
}
