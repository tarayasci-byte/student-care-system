# ระบบดูแลช่วยเหลือนักเรียน (Student Care System)

React + Vite implementation of the Claude Design handoff `project/Student Care System v3.dc.html`
(โรงเรียนบ้านคลองขุด · ชั้นประถมศึกษาปีที่ 4). Layout A of the design is used: a dark sidebar on desktop and
bottom tabs on phones, chosen automatically by screen width, with the mono steel-blue status colours from
the Industry design system (`src/styles/industry.css`).

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # unit + UI tests (vitest)
npm run build      # static site in dist/ — host anywhere (GitHub Pages, Netlify, …)
```

## Publishing (GitHub Pages)
`.github/workflows/pages.yml` tests, builds and publishes `app/` on every push to `main`.
One-time setup in the repository settings:
1. **Settings › Pages › Build and deployment › Source: GitHub Actions.** Pages for a private repository
   needs a paid GitHub plan; otherwise make the repository public (it contains only fictional sample data).
2. Optional: **Settings › Secrets and variables › Actions › Variables › New variable** `SHEET_API_URL` =
   the Apps Script `/exec` URL, then re-run the workflow (Actions › Deploy to GitHub Pages › Run workflow).

The site will be at `https://<owner>.github.io/student-care-system/`.

## Screens
Login (teacher / student / parent) · หน้าหลัก · นักเรียน · โปรไฟล์ · คัดกรอง SDQ (results + 3-assessor form) ·
เยี่ยมบ้าน (4 sections + risk score) · ช่วยเหลือ/ส่งต่อ · รายงานสรุป (printable) · ข้อมูลและสำรอง.
Student and parent accounts see only their own SDQ form.

## Teacher account (replaces the demo `arraya` / `1234`)
There are no built-in credentials. On first use the teacher creates a username and password:

- **Local mode** (no Google Sheets connected): the password is stored as a PBKDF2-SHA256 hash in this
  browser. "ลืมรหัสผ่าน" can only reset by wiping this browser's data, so keep backups.
- **Google Sheets mode**: the account lives in the Apps Script's Script Properties (salted, iterated hash).
  Registering and resetting the password both need the `SETUP_CODE` that the teacher sets inside the script,
  so a stranger who finds the web-app URL cannot claim the account. Sessions expire after 6 hours, and
  5 wrong passwords lock login for 15 minutes.

In both modes the teacher is logged out after 30 minutes without activity, and the password can be changed
in ข้อมูลและสำรอง › บัญชีผู้ดูแลระบบ.

## Google Sheets
1. Paste `apps-script/Code.gs` into the spreadsheet's Apps Script (replacing the version 1 script), change
   `SETUP_CODE`, then deploy it as a web app (execute as me, access: anyone). If it was deployed before, use
   *Manage deployments › Edit › New version* so the URL stays the same.
2. In the app: ข้อมูลและสำรอง › เชื่อมต่อ Google Sheets › paste the `/exec` URL › ตรวจสอบ › register with the
   `SETUP_CODE` (or sign in). Data is then saved to the sheet automatically. The browser keeps only a
   tab-scoped copy, which is cleared on logout.
3. For parents and students on their own phones, build with the URL baked in:
   `VITE_SHEET_API_URL=https://script.google.com/macros/s/…/exec npm run build` (see `.env.example`).

The script keeps the existing tabs: `ระบบ_นักเรียน` (roster and login codes), `ระบบ_SDQ` (one row per
parent/student submission) and `ระบบ_ข้อมูล` (teacher data per school year, split across cells when large).
Data the version 1 script already saved in `ระบบ_ข้อมูล` is read as is.

## Data and privacy
- The repository contains **fictional sample students only** (`src/data/sample.ts`). Real data stays in the
  teacher's Google Sheet or browser.
- The home-visit form omits parents' names, phone numbers, jobs, incomes, address, ID number and birth date.
  Photo boxes are placeholders that point to DMC; nothing is uploaded.
- SDQ wording, reverse-scored items (7, 11, 14, 21, 25) and per-assessor cut-offs follow the attached form.
  A student's group is the more serious of the teacher's SDQ total and the home-visit risk score.
