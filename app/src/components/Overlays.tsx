import { useEffect } from 'react';
import { useStore } from '../state/store';
import { Icon } from './Icon';
import { Corners } from './ui';

export function ConfirmDialog() {
  const { confirmState: c, setConfirm } = useStore();
  const cancel = () => {
    c?.onCancel?.();
    setConfirm(null);
  };
  useEffect(() => {
    if (!c) return;
    const on = (e: KeyboardEvent) => { if (e.key === 'Escape') { c.onCancel?.(); setConfirm(null); } };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }, [c, setConfirm]);
  if (!c) return null;
  return (
    <div className="dialog-backdrop" style={{ zIndex: 40 }} onClick={(e) => { if (e.target === e.currentTarget) cancel(); }}>
      <div className="dialog blueprint" role="alertdialog" aria-modal="true" aria-labelledby="cf-title" style={{ background: 'var(--color-bg)' }}>
        <Corners />
        <div className="dialog-title" id="cf-title">{c.title}</div>
        <div className="dialog-body">{c.body}</div>
        <div className="dialog-actions">
          <button type="button" className="btn btn-secondary" onClick={cancel}>ยกเลิก</button>
          <button type="button" className="btn btn-primary blueprint" autoFocus onClick={() => { setConfirm(null); c.run(); }}>
            <Corners />{c.label}
          </button>
        </div>
      </div>
    </div>
  );
}

export function Toast() {
  const { toastMsg } = useStore();
  if (!toastMsg) return null;
  return (
    <div role="status" style={{
      position: 'fixed', left: '50%', bottom: 84, transform: 'translateX(-50%)', zIndex: 50, display: 'flex', alignItems: 'center', gap: 8,
      padding: '10px 16px', background: 'var(--color-accent-900)', color: 'var(--color-neutral-100)', fontSize: 14, boxShadow: 'var(--shadow-lg)',
      maxWidth: 'calc(100vw - 32px)',
    }}>
      <Icon name="check" />{toastMsg}
    </div>
  );
}
