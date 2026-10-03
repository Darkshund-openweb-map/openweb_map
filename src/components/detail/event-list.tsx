'use client';

import { useEffect, useRef } from 'react';

import type { Category, EcosystemEvent, Platform, Relation } from '@/lib/ecosystem-types';
import { useIncidentPopup } from '@/hooks/use-incident-popup';
import { EventDescriptionPopup } from './event-description-popup';
import styles from '@/styles/detail-panel.module.css';
import sharedStyles from '@/styles/shared.module.css';

type Props = {
  groups: Map<string, EcosystemEvent[]>;
  relations: Relation[];
  platforms: Platform[];
  categories: Category[];
  selectedId?: string | null;
  onSelect: (id: string) => void;
  requestedIncidentId: string | null;
  onIncidentClosed: () => void;
};

export function EventList({
  groups,
  relations,
  platforms,
  categories,
  selectedId,
  onSelect,
  requestedIncidentId,
  onIncidentClosed,
}: Props) {
  const { popup, popupRef, closeButtonRef, open, close } = useIncidentPopup(onIncidentClosed);
  const triggerRefs = useRef(new Map<string, HTMLButtonElement>());
  const platformById = new Map(platforms.map((platform) => [platform.id, platform]));
  const categoryById = new Map(categories.map((category) => [category.id, category]));
  useEffect(() => {
    if (!requestedIncidentId) return;
    const event = [...groups.values()].flat().find((item) => item.id === requestedIncidentId);
    const trigger = triggerRefs.current.get(requestedIncidentId);
    if (!event || !trigger) return;
    onSelect(event.id);
    trigger.scrollIntoView({ block: 'nearest' });
    open(event, trigger);
  }, [groups, onSelect, open, requestedIncidentId]);
  return (
    <>
      <div className={styles.timeline}>
        {[...groups].map(([month, entries]) => (
          <div key={month}>
            <div className={styles['timeline-month']}>{month}</div>
            {entries.map((event) => {
              const connections = relations.filter(
                (relation) =>
                  relation.status !== 'excluded' &&
                  relation.incidentId === event.id &&
                  (relation.source === event.platform || relation.target === event.platform),
              );
              return (
                <button
                  ref={(node) => {
                    if (node) triggerRefs.current.set(event.id, node);
                    else triggerRefs.current.delete(event.id);
                  }}
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
                    {event.date.slice(5)}{' '}
                    <em
                      className={[
                        sharedStyles['status-tag'],
                        event.type === '검토완료' ? sharedStyles.good : '',
                        event.type === '검토중' ? sharedStyles.pending : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      {event.type}
                    </em>
                    {event.exposures.map((exposure) => (
                      <em key={exposure} className={styles['timeline-exposure-tag']}>
                        {exposure}
                      </em>
                    ))}
                  </small>
                  <strong>{event.title}</strong>
                  {connections.length > 0 && (
                    <span className={styles['event-connections']} aria-label="플랫폼 연결 경로">
                      {connections.map((relation) => {
                        const source = platformById.get(relation.source);
                        const target = platformById.get(relation.target);
                        const sourceCategory = source
                          ? categoryById.get(source.category)
                          : undefined;
                        const targetCategory = target
                          ? categoryById.get(target.category)
                          : undefined;
                        return (
                          <span
                            key={relation.id}
                            className={styles['event-connection-pair']}
                            data-connection-path={relation.id}
                            title={`${source?.name ?? relation.source} → ${target?.name ?? relation.target}`}
                          >
                            <i
                              aria-hidden="true"
                              style={{ backgroundColor: sourceCategory?.color ?? '#aab5c5' }}
                            />
                            <span aria-hidden="true">–</span>
                            <i
                              aria-hidden="true"
                              style={{ backgroundColor: targetCategory?.color ?? '#aab5c5' }}
                            />
                          </span>
                        );
                      })}
                    </span>
                  )}
                </button>
              );
            })}
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
