// ระบบดูแลช่วยเหลือนักเรียน · Apps Script สำหรับ Google Sheets (เวอร์ชัน 2)
//
// วิธีติดตั้ง
// 1. เปิด Google Sheets ที่ใช้เก็บข้อมูล › ส่วนขยาย › Apps Script แล้ววางโค้ดนี้แทนโค้ดเดิมทั้งหมด
// 2. แก้ SETUP_CODE ด้านล่างเป็นรหัสยาว ๆ ที่เดายาก (ใช้ตอนลงทะเบียนบัญชีครูครั้งแรก และตอนลืมรหัสผ่าน)
// 3. การทำให้ใช้งานได้ › รายการใหม่ › เว็บแอป · เรียกใช้ในฐานะ: ฉัน · ผู้มีสิทธิ์เข้าถึง: ทุกคน
//    (ถ้าเคยติดตั้งเวอร์ชันเก่า ให้เลือก จัดการการทำให้ใช้งานได้ › แก้ไข › เวอร์ชันใหม่ เพื่อให้ URL เดิมใช้ได้ต่อ)
// 4. คัดลอก URL ของเว็บแอปไปวางในระบบ (เมนู ข้อมูลและสำรอง › เชื่อมต่อ Google Sheets)
//
// ความปลอดภัย
// - รหัสผ่านครูเก็บเป็นค่าแฮชพร้อม salt ใน Script Properties ไม่เก็บรหัสผ่านจริง
// - การเข้าสู่ระบบของครูได้ session ที่หมดอายุภายใน 6 ชั่วโมง
// - ใส่รหัสผ่านผิด 5 ครั้ง ระบบล็อก 15 นาที
// - นักเรียนและผู้ปกครองใช้รหัสเข้าใช้งาน ทำได้เพียงส่งแบบประเมิน SDQ ของนักเรียนคนนั้น

const SETUP_CODE = 'เปลี่ยนเป็นรหัสตั้งค่าของครู';

const VERSION = 2;
const SH = { roster: 'ระบบ_นักเรียน', sdq: 'ระบบ_SDQ', db: 'ระบบ_ข้อมูล' };
const HEAD = {
  roster: ['ปีการศึกษา', 'รหัสระบบ', 'เลขที่', 'คำนำหน้า', 'ชื่อ', 'นามสกุล', 'อายุ', 'รหัสนักเรียน', 'รหัสผู้ปกครอง'],
  db: ['ปีการศึกษา', 'ข้อมูล (JSON ส่วนที่ 1)', 'บันทึกล่าสุด', 'ข้อมูล (ส่วนต่อ)'],
};
const SESSION_TTL = 6 * 60 * 60; // วินาที (สูงสุดของ CacheService)
const HASH_ROUNDS = 2000;
const CHUNK = 45000; // เซลล์หนึ่งเก็บได้ไม่เกิน 50,000 ตัวอักษร
const LOGIN_MAX_FAIL = 5, LOGIN_LOCK = 15 * 60;
const CODE_MAX_FAIL = 30, CODE_LOCK = 10 * 60;

function doGet() {
  return out_({ ok: true, app: 'student-care', version: VERSION });
}

function doPost(e) {
  let b;
  try { b = JSON.parse(e.postData.contents); } catch (err) { return out_({ ok: false, error: 'bad_request' }); }
  const fn = ACTIONS[b && b.action];
  if (!fn) return out_({ ok: false, error: 'action' });
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    return out_(fn(b));
  } catch (err) {
    if (err && err.apiError) return out_({ ok: false, error: err.apiError });
    return out_({ ok: false, error: 'server', message: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (err) { /* not held */ }
  }
}

const ACTIONS = {
  status: function () {
    return { ok: true, version: VERSION, hasAccount: !!props_().getProperty('T_USER') };
  },

  register: function (b) {
    if (props_().getProperty('T_USER')) fail_('exists');
    checkSetup_(b.setupCode);
    setAccount_(b.username, b.password);
    return { ok: true, session: newSession_() };
  },

  resetPassword: function (b) {
    checkSetup_(b.setupCode);
    setAccount_(b.username, b.password);
    return { ok: true, session: newSession_() };
  },

  login: function (b) {
    const c = cache_();
    if (Number(c.get('login_fail') || 0) >= LOGIN_MAX_FAIL) fail_('locked');
    const p = props_();
    const ok = p.getProperty('T_USER') && String(b.username || '').trim().toLowerCase() === p.getProperty('T_USER') &&
      same_(hash_(String(b.password || ''), p.getProperty('T_SALT')), p.getProperty('T_HASH'));
    if (!ok) {
      c.put('login_fail', String(Number(c.get('login_fail') || 0) + 1), LOGIN_LOCK);
      fail_('password');
    }
    c.remove('login_fail');
    return { ok: true, session: newSession_(), username: p.getProperty('T_USER') };
  },

  logout: function (b) {
    cache_().remove('s_' + String(b.session || ''));
    return { ok: true };
  },

  changePassword: function (b) {
    auth_(b);
    const p = props_();
    if (!same_(hash_(String(b.oldPassword || ''), p.getProperty('T_SALT')), p.getProperty('T_HASH'))) fail_('password');
    setAccount_(p.getProperty('T_USER'), b.newPassword);
    return { ok: true, session: newSession_() };
  },

  load: function (b) {
    auth_(b);
    const years = {};
    sh_('db').getDataRange().getValues().slice(1).forEach(function (r) {
      const y = String(r[0]);
      if (!/^\d{4}$/.test(y)) return;
      const json = [r[1]].concat(r.slice(3)).join('');
      try { years[y] = JSON.parse(json); } catch (err) { /* skip broken rows */ }
    });
    return { ok: true, years: years };
  },

  save: function (b) {
    auth_(b);
    const year = String(b.year || '');
    if (!/^\d{4}$/.test(year) || !b.data) fail_('bad_request');
    const json = JSON.stringify(b.data);
    const parts = [];
    for (let i = 0; i < json.length; i += CHUNK) parts.push(json.slice(i, i + CHUNK));
    const row = [year, parts[0] || '', new Date()].concat(parts.slice(1));
    const db = sh_('db');
    const v = db.getDataRange().getValues();
    let at = -1;
    for (let i = 1; i < v.length; i++) if (String(v[i][0]) === year) { at = i + 1; break; }
    if (at < 0) at = db.getLastRow() + 1;
    db.getRange(at, 1, 1, Math.max(db.getLastColumn(), 3)).clearContent();
    db.getRange(at, 1, 1, row.length).setValues([row]);

    const r = sh_('roster');
    const rv = r.getDataRange().getValues();
    for (let k = rv.length - 1; k >= 1; k--) if (String(rv[k][0]) === year) r.deleteRow(k + 1);
    const rows = (b.roster || []).map(function (x) { return [year, x.sid, x.no, x.pre, x.fn, x.ln, x.age, x.sc, x.pc]; });
    if (rows.length) r.getRange(r.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);

    const cur = props_().getProperty('YEAR');
    if (!cur || Number(year) >= Number(cur)) props_().setProperty('YEAR', year);
    return { ok: true };
  },

  deleteYear: function (b) {
    auth_(b);
    const year = String(b.year || '');
    ['db', 'roster'].forEach(function (k) {
      const s = sh_(k), v = s.getDataRange().getValues();
      for (let i = v.length - 1; i >= 1; i--) if (String(v[i][0]) === year) s.deleteRow(i + 1);
    });
    if (props_().getProperty('YEAR') === year) {
      const left = sh_('db').getDataRange().getValues().slice(1).map(function (r) { return Number(r[0]); }).filter(Boolean);
      if (left.length) props_().setProperty('YEAR', String(Math.max.apply(null, left)));
      else props_().deleteProperty('YEAR');
    }
    return { ok: true };
  },

  responses: function (b) {
    auth_(b);
    const v = sh_('sdq').getDataRange().getValues();
    return { ok: true, rows: v.slice(1).filter(function (r) { return String(r[1]) === String(b.year); }) };
  },

  codeLogin: function (b) {
    const s = findCode_(b.role, b.code);
    return { ok: true, student: { sid: s.sid, pre: s.pre, fn: s.fn } };
  },

  submitSdq: function (b) {
    const s = findCode_(b.role, b.code);
    const ans = b.ans;
    if (!Array.isArray(ans) || ans.length !== 25 || ans.some(function (x) { return [0, 1, 2].indexOf(x) < 0; })) fail_('bad_request');
    const c = b.sc || {};
    sh_('sdq').appendRow([new Date(), s.year, s.sid, s.no, s.pre + s.fn, b.role === 's' ? 'ตนเอง' : 'ผู้ปกครอง']
      .concat(ans, [c.emo, c.con, c.hyp, c.peer, c.pro, c.total, String(b.severity || ''), JSON.stringify(b.imp || {})]));
    return { ok: true };
  },
};

// — helpers —

function out_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
function fail_(code) { throw { apiError: code }; }
function props_() { return PropertiesService.getScriptProperties(); }
function cache_() { return CacheService.getScriptCache(); }

function sh_(key) {
  const ss = SpreadsheetApp.getActive();
  let s = ss.getSheetByName(SH[key]);
  if (!s) {
    s = ss.insertSheet(SH[key]);
    if (key === 'sdq') {
      const h = ['เวลา', 'ปีการศึกษา', 'รหัสระบบ', 'เลขที่', 'ชื่อ', 'ผู้ประเมิน'];
      for (let i = 1; i <= 25; i++) h.push('ข้อ ' + i);
      s.appendRow(h.concat(['อารมณ์', 'เกเร', 'สมาธิ', 'เพื่อน', 'สังคม', 'รวม', 'ความรุนแรง', 'ผลกระทบ (JSON)']));
    } else {
      s.appendRow(HEAD[key]);
    }
  }
  return s;
}

function checkSetup_(code) {
  if (SETUP_CODE === 'เปลี่ยนเป็นรหัสตั้งค่าของครู') fail_('setup_default');
  const c = cache_();
  if (Number(c.get('setup_fail') || 0) >= LOGIN_MAX_FAIL) fail_('locked');
  if (!same_(String(code || ''), SETUP_CODE)) {
    c.put('setup_fail', String(Number(c.get('setup_fail') || 0) + 1), LOGIN_LOCK);
    fail_('setup_code');
  }
  c.remove('setup_fail');
}

function setAccount_(username, password) {
  const u = String(username || '').trim().toLowerCase();
  const pw = String(password || '');
  if (!/^[a-z0-9._-]{3,32}$/.test(u)) fail_('username');
  if (pw.length < 8) fail_('weak_password');
  const salt = Utilities.getUuid();
  const p = props_();
  p.setProperties({ T_USER: u, T_SALT: salt, T_HASH: hash_(pw, salt), T_EPOCH: Utilities.getUuid() });
}

function hash_(pw, salt) {
  const key = Utilities.newBlob(salt + '|' + pw).getBytes();
  let h = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, salt + '|' + pw, Utilities.Charset.UTF_8);
  for (let i = 0; i < HASH_ROUNDS; i++) h = Utilities.computeHmacSha256Signature(h, key);
  return Utilities.base64Encode(h);
}

function same_(a, b) {
  a = String(a); b = String(b || '');
  let d = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) d |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return d === 0;
}

// Changing the password changes T_EPOCH, which ends every older session.
function newSession_() {
  const token = Utilities.getUuid() + Utilities.getUuid();
  cache_().put('s_' + token, props_().getProperty('T_EPOCH'), SESSION_TTL);
  return token;
}

function auth_(b) {
  const key = 's_' + String(b.session || '');
  const ep = cache_().get(key);
  if (!ep || ep !== props_().getProperty('T_EPOCH')) fail_('session');
  cache_().put(key, ep, SESSION_TTL);
}

function findCode_(role, code) {
  const c = cache_();
  if (Number(c.get('code_fail') || 0) >= CODE_MAX_FAIL) fail_('locked');
  const year = props_().getProperty('YEAR');
  const col = role === 's' ? 7 : role === 'p' ? 8 : -1;
  const want = String(code || '').trim().toUpperCase();
  if (col > 0 && year && want) {
    const v = sh_('roster').getDataRange().getValues();
    for (let i = 1; i < v.length; i++) {
      if (String(v[i][0]) === year && String(v[i][col]).toUpperCase() === want) {
        return { year: year, sid: v[i][1], no: v[i][2], pre: v[i][3], fn: v[i][4] };
      }
    }
  }
  c.put('code_fail', String(Number(c.get('code_fail') || 0) + 1), CODE_LOCK);
  fail_('code');
}
