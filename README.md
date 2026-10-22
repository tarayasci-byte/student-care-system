# ระบบดูแลช่วยเหลือนักเรียน (Student Care System)

Student care system for ชั้นประถมศึกษาปีที่ 4, โรงเรียนบ้านคลองขุด (สพป.กำแพงเพชร เขต 2):
SDQ screening, home visits, help/referral records and summary reports, with Google Sheets storage and a
student/parent SDQ portal.

- `app/`: the web app (React + Vite). See [`app/README.md`](app/README.md) for setup, Google Sheets and publishing.
- `.github/workflows/pages.yml`: publishes the app to GitHub Pages on every push to `main`.

This repository is public and must never contain real student data. Real records live only in the
teacher's Google Sheet. The app ships with fictional sample students.
