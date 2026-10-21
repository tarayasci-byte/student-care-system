import { useState } from 'react';
import { SCHOOL } from '../config';
import { apiMessage } from '../api/sheets';
import { shortDate } from '../domain/dates';
import { asrLabel, scoreAns, SEVERITY } from '../domain/sdq';
import { Icon } from '../components/Icon';
import { useIsMobile } from '../components/Shell';
import { Card, PrimaryButton } from '../components/ui';
import { useMemoryState } from '../state/memory';
import { useStore, type PortalAuth } from '../state/store';
import { cleanImpact, emptyDraft, ImpactFields, SdqStepCard, type SdqDraft } from './SdqParts';

/** Student/parent view: only their own SDQ form, nothing else in the system. */
export function Portal({ auth }: { auth: PortalAuth }) {
  const { submitPortal, portalLogout } = useStore();
  const mob = useIsMobile();
  const [draft, setDraftRaw] = useMemoryState<SdqDraft>('portal.draft', () => emptyDraft(auth.sid));
  const setDraft = (fn: (d: SdqDraft) => SdqDraft) => setDraftRaw(fn);
  const [done, setDone] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const answered = draft.ans.filter((v) => v != null).length;

  const submit = async () => {
    const sc = scoreAns(draft.ans);
    const rec = { ...sc, ans: draft.ans as number[], imp: cleanImpact(draft.imp), date: shortDate() };
    setBusy(true);
    setErr('');
    try {
      await submitPortal(rec, SEVERITY[draft.imp.overall || 0]);
      setDone(shortDate());
      window.scrollTo(0, 0);
    } catch (e) {
      setErr('ส่งไม่สำเร็จ ' + apiMessage(e) + ' คำตอบยังอยู่ครบ กรุณาลองอีกครั้ง');
    }
    setBusy(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', background: 'var(--color-accent-900)', color: 'var(--color-neutral-100)' }}>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', lineHeight: 1.25 }}>
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 17 }}>แบบประเมินจุดแข็งและจุดอ่อน SDQ</span>
          <span style={{ fontSize: 12, color: 'var(--color-neutral-300)' }}>{auth.role === 's' ? 'นักเรียน: ' : 'ผู้ปกครองของ '}{auth.name} · {SCHOOL.grade}</span>
        </div>
        <button type="button" className="btn" style={{ color: 'var(--color-neutral-100)', borderColor: 'color-mix(in srgb, var(--color-neutral-100) 35%, transparent)' }} onClick={portalLogout}>
          <Icon name="logout" />ออกจากระบบ
        </button>
      </header>
      <div style={{ flex: 1, padding: mob ? '16px 14px 28px' : '32px 24px 56px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {!done ? (
            <>
              <div>
                <h2 style={{ margin: '0 0 4px' }}>{asrLabel(auth.role)}</h2>
                <div className="text-muted" style={{ fontSize: 14 }}>ตอบให้ใกล้เคียงความเป็นจริงในช่วง 6 เดือนที่ผ่านมา เลือกคำตอบเดียวในแต่ละข้อ · ตอบแล้ว {answered}/25</div>
              </div>
              <div style={{ height: 4, background: 'var(--color-neutral-200)' }}><div style={{ width: (answered / 25) * 100 + '%', height: '100%', background: 'var(--color-accent)' }} /></div>
              <SdqStepCard asr={auth.role} draft={draft} setDraft={setDraft} compact />
              <Card style={{ padding: '18px 20px', gap: 14 }}>
                <div className="card-title">ผลกระทบของปัญหา</div>
                <ImpactFields asr={auth.role} draft={draft} setDraft={setDraft} />
              </Card>
              {err && <div className="notice-strong" role="alert">{err}</div>}
              <PrimaryButton style={{ alignSelf: 'flex-end' }} disabled={answered < 25 || busy} icon={<Icon name="check" />} onClick={submit}>
                {busy ? 'กำลังส่ง…' : 'ส่งแบบประเมิน'}
              </PrimaryButton>
            </>
          ) : (
            <Card style={{ padding: 32, gap: 12, alignItems: 'flex-start' }}>
              <div className="card-kicker">ส่งแล้ว · {done}</div>
              <h2 style={{ margin: 0 }}>ส่งแบบประเมินเรียบร้อยแล้ว</h2>
              <div style={{ fontSize: 14 }}>ขอบคุณที่ให้ความร่วมมือ ครูประจำชั้นจะเป็นผู้แปลผลและติดต่อกลับหากต้องการข้อมูลเพิ่มเติม</div>
              <PrimaryButton onClick={portalLogout}>ออกจากระบบ</PrimaryButton>
            </Card>
          )}
          <div className="text-muted" style={{ fontSize: 11 }}>บัญชีนี้เข้าถึงได้เฉพาะแบบประเมิน SDQ ของนักเรียนหนึ่งคน คำตอบส่งถึงครูประจำชั้นโดยตรง</div>
        </div>
      </div>
    </div>
  );
}
