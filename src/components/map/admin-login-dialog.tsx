'use client';

import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { useAdmin } from '@/hooks/use-admin';
import { Button } from '@/components/button/button';
import styles from '@/styles/platform-editor.module.css';

export function AdminLoginDialog({ onClose }: { onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const { isAdmin, login, logout } = useAdmin();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await login(pin);
      setPin('');
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '로그인에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <dialog
      ref={dialog}
      className={[styles.dialog, styles['admin-dialog']].join(' ')}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <header className={styles.heading}>
        <h2 id={titleId}>관리자 로그인</h2>
        <button type="button" onClick={onClose} aria-label="닫기">
          ×
        </button>
      </header>
      {isAdmin ? (
        <>
          <p className={styles.hint}>
            관리자 기능이 열려 있습니다. 현재 탭을 닫으면 로그인이 해제됩니다.
          </p>
          <footer className={styles['dialog-actions']}>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                logout();
                onClose();
              }}
            >
              로그아웃
            </Button>
          </footer>
        </>
      ) : (
        <form onSubmit={submit}>
          <p className={styles.hint}>관리자 PIN을 입력해 주세요.</p>
          <div className={styles.fields}>
            <label>
              PIN
              <input
                type="password"
                inputMode="numeric"
                autoComplete="off"
                pattern="[0-9]+"
                value={pin}
                onChange={(event) => setPin(event.target.value)}
                autoFocus
                required
              />
            </label>
          </div>
          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}
          <footer className={styles['dialog-actions']}>
            <Button type="button" variant="secondary" onClick={onClose}>
              취소
            </Button>
            <Button type="submit" disabled={busy}>
              로그인
            </Button>
          </footer>
        </form>
      )}
    </dialog>
  );
}
