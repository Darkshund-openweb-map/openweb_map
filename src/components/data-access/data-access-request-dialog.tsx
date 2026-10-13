'use client';

import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import styles from '@/styles/data-access-request.module.css';

const recipient = process.env.NEXT_PUBLIC_DATA_ACCESS_EMAIL?.trim() ?? '';

function requestText(values: Record<string, string>) {
  return [
    'WEB SCOPE 조회 요청',
    '',
    `이름: ${values.name}`,
    `소속: ${values.organization || '미기재'}`,
    `회신 이메일: ${values.email}`,
    '',
    '[필요한 자료]',
    values.data,
    '',
    '[이용 목적]',
    values.purpose,
  ].join('\n');
}

export function DataAccessRequestDialog({ onClose }: { onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const hintId = useId();
  const [feedback, setFeedback] = useState('');
  const [manualCopy, setManualCopy] = useState('');

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback('');
    setManualCopy('');

    const form = new FormData(event.currentTarget);
    const value = (key: string) => String(form.get(key) ?? '').trim();
    const values = {
      name: value('name'),
      organization: value('organization'),
      email: value('email'),
      data: value('data'),
      purpose: value('purpose'),
    };

    if (!values.name || !values.email || !values.data || !values.purpose) {
      setFeedback('필수 항목을 모두 입력해 주세요.');
      return;
    }

    const message = requestText(values);
    if (recipient) {
      const subject = encodeURIComponent(`[WEB SCOPE] 조회 요청 - ${values.name}`);
      window.location.href = `mailto:${recipient}?subject=${subject}&body=${encodeURIComponent(message)}`;
      setFeedback('메일 앱에서 보내기를 눌러야 요청이 전달됩니다.');
      return;
    }

    try {
      await navigator.clipboard.writeText(message);
      setFeedback('요청 내용을 복사했습니다. 아직 접수 기능은 연결되지 않았습니다.');
    } catch {
      setManualCopy(message);
      setFeedback('자동 복사가 되지 않아 아래에 요청 내용을 표시했습니다. 직접 복사해 주세요.');
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby={titleId}
      aria-describedby={hintId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className={styles.dialogHeader}>
        <div>
          <span className={styles.dialogEyebrow}>WEB SCOPE · DATA ACCESS</span>
          <h2 id={titleId}>조회 요청</h2>
          <p id={hintId}>어떤 자료가 필요한지, 어디에 사용할지 알려주세요.</p>
        </div>
        <button type="button" className={styles.close} onClick={onClose} aria-label="닫기">
          ×
        </button>
      </div>

      <form
        className={styles.form}
        onSubmit={(event) => void submit(event)}
        onInput={() => setFeedback('')}
      >
        <div className={styles.twoColumns}>
          <label>
            <span className={styles.fieldLabel}>
              이름 <b aria-hidden="true">*</b>
            </span>
            <input name="name" autoComplete="name" required maxLength={60} placeholder="성함" />
          </label>
          <label>
            <span className={styles.fieldLabel}>
              소속 <small>선택</small>
            </span>
            <input
              name="organization"
              autoComplete="organization"
              maxLength={100}
              placeholder="기관·팀 등"
            />
          </label>
        </div>
        <label>
          <span className={styles.fieldLabel}>
            회신 이메일 <b aria-hidden="true">*</b>
          </span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={150}
            placeholder="name@example.com"
          />
        </label>
        <label>
          <span className={styles.fieldLabel}>
            필요한 자료 <b aria-hidden="true">*</b>
          </span>
          <textarea
            name="data"
            required
            maxLength={700}
            rows={3}
            placeholder="원하는 데이터의 범위와 주제를 적어주세요."
          />
        </label>
        <label>
          <span className={styles.fieldLabel}>
            이용 목적 <b aria-hidden="true">*</b>
          </span>
          <textarea
            name="purpose"
            required
            maxLength={700}
            rows={3}
            placeholder="연구, 취재, 서비스 개발 등 어떻게 활용할 계획인가요?"
          />
        </label>
        <label className={styles.consent}>
          <input type="checkbox" required />
          <span>회신을 위해 입력한 연락처와 요청 내용을 팀에 전달하는 데 동의합니다.</span>
        </label>
        <p className={styles.deliveryNote}>
          {recipient
            ? '메일 앱에서 전송을 완료해야 요청이 전달됩니다. 이 페이지에는 입력 내용이 저장되지 않습니다.'
            : '현재는 요청서 미리보기입니다. 제출하면 내용이 복사되며, 팀에는 자동 전달되지 않습니다.'}
        </p>
        {feedback && (
          <p className={styles.feedback} role="status">
            {feedback}
          </p>
        )}
        {manualCopy && (
          <textarea
            className={styles.manualCopy}
            readOnly
            value={manualCopy}
            aria-label="직접 복사할 요청 내용"
          />
        )}
        <div className={styles.actions}>
          <button type="button" className={styles.cancel} onClick={onClose}>
            취소
          </button>
          <button type="submit" className={styles.submit}>
            {recipient ? '메일 초안 열기' : '요청 내용 복사'}
          </button>
        </div>
      </form>
    </dialog>
  );
}
