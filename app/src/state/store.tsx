import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { IDLE_LOGOUT_MS } from '../config';
import { ApiError, apiMessage, sheetsApi } from '../api/sheets';
import { makeSampleStudents } from '../data/sample';
import { currentTerm, stamp } from '../domain/dates';
import type { SdqRecord } from '../domain/sdq';
import type { Student } from '../domain/students';
import {
  clearDb, clearSession, getApiUrl, loadDb, loadSession, mergeResponses, newDb, normaliseDb, saveDb, saveSession, setApiUrl,
  type DB, type TeacherSession, type YearData,
} from './db';
import { hasLocalAccount, removeLocalAccount, setLocalAccount, verifyLocal } from './localAuth';
import { clearMemoryState } from './memory';

export type Screen = 'dash' | 'list' | 'profile' | 'sdq' | 'visit' | 'help' | 'report' | 'data';
const SCREENS: Screen[] = ['dash', 'list', 'profile', 'sdq', 'visit', 'help', 'report', 'data'];

export interface Route {
  screen: Screen;
  params: Record<string, string>;
}

export type PortalAuth = { role: 's' | 'p'; sid: string; name: string; code: string; remote: boolean };
export type Auth = ({ role: 't' } & TeacherSession) | PortalAuth;

interface ConfirmState {
  title: string;
  body: string;
  label: string;
  run: () => void;
  onCancel?: () => void;
}

export interface SyncState {
  status: 'idle' | 'pending' | 'saving' | 'saved' | 'error';
  msg: string;
  savedAt: string;
}

function parseHash(): Route {
  const h = window.location.hash.replace(/^#\/?/, '');
  const [path, qs] = h.split('?');
  const screen = (SCREENS.includes(path as Screen) ? path : 'dash') as Screen;
  return { screen, params: Object.fromEntries(new URLSearchParams(qs || '')) };
}

const yearOf = (y: Record<string, YearData>) => Object.keys(y).sort().reverse()[0];

function useStoreValue() {
  const [apiUrl, setApiUrlState] = useState(getApiUrl);
  const mode: 'local' | 'sheets' = apiUrl ? 'sheets' : 'local';
  const [auth, setAuth] = useState<Auth | null>(null);
  const [db, setDb] = useState<DB | null>(null);
  const [route, setRoute] = useState<Route>(parseHash);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [confirmState, setConfirm] = useState<ConfirmState | null>(null);
  const [sync, setSync] = useState<SyncState>({ status: 'idle', msg: '', savedAt: '—' });
  const [loginNotice, setLoginNotice] = useState('');
  const [booting, setBooting] = useState(true);

  const dbRef = useRef(db);
  dbRef.current = db;
  const authRef = useRef(auth);
  authRef.current = auth;
  const dirty = useRef(new Set<string>());
  const pushTimer = useRef<ReturnType<typeof setTimeout>>();
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();

  const toast = useCallback((t: string) => {
    setToastMsg(t);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(null), 2600);
  }, []);

  const ask = useCallback((title: string, body: string, label: string, run: () => void, onCancel?: () => void) => {
    setConfirm({ title, body, label, run, onCancel });
  }, []);

  // — routing —
  useEffect(() => {
    const on = () => setRoute(parseHash());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);

  /** Navigate; `replace` updates the current history entry in place (filters, search) without scrolling. */
  const go = useCallback((screen: Screen, params: Record<string, string | number | undefined> = {}, opts: { replace?: boolean } = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== '') qs.set(k, String(v)); });
    const hash = '#/' + screen + (qs.toString() ? '?' + qs.toString() : '');
    if (opts.replace) {
      history.replaceState(null, '', hash);
      setRoute(parseHash());
      return;
    }
    if (window.location.hash !== hash) window.location.hash = hash;
    else setRoute(parseHash());
    window.scrollTo(0, 0);
  }, []);

  // — session handling —

  const endSession = useCallback((notice = '') => {
    const a = authRef.current;
    clearTimeout(pushTimer.current);
    if (a?.role === 't' && a.mode === 'sheets') {
      if (a.token) sheetsApi.logout(apiUrl, a.token).catch(() => undefined);
      clearDb('sheets');
    }
    dirty.current.clear();
    clearSession();
    clearMemoryState();
    setAuth(null);
    setDb(null);
    setConfirm(null);
    setSync({ status: 'idle', msg: '', savedAt: '—' });
    setLoginNotice(notice);
    if (window.location.hash) history.replaceState(null, '', window.location.pathname + window.location.search);
    setRoute({ screen: 'dash', params: {} });
    window.scrollTo(0, 0);
  }, [apiUrl]);

  const startTeacher = useCallback((s: Omit<TeacherSession, 'lastActive'>, data: DB) => {
    const sess = { ...s, lastActive: Date.now() };
    saveSession(sess);
    // Refs are updated right away so a flush scheduled before the next render sees the new session.
    authRef.current = { role: 't', ...sess };
    dbRef.current = data;
    setAuth(authRef.current);
    setDb(data);
    setLoginNotice('');
    setSync({ status: 'idle', msg: '', savedAt: s.mode === 'local' ? stamp() : '—' });
    go('dash');
  }, [go]);

  // — Google Sheets sync —

  const flush = useCallback(async (): Promise<boolean> => {
    const a = authRef.current;
    clearTimeout(pushTimer.current);
    if (!a || a.role !== 't' || a.mode !== 'sheets' || !a.token) return true;
    const years = [...dirty.current];
    if (!years.length) return true;
    setSync((s) => ({ ...s, status: 'saving', msg: 'กำลังส่งข้อมูลขึ้น Google Sheets…' }));
    try {
      for (const y of years) {
        const data = dbRef.current?.years[y];
        if (data) await sheetsApi.save(apiUrl, a.token, y, data);
        dirty.current.delete(y);
      }
      setSync({ status: 'saved', msg: 'บันทึกขึ้น Google Sheets แล้ว · ' + stamp(), savedAt: stamp() });
      return true;
    } catch (e) {
      if (e instanceof ApiError && e.code === 'session') {
        endSession(apiMessage(e));
        return false;
      }
      setSync((s) => ({ ...s, status: 'error', msg: 'ส่งข้อมูลขึ้น Sheets ไม่สำเร็จ ' + apiMessage(e) + ' · ระบบจะลองใหม่เมื่อมีการแก้ไขครั้งถัดไป' }));
      return false;
    }
  }, [apiUrl, endSession]);

  const markDirty = useCallback((years: string[]) => {
    const a = authRef.current;
    if (!a || a.role !== 't' || a.mode !== 'sheets') return;
    years.forEach((y) => dirty.current.add(y));
    setSync((s) => ({ ...s, status: 'pending', msg: 'มีการแก้ไขที่รอส่งขึ้น Google Sheets' }));
    clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(() => { flush(); }, 1500);
  }, [flush]);

  // Persist every change to this browser (localStorage in local mode, sessionStorage cache in Sheets mode).
  useEffect(() => {
    if (!db || !auth || auth.role !== 't') return;
    const ok = saveDb(auth.mode, db);
    if (auth.mode === 'local') setSync({ status: ok ? 'saved' : 'error', msg: '', savedAt: ok ? stamp() : 'บันทึกไม่สำเร็จ (พื้นที่เต็มหรือถูกปิดกั้น)' });
  }, [db, auth]);

  const commit = useCallback((next: DB, changedYears: string[]) => {
    dbRef.current = next;
    setDb(next);
    markDirty(changedYears);
  }, [markDirty]);

  const pullResponses = useCallback(async (silent: boolean): Promise<void> => {
    const a = authRef.current;
    const d = dbRef.current;
    if (!a || a.role !== 't' || a.mode !== 'sheets' || !a.token || !d) {
      if (!silent) setSync((s) => ({ ...s, msg: 'ยังไม่ได้เชื่อมต่อ Google Sheets' }));
      return;
    }
    if (!silent) setSync((s) => ({ ...s, msg: 'กำลังรับคำตอบ…' }));
    try {
      const { rows } = await sheetsApi.responses(apiUrl, a.token, d.current);
      const latest = dbRef.current!;
      const y = latest.current;
      const merged = mergeResponses(latest.years[y].students, rows || []);
      if (merged.count) {
        commit({ ...latest, years: { ...latest.years, [y]: { students: merged.students, updatedAt: new Date().toISOString() } } }, [y]);
      }
      if (!silent) setSync((s) => ({ ...s, msg: `รับคำตอบจาก Google Sheets ${merged.count} รายการ · ${stamp()}` }));
      else if (merged.count) toast(`รับคำตอบ SDQ จาก Google Sheets ${merged.count} รายการ`);
    } catch (e) {
      if (e instanceof ApiError && e.code === 'session') return endSession(apiMessage(e));
      if (!silent) setSync((s) => ({ ...s, msg: 'รับคำตอบไม่สำเร็จ ' + apiMessage(e) }));
    }
  }, [apiUrl, commit, endSession, toast]);

  /** Push the current year now (e.g. to register new login codes in the sheet). */
  const pushNow = useCallback(() => {
    const d = dbRef.current;
    if (!d) return;
    dirty.current.add(d.current);
    flush();
  }, [flush]);

  /** Replace the browser copy with what is in the sheet. */
  const reloadFromSheets = useCallback(async () => {
    const a = authRef.current;
    if (!a || a.role !== 't' || a.mode !== 'sheets' || !a.token) return;
    const token = a.token;
    setSync((s) => ({ ...s, msg: 'กำลังดึงข้อมูล…' }));
    try {
      const { years } = await sheetsApi.load(apiUrl, token);
      const n = Object.keys(years || {}).length;
      if (!n) {
        setSync((s) => ({ ...s, msg: 'ยังไม่มีข้อมูลใน Google Sheets' }));
        return;
      }
      setSync((s) => ({ ...s, msg: '' }));
      ask('แทนที่ข้อมูลในเครื่อง?', `ข้อมูลในเครื่องนี้จะถูกแทนที่ด้วยข้อมูลจาก Google Sheets (${n} ปีการศึกษา) การแก้ไขที่ยังไม่ได้ส่งขึ้น Sheets จะหายไป`, 'แทนที่ข้อมูล', () => {
        dirty.current.clear();
        const next = normaliseDb({ current: yearOf(years), years });
        dbRef.current = next;
        setDb(next);
        clearMemoryState();
        setSync((s) => ({ ...s, status: 'saved', msg: 'ดึงข้อมูลจาก Google Sheets แล้ว · ' + stamp() }));
      });
    } catch (e) {
      if (e instanceof ApiError && e.code === 'session') return endSession(apiMessage(e));
      setSync((s) => ({ ...s, msg: 'ดึงข้อมูลไม่สำเร็จ ' + apiMessage(e) }));
    }
  }, [apiUrl, ask, endSession]);

  // — teacher authentication —

  const loginLocal = useCallback(async (username: string, password: string) => {
    if (!(await verifyLocal(username, password))) throw new ApiError('password');
    const data = loadDb('local') || newDb(currentTerm().year, []);
    startTeacher({ username: username.trim().toLowerCase(), mode: 'local' }, data);
  }, [startTeacher]);

  /** First-run setup on this computer. Any data left without an account is discarded. */
  const setupLocal = useCallback(async (username: string, password: string, sample: boolean) => {
    clearDb('local');
    await setLocalAccount(username, password);
    const data = newDb(sample ? '2569' : currentTerm().year, sample ? makeSampleStudents() : []);
    saveDb('local', data);
    startTeacher({ username: username.trim().toLowerCase(), mode: 'local' }, data);
  }, [startTeacher]);

  /** Forgotten local password: the only safe reset is wiping this computer's data. */
  const resetLocal = useCallback(() => {
    clearDb('local');
    removeLocalAccount();
    clearSession();
  }, []);

  /** Load all years from the sheet; when it is empty, seed it from `fallback` and push. */
  const openSheets = useCallback(async (url: string, token: string, username: string, fallback: () => DB) => {
    const { years } = await sheetsApi.load(url, token);
    const keys = Object.keys(years || {});
    let data: DB;
    if (keys.length) {
      data = normaliseDb({ current: yearOf(years), years });
    } else {
      data = fallback();
      Object.keys(data.years).forEach((y) => dirty.current.add(y));
    }
    startTeacher({ username, mode: 'sheets', token }, data);
    if (dirty.current.size) setTimeout(() => { flush(); }, 0);
    setTimeout(() => { pullResponses(true); }, 0);
  }, [flush, pullResponses, startTeacher]);

  const loginSheets = useCallback(async (username: string, password: string) => {
    const { session } = await sheetsApi.login(apiUrl, username, password);
    await openSheets(apiUrl, session, username.trim().toLowerCase(), () => newDb(currentTerm().year, []));
  }, [apiUrl, openSheets]);

  const setupSheets = useCallback(async (setupCode: string, username: string, password: string, sample: boolean) => {
    const { session } = await sheetsApi.register(apiUrl, setupCode, username, password);
    await openSheets(apiUrl, session, username.trim().toLowerCase(),
      () => newDb(sample ? '2569' : currentTerm().year, sample ? makeSampleStudents() : []));
  }, [apiUrl, openSheets]);

  const resetSheets = useCallback(async (setupCode: string, username: string, password: string) => {
    const { session } = await sheetsApi.resetPassword(apiUrl, setupCode, username, password);
    await openSheets(apiUrl, session, username.trim().toLowerCase(), () => newDb(currentTerm().year, []));
  }, [apiUrl, openSheets]);

  const logout = useCallback(async () => {
    const a = authRef.current;
    if (a?.role === 't' && a.mode === 'sheets' && dirty.current.size) {
      const ok = await flush();
      if (!ok) {
        ask('ออกจากระบบโดยไม่บันทึก?', 'ยังส่งการแก้ไขล่าสุดขึ้น Google Sheets ไม่สำเร็จ ถ้าออกจากระบบตอนนี้การแก้ไขนั้นจะหายไป', 'ออกจากระบบ', () => endSession());
        return;
      }
    }
    endSession();
  }, [ask, endSession, flush]);

  const changePassword = useCallback(async (oldPw: string, newPw: string) => {
    const a = authRef.current;
    if (!a || a.role !== 't') return;
    if (a.mode === 'local') {
      if (!(await verifyLocal(a.username, oldPw))) throw new ApiError('password');
      await setLocalAccount(a.username, newPw);
      return;
    }
    const { session } = await sheetsApi.changePassword(apiUrl, a.token!, oldPw, newPw);
    const next = { ...a, token: session };
    saveSession(next);
    setAuth(next);
  }, [apiUrl]);

  /** Move from local mode to Google Sheets (register a new teacher account there, or sign in to the existing one). */
  const connectSheets = useCallback(async (url: string, kind: 'register' | 'login', setupCode: string, username: string, password: string) => {
    const a = authRef.current;
    const local = dbRef.current;
    if (!a || a.role !== 't' || !local) return;
    const { session } = kind === 'register'
      ? await sheetsApi.register(url, setupCode, username, password)
      : await sheetsApi.login(url, username, password);
    const { years } = await sheetsApi.load(url, session);
    const finish = (data: DB, pushAll: boolean) => {
      setApiUrl(url);
      setApiUrlState(url);
      clearDb('local');
      removeLocalAccount();
      const sess: TeacherSession = { username: username.trim().toLowerCase(), mode: 'sheets', token: session, lastActive: Date.now() };
      saveSession(sess);
      authRef.current = { role: 't', ...sess };
      dbRef.current = data;
      setAuth(authRef.current);
      setDb(data);
      if (pushAll) {
        Object.keys(data.years).forEach((y) => dirty.current.add(y));
        setTimeout(() => { flush(); }, 0);
      }
      setTimeout(() => { pullResponses(true); }, 0);
      toast('เชื่อมต่อ Google Sheets แล้ว');
    };
    if (Object.keys(years || {}).length) {
      ask('ใช้ข้อมูลจาก Google Sheets?',
        `Google Sheets มีข้อมูลอยู่แล้ว ${Object.keys(years).length} ปีการศึกษา ข้อมูลในเครื่องนี้จะถูกแทนที่ ถ้าต้องการเก็บข้อมูลในเครื่องไว้ ให้กดยกเลิกแล้วดาวน์โหลดไฟล์สำรองก่อน`,
        'ใช้ข้อมูลจาก Sheets', () => finish(normaliseDb({ current: yearOf(years), years }), false),
        () => { sheetsApi.logout(url, session).catch(() => undefined); });
    } else {
      finish(local, true);
    }
  }, [ask, flush, pullResponses, toast]);

  /** Back to local mode: the data is copied to this computer, protected by a new local password. */
  const disconnectSheets = useCallback(async (password: string) => {
    const a = authRef.current;
    const d = dbRef.current;
    if (!a || a.role !== 't' || a.mode !== 'sheets' || !d) return;
    await flush();
    await setLocalAccount(a.username, password);
    saveDb('local', d);
    clearDb('sheets');
    if (a.token) sheetsApi.logout(apiUrl, a.token).catch(() => undefined);
    dirty.current.clear();
    setApiUrl('');
    setApiUrlState('');
    const sess: TeacherSession = { username: a.username, mode: 'local', lastActive: Date.now() };
    saveSession(sess);
    setAuth({ role: 't', ...sess });
    toast('ยกเลิกการเชื่อมต่อแล้ว ข้อมูลเก็บในเครื่องนี้');
  }, [apiUrl, flush, toast]);

  // — restore a teacher session after a page reload —
  useEffect(() => {
    const s = loadSession();
    if (!s || Date.now() - s.lastActive > IDLE_LOGOUT_MS || s.mode !== mode) {
      clearSession();
      setBooting(false);
      return;
    }
    const cached = loadDb(s.mode);
    if (cached) {
      setAuth({ role: 't', ...s });
      setDb(cached);
      setBooting(false);
    } else if (s.mode === 'sheets' && s.token) {
      openSheets(apiUrl, s.token, s.username, () => newDb(currentTerm().year, []))
        .catch((e) => endSession(apiMessage(e)))
        .finally(() => setBooting(false));
    } else if (s.mode === 'local' && hasLocalAccount()) {
      setAuth({ role: 't', ...s });
      setDb(newDb(currentTerm().year, []));
      setBooting(false);
    } else {
      clearSession();
      setBooting(false);
    }
    // Only on first load.
  }, []);

  // — idle logout for teachers —
  useEffect(() => {
    if (!auth || auth.role !== 't') return;
    let last = Date.now();
    const bump = () => {
      const now = Date.now();
      if (now - last < 15000) return;
      last = now;
      const s = loadSession();
      if (s) saveSession({ ...s, lastActive: now });
    };
    const evs = ['pointerdown', 'keydown', 'scroll', 'touchstart'];
    evs.forEach((e) => window.addEventListener(e, bump, { passive: true }));
    const t = setInterval(() => {
      const s = loadSession();
      if (s && Date.now() - s.lastActive > IDLE_LOGOUT_MS) {
        flush().finally(() => endSession('ออกจากระบบอัตโนมัติเนื่องจากไม่มีการใช้งานนานเกิน 30 นาที'));
      }
    }, 30000);
    return () => {
      evs.forEach((e) => window.removeEventListener(e, bump));
      clearInterval(t);
    };
  }, [auth, endSession, flush]);

  // Warn before closing the tab with unsent changes.
  useEffect(() => {
    const on = (e: BeforeUnloadEvent) => {
      if (dirty.current.size) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', on);
    return () => window.removeEventListener('beforeunload', on);
  }, []);

  // — data operations (teacher) —

  const year = db?.current ?? '';
  const students = useMemo(() => (db ? db.years[db.current].students : []), [db]);

  const updateStudents = useCallback((fn: (list: Student[]) => Student[]) => {
    const d = dbRef.current;
    if (!d) return;
    const y = d.current;
    const next: DB = { ...d, years: { ...d.years, [y]: { students: fn(d.years[y].students), updatedAt: new Date().toISOString() } } };
    dbRef.current = next;
    commit(next, [y]);
  }, [commit]);

  const updateStudent = useCallback((id: string, fn: (s: Student) => Student) => {
    updateStudents((list) => list.map((s) => (s.id === id ? fn(s) : s)));
  }, [updateStudents]);

  const switchYear = useCallback((y: string) => {
    const d = dbRef.current;
    if (!d || !d.years[y] || y === d.current) return;
    setDb({ ...d, current: y });
    clearMemoryState();
    toast('แสดงข้อมูลปีการศึกษา ' + y);
  }, [toast]);

  const startYear = useCallback((y: string, list: Student[]) => {
    const d = dbRef.current;
    if (!d) return;
    commit({ current: y, years: { ...d.years, [y]: { students: list, updatedAt: new Date().toISOString() } } }, [y]);
    clearMemoryState();
  }, [commit]);

  const deleteYear = useCallback(async (y: string) => {
    const d = dbRef.current;
    const a = authRef.current;
    if (!d || y === d.current) return;
    if (a?.role === 't' && a.mode === 'sheets' && a.token) {
      try {
        await sheetsApi.deleteYear(apiUrl, a.token, y);
      } catch (e) {
        toast('ลบใน Google Sheets ไม่สำเร็จ: ' + apiMessage(e));
        return;
      }
    }
    const years = { ...d.years };
    delete years[y];
    dirty.current.delete(y);
    setDb({ ...d, years });
    toast('ลบปีการศึกษา ' + y + ' แล้ว');
  }, [apiUrl, toast]);

  const replaceDb = useCallback((next: DB) => {
    commit(normaliseDb(next), Object.keys(next.years));
    clearMemoryState();
  }, [commit]);

  const resetAllLocal = useCallback(() => {
    clearDb('local');
    const data = newDb('2569', makeSampleStudents());
    commit(data, []);
    clearMemoryState();
  }, [commit]);

  // — student / parent portal —

  const codeLogin = useCallback(async (role: 's' | 'p', raw: string) => {
    const code = raw.trim().toUpperCase();
    if (!code) throw new ApiError('code');
    if (mode === 'sheets') {
      const { student } = await sheetsApi.codeLogin(apiUrl, role, code);
      setAuth({ role, sid: student.sid, name: student.pre + student.fn, code, remote: true });
    } else {
      const d = loadDb('local');
      const s = d?.years[d.current].students.find((x) => (role === 's' ? x.sc : x.pc).toUpperCase() === code);
      if (!s) throw new ApiError('code');
      setAuth({ role, sid: s.id, name: s.pre + s.fn, code, remote: false });
    }
    setLoginNotice('');
    window.scrollTo(0, 0);
  }, [apiUrl, mode]);

  const submitPortal = useCallback(async (rec: SdqRecord, severity: string) => {
    const a = authRef.current;
    if (!a || a.role === 't') return;
    if (a.remote) {
      await sheetsApi.submitSdq(apiUrl, { role: a.role, code: a.code, ans: rec.ans, sc: rec, severity, imp: rec.imp || {} });
      return;
    }
    const d = loadDb('local');
    if (!d) throw new ApiError('code');
    const list = d.years[d.current].students.map((s) => (s.id === a.sid ? { ...s, sdq3: { ...s.sdq3, [a.role]: rec } } : s));
    saveDb('local', { ...d, years: { ...d.years, [d.current]: { students: list, updatedAt: new Date().toISOString() } } });
  }, [apiUrl]);

  const portalLogout = useCallback(() => {
    clearMemoryState();
    setAuth(null);
    window.scrollTo(0, 0);
  }, []);

  return {
    apiUrl, mode, auth, db, year, students, route, go, booting,
    toastMsg, toast, confirmState, setConfirm, ask, sync, flush, loginNotice,
    loginLocal, setupLocal, resetLocal, loginSheets, setupSheets, resetSheets, logout, changePassword,
    connectSheets, disconnectSheets, pullResponses, pushNow, reloadFromSheets,
    updateStudents, updateStudent, switchYear, startYear, deleteYear, replaceDb, resetAllLocal,
    codeLogin, submitPortal, portalLogout,
  };
}

export type Store = ReturnType<typeof useStoreValue>;
const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const v = useStoreValue();
  return <Ctx.Provider value={v}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const v = useContext(Ctx);
  if (!v) throw new Error('useStore outside StoreProvider');
  return v;
}
