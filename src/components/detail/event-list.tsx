'use client';

import type { EcosystemEvent } from '@/lib/ecosystem-types';
import { useIncidentPopup } from '@/hooks/use-incident-popup';
import { EventDescriptionPopup } from './event-description-popup';
import styles from '@/styles/detail-panel.module.css';

type Props = {
  groups: Map<string, EcosystemEvent[]>;
  selectedId?: string | null;
  onSelect: (id: string) => void;
};

export function EventList({ groups, selectedId, onSelect }: Props) {
  const { popup, popupRef, closeButtonRef, open, close } = useIncidentPopup();
  return (
    <>
      <div className={styles.timeline}>
        {[...groups].map(([month, entries]) => (
          <div key={month}>
            <div className={styles['timeline-month']}>{month}</div>
            {entries.map((event) => (
              <button
                key={event.id}
                className={[styles['timeline-item'], selectedId === event.id ? styles.active : '']
                  .filter(Boolean)
                  .join(' ')}
                aria-pressed={selectedId === event.id}
                aria-haspopup="dialog"
                aria-expanded={popup?.event.id === event.id}
                aria-controls={
                  popup?.event.id === event.id ? `incident-popup-${event.id}` : undefined
                }
                onClick={(click) => {
                  onSelect(event.id);
                  open(event, click.currentTarget);
                }}
              >
                <span className={styles['timeline-dot']} />
                <small>
                  {event.date.slice(5)} <em>{event.type}</em>
                </small>
                <strong>{event.title}</strong>
                <span>{event.meta}</span>
              </button>
            ))}
          </div>
        ))}
        {!groups.size && (
          <div className={styles['empty-inline']}>이 기간에 등록된 사건이 없습니다.</div>
        )}
      </div>
      {popup && (
        <EventDescriptionPopup
          event={popup.event}
          position={popup.position}
          popupRef={popupRef}
          closeButtonRef={closeButtonRef}
          onClose={close}
        />
      )}
    </>
  );
}
