'use client';

import { useEffect, useId, useRef } from 'react';
import { useDataAccessRequest } from '@/hooks/use-data-access-request';
import { requestFieldLimits } from '@/lib/data-access-request';
import styles from '@/styles/data-access-request.module.css';

export function DataAccessRequestDialog({ onClose }: { onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const hintId = useId();
  const { status, error, submit } = useDataAccessRequest();
  const sending = status === 'sending';
  const successRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  useEffect(() => {
    if (status === 'success') successRef.current?.focus();
  }, [status]);

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby={titleId}
      aria-describedby={hintId}
      onCancel={(event) => {
        event.preventDefault();
        if (!sending) onClose();
      }}
    >
      <div className={styles.dialogHeader}>
        <div>
          <span className={styles.dialogEyebrow}>WEB SCOPE · DATA ACCESS</span>
          <h2 id={titleId}>조회 요청</h2>
          <p id={hintId}>어떤 자료가 필요한지, 어디에 사용할지 알려주세요.</p>
        </div>
        <button
          type="button"
          className={styles.close}
          onClick={onClose}
          aria-label="닫기"
          disabled={sending}
        >
          ×
        </button>
      </div>

      {status === 'success' ? (
        <div className={styles.success}>
          <div role="status">
            <span className={styles.successIcon} aria-hidden="true">
              ✓
            </span>
            <h3 ref={successRef} tabIndex={-1}>
              신청을 보냈습니다.
            </h3>
            <p>
              요청 내용이 접수되었습니다.
              <br />
              담당자가 확인 후 입력한 이메일로 회신합니다.
            </p>
          </div>
          <div className={styles.actions}>
            <button type="button" className={styles.submit} onClick={onClose}>
              확인
            </button>
          </div>
        </div>
      ) : (
        <form className={styles.form} onSubmit={(event) => void submit(event)} aria-busy={sending}>
          <fieldset className={styles.fields} disabled={sending}>
            <div className={styles.twoColumns}>
              <label>
                <span className={styles.fieldLabel}>
                  이름 <b aria-hidden="true">*</b>
                </span>
                <input
                  name="full_name"
                  autoComplete="name"
                  required
                  maxLength={requestFieldLimits.full_name}
                  placeholder="성함"
                />
              </label>
              <label>
                <span className={styles.fieldLabel}>
                  소속 <small>선택</small>
                </span>
                <input
                  name="organization"
                  autoComplete="organization"
                  maxLength={requestFieldLimits.organization}
                  placeholder="기관·팀 등"
                />
              </label>
            </div>
            <label>
              <span className={styles.fieldLabel}>
                회신 이메일 <b aria-hidden="true">*</b>
              </span>
              <input
                name="reply_email"
                type="email"
                autoComplete="email"
                required
                maxLength={requestFieldLimits.reply_email}
                placeholder="name@example.com"
              />
            </label>
            <label>
              <span className={styles.fieldLabel}>
                필요한 자료 <b aria-hidden="true">*</b>
              </span>
              <textarea
                name="requested_data"
                required
                maxLength={requestFieldLimits.requested_data}
                rows={3}
                placeholder="원하는 데이터의 범위와 주제를 적어주세요."
              />
            </label>
            <label>
              <span className={styles.fieldLabel}>
                이용 목적 <b aria-hidden="true">*</b>
              </span>
              <textarea
                name="usage_purpose"
                required
                maxLength={requestFieldLimits.usage_purpose}
                rows={3}
                placeholder="연구, 취재, 서비스 개발 등 어떻게 활용할 계획인가요?"
              />
            </label>
            <label className={styles.consent}>
              <input type="checkbox" name="contact_consent" required />
              <span>회신을 위해 입력한 연락처와 요청 내용을 팀에 전달하는 데 동의합니다.</span>
            </label>
          </fieldset>
          <p className={styles.deliveryNote}>
            신청 내용은 담당자 확인을 위해 저장되며, 다른 방문자에게 공개되지 않습니다.
          </p>
          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}
          <div className={styles.actions}>
            <button type="button" className={styles.cancel} onClick={onClose} disabled={sending}>
              취소
            </button>
            <button type="submit" className={styles.submit} disabled={sending}>
              {sending ? '보내는 중…' : '신청 보내기'}
            </button>
          </div>
        </form>
      )}
    </dialog>
  );
}
