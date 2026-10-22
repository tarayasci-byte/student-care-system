import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { App } from '../App';
import { StoreProvider } from '../state/store';

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  window.location.hash = '';
  window.matchMedia = window.matchMedia || ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} }) as unknown as MediaQueryList);
  window.scrollTo = () => {};
});

const renderApp = () => render(<StoreProvider><App /></StoreProvider>);
const type = (label: RegExp, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });

describe('teacher first run (local mode)', () => {
  it('creates an account, logs in, logs out and rejects a wrong password', async () => {
    renderApp();
    expect(screen.getByText('ตั้งค่าบัญชีครูผู้ดูแล')).toBeTruthy();
    type(/^ชื่อผู้ใช้/, 'Teacher1');
    type(/^รหัสผ่าน \(อย่างน้อย/, 'secret123');
    type(/^ยืนยันรหัสผ่าน/, 'secret123');
    fireEvent.click(screen.getByRole('button', { name: /สร้างบัญชีและเข้าสู่ระบบ/ }));
    await waitFor(() => expect(screen.getByText(/สวัสดี/)).toBeTruthy(), { timeout: 10000 });
    expect(localStorage.getItem('scs-teacher-v1')).not.toContain('secret123');
    expect(screen.getByText('การจัดกลุ่มนักเรียน')).toBeTruthy();

    // Navigate to the report and the data screen.
    fireEvent.click(screen.getAllByRole('button', { name: /รายงานสรุป/ })[0]);
    await waitFor(() => expect(screen.getByText('รายงานสรุปผล')).toBeTruthy());

    await act(async () => { fireEvent.click(screen.getAllByTitle('ออกจากระบบ')[0]); });
    await waitFor(() => expect(screen.getByRole('button', { name: /^เข้าสู่ระบบ$/ })).toBeTruthy());

    type(/^ชื่อผู้ใช้/, 'teacher1');
    type(/^รหัสผ่าน$/, 'wrong-password');
    fireEvent.click(screen.getByRole('button', { name: /^เข้าสู่ระบบ$/ }));
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('ไม่ถูกต้อง'), { timeout: 10000 });

    type(/^รหัสผ่าน$/, 'secret123');
    fireEvent.click(screen.getByRole('button', { name: /^เข้าสู่ระบบ$/ }));
    await waitFor(() => expect(screen.getByText(/สวัสดี/)).toBeTruthy(), { timeout: 10000 });
  }, 30000);
});

describe('student portal (local mode)', () => {
  it('signs in with a code and only shows the SDQ form', async () => {
    const { unmount } = renderApp();
    type(/^ชื่อผู้ใช้/, 'teacher1');
    type(/^รหัสผ่าน \(อย่างน้อย/, 'secret123');
    type(/^ยืนยันรหัสผ่าน/, 'secret123');
    fireEvent.click(screen.getByRole('button', { name: /สร้างบัญชีและเข้าสู่ระบบ/ }));
    await waitFor(() => expect(screen.getByText(/สวัสดี/)).toBeTruthy(), { timeout: 10000 });
    const db = JSON.parse(localStorage.getItem('scs-db-v2')!);
    const code = db.years[db.current].students[0].sc;
    await act(async () => { fireEvent.click(screen.getAllByTitle('ออกจากระบบ')[0]); });
    unmount();

    renderApp();
    fireEvent.click(screen.getByLabelText('นักเรียน'));
    type(/^รหัสเข้าใช้งาน/, code.toLowerCase());
    fireEvent.click(screen.getByRole('button', { name: /^เข้าสู่ระบบ$/ }));
    await waitFor(() => expect(screen.getByText('นักเรียนประเมินตนเอง')).toBeTruthy());
    expect(screen.queryByText('ข้อมูลและสำรอง')).toBeNull();
    for (let i = 0; i < 25; i++) fireEvent.click(screen.getAllByRole('button', { name: 'ไม่จริง' })[0]);
    fireEvent.click(screen.getByRole('button', { name: /ส่งแบบประเมิน/ }));
    await waitFor(() => expect(screen.getByText('ส่งแบบประเมินเรียบร้อยแล้ว')).toBeTruthy());
    const after = JSON.parse(localStorage.getItem('scs-db-v2')!);
    expect(after.years[after.current].students[0].sdq3.s.ans).toEqual(Array(25).fill(0));
  }, 30000);
});
