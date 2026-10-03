'use client';

import { createPortal } from 'react-dom';
import type { CSSProperties, RefObject } from 'react';
import type { EcosystemEvent } from '@/lib/ecosystem-types';
import styles from '@/styles/event-description-popup.module.css';

type Props = {
  event: EcosystemEvent;
  position: CSSProperties;
  popupRef: RefObject<HTMLElement | null>;
  closeButtonRef: RefObject<HTMLButtonElement | null>;
  onClose: () => void;
};

export function EventDescriptionPopup({
  event,
  position,
  popupRef,
  closeButtonRef,
  onClose,
}: Props) {
  return createPortal(
    <section
      ref={popupRef}
      className={styles.popup}
      style={position}
      id={`incident-popup-${event.id}`}
      role="dialog"
      aria-modal="false"
      aria-labelledby={`incident-popup-title-${event.id}`}
    >
      <header className={styles.header}>
        <div className={styles.topline}>
          <span>사건 설명</span>
          <button ref={closeButtonRef} type="button" onClick={onClose} aria-label="사건 설명 닫기">
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
        <h2 id={`incident-popup-title-${event.id}`}>{event.title}</h2>
        <div className={styles.meta}>
          <time dateTime={event.date}>{event.date}</time>
          <span>{event.type}</span>
        </div>
      </header>
      <div className={styles.content}>
        {event.dataTypes.length ? (
          event.dataTypes.map((item) => (
            <section
              key={item.id}
              className={styles.entry}
              aria-label={item.name || '등록된 데이터'}
            >
              <div className={styles.typeHeading}>
                <h3>{item.name || '등록된 데이터'}</h3>
                {item.category && <span>{item.category}</span>}
              </div>
              {item.description.trim() ? (
                <p className={styles.description}>{item.description}</p>
              ) : (
                <p className={styles.empty}>등록된 설명이 없습니다.</p>
              )}
            </section>
          ))
        ) : (
          <p className={styles.empty}>등록된 설명이 없습니다.</p>
        )}
      </div>
    </section>,
    document.body,
  );
}
