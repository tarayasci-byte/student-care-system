import { useState, type ReactNode } from 'react';
import gasCode from '../../apps-script/Code.gs?raw';
import { apiMessage, isApiUrl, sheetsApi } from '../api/sheets';
import { blankStudent, fullName, parseNames, randomCode } from '../domain/students';
import { Icon } from '../components/Icon';
import { Card, KV, PrimaryButton, ScrollX, Seg } from '../components/ui';
import { validDb } from '../state/db';
import { MIN_PASSWORD, validUsername } from '../state/localAuth';
import { useStore } from '../state/store';

function Msg({ children }: { children: ReactNode }) {
  return children ? <div className="notice">{children}</div> : null;
}

function SetupGuide() {
  const { toast } = useStore();
  return (
    <>
      <ol style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.6 }}>
        <li>เปิด Google Sheets ที่ใช้เก็บข้อมูล (เช่น "แบบบันทึกคะแนน SDQ") › ส่วนขยาย › Apps Script</li>
        <li>วางโค้ดด้านล่างแทนโค้ดเดิมทั้งหมด แก้ค่า SETUP_CODE เป็นรหัสยาว ๆ ที่เดายาก แล้วบันทึก</li>
        <li>การทำให้ใช้งานได้ › รายการใหม่ › เว็บแอป · เรียกใช้ในฐานะ: ฉัน · ผู้มีสิทธิ์เข้าถึง: ทุกคน (ถ้าเคยติดตั้งแล้ว ให้ จัดการการทำให้ใช้งานได้ › แก้ไข › เวอร์ชันใหม่)</li>
        <li>คัดลอก URL ที่ลงท้ายด้วย /exec มาวางในช่องด้านบน กด "ตรวจสอบ" แล้วลงทะเบียนบัญชีครูด้วย SETUP_CODE</li>
        <li>ให้ผู้ดูแลเว็บไซต์ตั้งค่า VITE_SHEET_API_URL เป็น URL เดียวกันตอน build เพื่อให้ผู้ปกครองและนักเรียนเข้าจากโทรศัพท์ของตนได้</li>
      </ol>
      <div style={{ position: 'relative' }}>
        <pre style={{ margin: 0, padding: 12, maxHeight: 220, overflow: 'auto', font: '11px/1.5 ui-monospace,Menlo,monospace', background: 'var(--color-neutral-100)', border: '1px solid var(--color-divider)', whiteSpace: 'pre-wrap' }}>{gasCode}</pre>
        <button type="button" className="btn btn-secondary" style={{ position: 'absolute', top: 6, right: 6, background: 'var(--color-bg)' }}
          onClick={() => navigator.clipboard.writeText(gasCode).then(() => toast('คัดลอกโค้ดแล้ว'), () => toast('คัดลอกไม่สำเร็จ'))}>คัดลอก</button>
      </div>
    </>
  );
}

function SheetsCard() {
  const s = useStore();
  const username = s.auth?.role === 't' ? s.auth.username : '';
  const [url, setUrl] = useState(s.apiUrl);
  const [step, setStep] = useState<'url' | 'login' | 'register'>('url');
  const [f, setF] = useState({ setupCode: '', username, password: '', password2: '' });
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [guide, setGuide] = useState(false);
  const [disc, setDisc] = useState<{ open: boolean; pw: string; pw2: string }>({ open: false, pw: '', pw2: '' });
  const upd = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF((x) => ({ ...x, [k]: e.target.value }));

  const check = async () => {
    if (!isApiUrl(url)) return setMsg('URL ต้องขึ้นต้นด้วย https://script.google.com/');
    setBusy(true); setMsg('กำลังตรวจสอบ…');
    try {
      const { hasAccount } = await sheetsApi.status(url.trim());
      setStep(hasAccount ? 'login' : 'register');
      setMsg(hasAccount ? 'พบบัญชีครูใน Google Sheets แล้ว เข้าสู่ระบบเพื่อเชื่อมต่อ' : 'ยังไม่มีบัญชีครูใน Google Sheets ลงทะเบียนด้วย SETUP_CODE จากสคริปต์');
    } catch (e) { setMsg(apiMessage(e)); }
    setBusy(false);
  };
  const connect = async () => {
    if (step === 'register') {
      if (!validUsername(f.username)) return setMsg('ชื่อผู้ใช้ต้องเป็นตัวอักษรภาษาอังกฤษ ตัวเลข . _ - ยาว 3–32 ตัว');
      if (f.password.length < MIN_PASSWORD) return setMsg(`รหัสผ่านต้องยาวอย่างน้อย ${MIN_PASSWORD} ตัวอักษร`);
      if (f.password !== f.password2) return setMsg('ยืนยันรหัสผ่านไม่ตรงกัน');
    }
    setBusy(true); setMsg('กำลังเชื่อมต่อ…');
    try {
      await s.connectSheets(url.trim(), step === 'register' ? 'register' : 'login', f.setupCode, f.username, f.password);
      setMsg('');
    } catch (e) { setMsg(apiMessage(e)); }
    setBusy(false);
  };
  const disconnect = async () => {
    if (disc.pw.length < MIN_PASSWORD) return setMsg(`รหัสผ่านต้องยาวอย่างน้อย ${MIN_PASSWORD} ตัวอักษร`);
    if (disc.pw !== disc.pw2) return setMsg('ยืนยันรหัสผ่านไม่ตรงกัน');
    setBusy(true);
    try { await s.disconnectSheets(disc.pw); setDisc({ open: false, pw: '', pw2: '' }); setMsg(''); setStep('url'); setUrl(''); } catch (e) { setMsg(apiMessage(e)); }
    setBusy(false);
  };

  const guideBtn = <button type="button" className="btn btn-ghost" onClick={() => setGuide((g) => !g)}>{guide ? 'ซ่อนวิธีตั้งค่า' : 'วิธีตั้งค่า'}</button>;

  if (s.mode === 'sheets') {
    return (
      <Card style={{ padding: '18px 20px', gap: 14 }}>
        <div className="card-title">เชื่อมต่อ Google Sheets</div>
        <KV k="สถานะ" v="เชื่อมต่อแล้ว · บันทึกขึ้น Sheets อัตโนมัติ" kw={110} pad="7px 0" />
        <KV k="เว็บแอป" v={<span className="mono" style={{ fontSize: 12, wordBreak: 'break-all' }}>{s.apiUrl}</span>} kw={110} pad="7px 0" />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <PrimaryButton disabled={busy} onClick={() => s.pushNow()}>ส่งข้อมูลขึ้น Sheets ตอนนี้</PrimaryButton>
          <button type="button" className="btn btn-secondary" onClick={() => s.pullResponses(false)}>รับคำตอบจากผู้ปกครอง/นักเรียน</button>
          <button type="button" className="btn btn-secondary" onClick={() => s.reloadFromSheets()}>ดึงข้อมูลจาก Sheets</button>
          {guideBtn}
        </div>
        <Msg>{s.sync.msg}</Msg>
        <Msg>{msg}</Msg>
        {guide && <SetupGuide />}
        {!disc.open ? (
          <button type="button" className="link-btn" style={{ alignSelf: 'flex-start' }} onClick={() => setDisc((d) => ({ ...d, open: true }))}>ยกเลิกการเชื่อมต่อและเก็บข้อมูลในเครื่องนี้</button>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, borderTop: '1px dashed var(--color-divider)', paddingTop: 12 }}>
            <div className="text-muted" style={{ fontSize: 12 }}>ข้อมูลจะถูกคัดลอกมาเก็บในเครื่องนี้ และใช้รหัสผ่านใหม่ด้านล่างเข้าสู่ระบบ ผู้ปกครองและนักเรียนจะเข้าจากโทรศัพท์ของตนไม่ได้อีก</div>
            <div className="field"><label htmlFor="d-pw">รหัสผ่านสำหรับเครื่องนี้</label><input id="d-pw" className="input" type="password" autoComplete="new-password" value={disc.pw} onChange={(e) => setDisc((d) => ({ ...d, pw: e.target.value }))} /></div>
            <div className="field"><label htmlFor="d-pw2">ยืนยันรหัสผ่าน</label><input id="d-pw2" className="input" type="password" autoComplete="new-password" value={disc.pw2} onChange={(e) => setDisc((d) => ({ ...d, pw2: e.target.value }))} /></div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="btn btn-secondary" disabled={busy} onClick={disconnect}>ยกเลิกการเชื่อมต่อ</button>
              <button type="button" className="btn btn-ghost" onClick={() => setDisc({ open: false, pw: '', pw2: '' })}>ไม่ใช่ตอนนี้</button>
            </div>
          </div>
        )}
      </Card>
    );
  }

  return (
    <Card style={{ padding: '18px 20px', gap: 14 }}>
      <div className="card-title">เชื่อมต่อ Google Sheets</div>
      <div className="text-muted" style={{ fontSize: 13 }}>เก็บข้อมูลไว้บน Google Sheets ของครู ใช้ได้หลายเครื่อง และให้ผู้ปกครองกับนักเรียนทำแบบประเมิน SDQ จากโทรศัพท์ของตนเอง</div>
      <div className="field">
        <label htmlFor="s-url">URL ของ Web App (Google Apps Script)</label>
        <input id="s-url" className="input" placeholder="https://script.google.com/macros/s/…/exec" value={url} disabled={step !== 'url'} onChange={(e) => setUrl(e.target.value.trim())} />
      </div>
      {step === 'register' && (
        <div className="field"><label htmlFor="s-code">รหัสตั้งค่า (SETUP_CODE ในสคริปต์)</label><input id="s-code" className="input" type="password" autoComplete="off" value={f.setupCode} onChange={upd('setupCode')} /></div>
      )}
      {step !== 'url' && (
        <>
          <div className="field"><label htmlFor="s-user">ชื่อผู้ใช้</label><input id="s-user" className="input" autoComplete="username" value={f.username} onChange={upd('username')} /></div>
          <div className="field"><label htmlFor="s-pw">รหัสผ่าน{step === 'register' ? ` (อย่างน้อย ${MIN_PASSWORD} ตัว)` : ''}</label><input id="s-pw" className="input" type="password" autoComplete={step === 'register' ? 'new-password' : 'current-password'} value={f.password} onChange={upd('password')} /></div>
          {step === 'register' && <div className="field"><label htmlFor="s-pw2">ยืนยันรหัสผ่าน</label><input id="s-pw2" className="input" type="password" autoComplete="new-password" value={f.password2} onChange={upd('password2')} /></div>}
        </>
      )}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {step === 'url'
          ? <PrimaryButton disabled={busy || !url} onClick={check}>ตรวจสอบ</PrimaryButton>
          : <PrimaryButton disabled={busy} onClick={connect}>{step === 'register' ? 'ลงทะเบียนและเชื่อมต่อ' : 'เข้าสู่ระบบและเชื่อมต่อ'}</PrimaryButton>}
        {step !== 'url' && <button type="button" className="btn btn-secondary" onClick={() => { setStep('url'); setMsg(''); }}>เปลี่ยน URL</button>}
        {guideBtn}
      </div>
      <Msg>{msg}</Msg>
      {guide && <SetupGuide />}
    </Card>
  );
}

function AccountCard() {
  const { auth, changePassword, toast } = useStore();
  const [f, setF] = useState({ old: '', pw: '', pw2: '' });
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  if (!auth || auth.role !== 't') return null;
  const submit = async () => {
    if (f.pw.length < MIN_PASSWORD) return setMsg(`รหัสผ่านใหม่ต้องยาวอย่างน้อย ${MIN_PASSWORD} ตัวอักษร`);
    if (f.pw !== f.pw2) return setMsg('ยืนยันรหัสผ่านใหม่ไม่ตรงกัน');
    setBusy(true);
    try {
      await changePassword(f.old, f.pw);
      setF({ old: '', pw: '', pw2: '' });
      setMsg('');
      toast('เปลี่ยนรหัสผ่านแล้ว');
    } catch (e) { setMsg(apiMessage(e)); }
    setBusy(false);
  };
  return (
    <Card style={{ padding: '18px 20px', gap: 14 }}>
      <div className="card-title">บัญชีผู้ดูแลระบบ</div>
      <div>
        <KV k="ชื่อผู้ใช้" v={auth.username} kw={150} pad="7px 0" />
        <KV k="ตรวจสอบรหัสผ่านที่" v={auth.mode === 'sheets' ? 'Google Sheets (Apps Script)' : 'เบราว์เซอร์เครื่องนี้'} kw={150} pad="7px 0" />
      </div>
      <div className="field"><label htmlFor="a-old">รหัสผ่านปัจจุบัน</label><input id="a-old" className="input" type="password" autoComplete="current-password" value={f.old} onChange={(e) => setF((x) => ({ ...x, old: e.target.value }))} /></div>
      <div className="field"><label htmlFor="a-pw">รหัสผ่านใหม่ (อย่างน้อย {MIN_PASSWORD} ตัว)</label><input id="a-pw" className="input" type="password" autoComplete="new-password" value={f.pw} onChange={(e) => setF((x) => ({ ...x, pw: e.target.value }))} /></div>
      <div className="field"><label htmlFor="a-pw2">ยืนยันรหัสผ่านใหม่</label><input id="a-pw2" className="input" type="password" autoComplete="new-password" value={f.pw2} onChange={(e) => setF((x) => ({ ...x, pw2: e.target.value }))} /></div>
      <button type="button" className="btn btn-secondary" style={{ alignSelf: 'flex-start' }} disabled={busy || !f.old} onClick={submit}>เปลี่ยนรหัสผ่าน</button>
      <Msg>{msg}</Msg>
      <div className="text-muted" style={{ fontSize: 12 }}>ระบบออกจากระบบอัตโนมัติเมื่อไม่มีการใช้งาน 30 นาที</div>
    </Card>
  );
}

export function Data() {
  const s = useStore();
  const { db, year, students: st, mode, ask, toast } = s;
  const [newYear, setNewYear] = useState(String(Number(year) + 1));
  const [nyMode, setNyMode] = useState<'new' | 'copy'>('new');
  const [nyNames, setNyNames] = useState('');
  const [addNames, setAddNames] = useState('');
  if (!db) return null;
  const years = Object.keys(db.years).sort().reverse();

  const backup = () => {
    const b = new Blob([JSON.stringify({ ...db, exportedAt: new Date().toISOString() }, null, 1)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(b);
    a.download = `student-care-backup-${year}-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast('ดาวน์โหลดไฟล์สำรองแล้ว');
  };
  const restore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const d = JSON.parse(await file.text());
      if (!validDb(d)) throw new Error('invalid');
      ask('กู้คืนจากไฟล์สำรอง?', `ข้อมูลทั้งหมด${mode === 'sheets' ? 'ใน Google Sheets และ' : ''}ในเครื่องนี้จะถูกแทนที่ด้วยไฟล์ ${file.name} (${Object.keys(d.years).length} ปีการศึกษา)`, 'กู้คืนข้อมูล', () => {
        s.replaceDb(d);
        toast('กู้คืนข้อมูลแล้ว');
      });
    } catch {
      toast('ไฟล์ไม่ถูกต้อง');
    }
  };
  const startYear = () => {
    const y = newYear.trim();
    if (!/^25\d\d$/.test(y)) return toast('ใส่ปีการศึกษาเป็น พ.ศ. 4 หลัก');
    if (db.years[y]) return toast('มีปีการศึกษา ' + y + ' อยู่แล้ว');
    const base = nyMode === 'copy'
      ? st.map((x) => ({ ...blankStudent(x.no, x.pre, x.fn, x.ln), id: x.id, age: x.age + 1, sc: randomCode('S', x.no), pc: randomCode('P', x.no) }))
      : parseNames(nyNames, 1);
    if (!base.length) return toast('กรุณาวางรายชื่อนักเรียนอย่างน้อย 1 คน');
    ask(`เริ่มปีการศึกษา ${y}?`, `ข้อมูลปีการศึกษา ${year} จะถูกเก็บไว้ และระบบจะเปิดปี ${y} พร้อมนักเรียน ${base.length} คน (รหัสเข้าใช้งานใหม่ทั้งหมด)`, 'เริ่มปีการศึกษาใหม่', () => {
      s.startYear(y, base);
      setNyNames('');
      setNewYear(String(Number(y) + 1));
      toast('เริ่มปีการศึกษา ' + y + ' แล้ว');
    });
  };
  const addStudents = () => {
    const add = parseNames(addNames, st.length + 1);
    if (!add.length) return;
    s.updateStudents((list) => [...list, ...add]);
    setAddNames('');
    toast('เพิ่มนักเรียน ' + add.length + ' คน');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h2 style={{ margin: '0 0 2px' }}>ข้อมูลและการสำรอง</h2>
        <div className="text-muted" style={{ fontSize: 14 }}>ที่เก็บข้อมูล บัญชีผู้ดูแล การเชื่อมต่อ Google Sheets การสำรอง การลบ และการเริ่มปีการศึกษาใหม่</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,380px),1fr))', gap: 20, alignItems: 'start' }}>
        <Card style={{ padding: '18px 20px', gap: 14 }}>
          <div className="card-title">ที่เก็บข้อมูล</div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <KV k="ที่เก็บหลัก" v={mode === 'sheets' ? 'Google Sheets · บันทึกอัตโนมัติ' : 'เบราว์เซอร์เครื่องนี้ · บันทึกอัตโนมัติ'} kw={140} pad="7px 0" />
            <KV k="บันทึกล่าสุด" v={s.sync.status === 'pending' || s.sync.status === 'saving' ? 'กำลังบันทึก…' : s.sync.status === 'error' ? 'บันทึกขึ้น Sheets ไม่สำเร็จ' : s.sync.savedAt} kw={140} pad="7px 0" />
            <KV k="จำนวนนักเรียน" v={`${st.length} คน`} kw={140} pad="7px 0" />
          </div>
          <div className="field">
            <label htmlFor="d-year">ปีการศึกษาที่แสดง</label>
            <select id="d-year" className="input" value={year} onChange={(e) => s.switchYear(e.target.value)}>
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="text-muted" style={{ fontSize: 12, lineHeight: 1.5 }}>
            {mode === 'sheets'
              ? 'ข้อมูลหลักอยู่บน Google Sheets เครื่องนี้เก็บสำเนาชั่วคราวเฉพาะแท็บที่เปิดอยู่ และลบเมื่อออกจากระบบ'
              : 'ข้อมูลอยู่ในเครื่องนี้เท่านั้น ถ้าใช้เครื่องร่วมกับผู้อื่นให้ออกจากระบบทุกครั้ง และดาวน์โหลดไฟล์สำรองหรือเชื่อมต่อ Google Sheets เป็นประจำ'}
          </div>
        </Card>
        <SheetsCard />
        <AccountCard />
        <Card style={{ padding: '18px 20px', gap: 14 }}>
          <div className="card-title">สำรองและกู้คืน</div>
          <div className="text-muted" style={{ fontSize: 13 }}>ไฟล์สำรองรวมทุกปีการศึกษา เก็บไฟล์ไว้ในที่ปลอดภัยเพราะมีข้อมูลส่วนบุคคล</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <PrimaryButton onClick={backup}>ดาวน์โหลดไฟล์สำรอง (.json)</PrimaryButton>
            <label className="btn btn-secondary">กู้คืนจากไฟล์<input type="file" accept=".json,application/json" style={{ display: 'none' }} onChange={restore} /></label>
          </div>
        </Card>
        <Card style={{ padding: '18px 20px', gap: 14 }}>
          <div className="card-title">เริ่มปีการศึกษาใหม่</div>
          <div className="text-muted" style={{ fontSize: 13 }}>ข้อมูลปีการศึกษา {year} จะถูกเก็บไว้ ดูย้อนหลังได้จากช่อง "ปีการศึกษาที่แสดง"</div>
          <div className="field" style={{ maxWidth: 200 }}><label htmlFor="d-ny">ปีการศึกษาใหม่</label><input id="d-ny" className="input" inputMode="numeric" value={newYear} onChange={(e) => setNewYear(e.target.value.trim())} /></div>
          <ScrollX><Seg name="nymode" value={nyMode} onChange={setNyMode} options={[{ value: 'new', label: 'นักเรียนชุดใหม่' }, { value: 'copy', label: 'ใช้รายชื่อเดิม' }]} /></ScrollX>
          {nyMode === 'new'
            ? <div className="field"><label htmlFor="d-nyn">รายชื่อนักเรียน (บรรทัดละ 1 คน)</label><textarea id="d-nyn" className="input" placeholder={'ด.ช.ตัวอย่าง นามสกุล\nด.ญ.ตัวอย่าง นามสกุล'} value={nyNames} onChange={(e) => setNyNames(e.target.value)} /></div>
            : <div className="text-muted" style={{ fontSize: 12 }}>ใช้รายชื่อเดิม ล้างผล SDQ การเยี่ยมบ้าน และบันทึกการช่วยเหลือ</div>}
          <PrimaryButton style={{ alignSelf: 'flex-start' }} onClick={startYear}>เริ่มปีการศึกษา {newYear}</PrimaryButton>
        </Card>
        <Card style={{ padding: '18px 20px', gap: 14 }}>
          <div className="card-title">เพิ่มและลบนักเรียน</div>
          <div className="field"><label htmlFor="d-add">เพิ่มนักเรียน (บรรทัดละ 1 คน)</label><textarea id="d-add" className="input" style={{ minHeight: 64 }} placeholder="ด.ญ.ตัวอย่าง นามสกุล" value={addNames} onChange={(e) => setAddNames(e.target.value)} /></div>
          <button type="button" className="btn btn-secondary" style={{ alignSelf: 'flex-start' }} onClick={addStudents}><Icon name="plus" />เพิ่มเข้ารายชื่อ</button>
          <div style={{ display: 'flex', flexDirection: 'column', maxHeight: 320, overflowY: 'auto', borderTop: '1px solid var(--color-divider)' }}>
            {st.map((x) => (
              <div key={x.id} className="line-bottom" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', fontSize: 13 }}>
                <span style={{ width: 22, color: 'var(--color-neutral-600)' }}>{x.no}</span>
                <span style={{ flex: 1, minWidth: 0 }}>{fullName(x)}</span>
                <button type="button" className="btn btn-ghost" onClick={() => ask(`ล้างผลประเมินของ ${x.fn}?`, 'ลบผล SDQ ทั้ง 3 ผู้ประเมิน บันทึกเยี่ยมบ้าน และบันทึกการช่วยเหลือของนักเรียนคนนี้', 'ล้างข้อมูล', () => {
                  s.updateStudent(x.id, (y) => ({ ...y, sdq: null, sdq3: {}, visit: null, helps: [] }));
                  toast(`ล้างข้อมูลของ ${x.fn} แล้ว`);
                })}>ล้างผลประเมิน</button>
                <button type="button" className="btn btn-ghost" onClick={() => ask(`ลบ ${x.pre}${x.fn} ออกจากรายชื่อ?`, `ข้อมูลทั้งหมดของนักเรียนคนนี้ในปีการศึกษา ${year} จะถูกลบ และเลขที่ของนักเรียนคนอื่นจะเรียงใหม่`, 'ลบนักเรียน', () => {
                  s.updateStudents((list) => list.filter((y) => y.id !== x.id).map((y, i) => ({ ...y, no: i + 1 })));
                  toast('ลบนักเรียนแล้ว');
                })}>ลบ</button>
              </div>
            ))}
          </div>
        </Card>
        <Card style={{ padding: '18px 20px', gap: 14 }}>
          <div className="card-title">ลบข้อมูล</div>
          <div className="text-muted" style={{ fontSize: 13 }}>ปีการศึกษาที่เก็บไว้</div>
          <div style={{ display: 'flex', flexDirection: 'column', borderTop: '1px solid var(--color-divider)' }}>
            {years.map((y) => (
              <div key={y} className="line-bottom" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', fontSize: 14 }}>
                <span style={{ flex: 1 }}>ปีการศึกษา {y} · {db.years[y].students.length} คน</span>
                <span className="text-muted" style={{ fontSize: 12 }}>{y === year ? 'กำลังแสดง' : 'เก็บไว้'}</span>
                {y !== year && <button type="button" className="btn btn-ghost" onClick={() => ask(`ลบปีการศึกษา ${y}?`, 'ข้อมูลนักเรียนและผลประเมินทั้งหมดของปีนี้จะถูกลบถาวร', 'ลบปีการศึกษา', () => { s.deleteYear(y); })}>ลบ</button>}
              </div>
            ))}
          </div>
          {mode === 'local' && (
            <button type="button" className="btn btn-secondary" style={{ alignSelf: 'flex-start' }} onClick={() => ask('ล้างข้อมูลทั้งหมดในเครื่องนี้?', 'ทุกปีการศึกษาจะถูกลบ และระบบกลับไปใช้ข้อมูลตัวอย่าง (บัญชีผู้ดูแลยังอยู่)', 'ล้างข้อมูลทั้งหมด', () => { s.resetAllLocal(); toast('ล้างข้อมูลแล้ว'); })}>ล้างข้อมูลทั้งหมดในเครื่องนี้</button>
          )}
          <div className="text-muted" style={{ fontSize: 12 }}>การลบกู้คืนไม่ได้ ควรดาวน์โหลดไฟล์สำรองก่อน</div>
        </Card>
      </div>
    </div>
  );
}
