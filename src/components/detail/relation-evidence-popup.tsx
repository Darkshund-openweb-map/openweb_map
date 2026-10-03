'use client';

import { createPortal } from 'react-dom';
import type { CSSProperties, RefObject } from 'react';
import type { Platform, Relation } from '@/lib/ecosystem-types';
import styles from '@/styles/event-description-popup.module.css';
import sharedStyles from '@/styles/shared.module.css';

const statusNames = { verified: '검토 완료', candidate: '검토 전', excluded: '제외' };

function platformUrl(platform?: Platform) {
  if (!platform?.domain) return null;
  return /^https?:\/\//i.test(platform.domain) ? platform.domain : `https://${platform.domain}`;
}

export function RelationEvidencePopup({
  relation,
  source,
  target,
  position,
  popupRef,
  closeButtonRef,
  onClose,
}: {
  relation: Relation;
  source?: Platform;
  target?: Platform;
  position: CSSProperties;
  popupRef: RefObject<HTMLElement | null>;
  closeButtonRef: RefObject<HTMLButtonElement | null>;
  onClose: () => void;
}) {
  const sourceUrl = platformUrl(source);
  const targetUrl = platformUrl(target);
  const title = `${source?.name ?? relation.source} → ${target?.name ?? relation.target}`;
  return createPortal(
    <section
      ref={popupRef}
      className={styles.popup}
      style={position}
      id={`relation-popup-${relation.id}`}
      role="dialog"
      aria-modal="false"
      aria-labelledby={`relation-popup-title-${relation.id}`}
    >
      <header className={styles.header}>
        <div className={styles.topline}>
          <span>관계 근거</span>
          <button ref={closeButtonRef} type="button" onClick={onClose} aria-label="관계 근거 닫기">
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
              <path
                d="m4 4 8 8M12 4l-8 8"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        <div className={styles['relation-heading']}>
          <h2 id={`relation-popup-title-${relation.id}`}>{title}</h2>
          <span
            className={[
              sharedStyles['status-tag'],
              relation.status === 'verified' ? sharedStyles.good : '',
              relation.status === 'candidate' ? sharedStyles.pending : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {statusNames[relation.status]}
          </span>
        </div>
      </header>
      <div className={styles.content}>
        <dl className={styles['relation-list']}>
          <div>
            <dt>관계 유형</dt>
            <dd>{relation.type}</dd>
          </div>
          <div>
            <dt>관계 레코드</dt>
            <dd>{relation.evidence}건</dd>
          </div>
          <div>
            <dt>최초 관측</dt>
            <dd>{relation.firstSeen}</dd>
          </div>
          <div>
            <dt>최근 관측</dt>
            <dd>{relation.lastSeen}</dd>
          </div>
          <div>
            <dt>근거</dt>
            <dd>{relation.note || '등록된 근거가 없습니다.'}</dd>
          </div>
          <div>
            <dt>검토</dt>
            <dd>{statusNames[relation.status]}</dd>
          </div>
          <div>
            <dt>출발 플랫폼</dt>
            <dd>
              {sourceUrl ? (
                <a href={sourceUrl} target="_blank" rel="noreferrer">
                  {sourceUrl}
                </a>
              ) : (
                '—'
              )}
            </dd>
          </div>
          <div>
            <dt>도착 플랫폼</dt>
            <dd>
              {targetUrl ? (
                <a href={targetUrl} target="_blank" rel="noreferrer">
                  {targetUrl}
                </a>
              ) : (
                '—'
              )}
            </dd>
          </div>
        </dl>
      </div>
    </section>,
    document.body,
  );
}
