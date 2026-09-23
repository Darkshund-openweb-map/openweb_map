'use client';

import styles from '@/components/detail-panel/detail-panel.module.css';
import type { EcosystemEvent } from '@/lib/ecosystem-types';
import { EVENT_PERIODS, useEventTimeline } from './use-event-timeline';

export function EventTimeline({
  title,
  events,
  referenceDate,
}: {
  title: string;
  events: EcosystemEvent[];
  referenceDate: string;
}) {
  const state = useEventTimeline(events, referenceDate);
  return (
    <>
      <div className={styles['section-meta']}>
        {title} 사건 · 최신순 <span>조회 결과 · {state.visibleCount}건</span>
      </div>
      <div className={styles['period-tabs']} role="group" aria-label="사건 조회 기간">
        {EVENT_PERIODS.map((period) => (
          <button
            key={period}
            className={state.period === period ? styles['active'] : ''}
            aria-pressed={state.period === period}
            onClick={() => state.selectPeriod(period)}
          >
            {period}
          </button>
        ))}
      </div>
      <div className={styles['date-picker-wrap']}>
        <button
          className={styles['date-button']}
          aria-expanded={state.dateOpen}
          onClick={() => state.setDateOpen(!state.dateOpen)}
        >
          ▦ &nbsp; {state.range.start || '전체'} – {state.range.end || '전체'} <span>변경 ﹀</span>
        </button>
        {state.dateOpen && (
          <div className={styles['date-popover']}>
            <label>
              시작일{' '}
              <input
                type="date"
                value={state.draftRange.start}
                onChange={(event) =>
                  state.setDraftRange({ ...state.draftRange, start: event.target.value })
                }
              />
            </label>
            <label>
              종료일{' '}
              <input
                type="date"
                value={state.draftRange.end}
                onChange={(event) =>
                  state.setDraftRange({ ...state.draftRange, end: event.target.value })
                }
              />
            </label>
            {state.invalidRange && <p role="alert">종료일은 시작일 이후여야 합니다.</p>}
            <button disabled={state.invalidRange} onClick={state.applyRange}>
              적용
            </button>
          </div>
        )}
      </div>
      <div className={styles['timeline']}>
        {[...state.groups].map(([month, entries]) => (
          <div key={month}>
            <div className={styles['timeline-month']}>{month}</div>
            {entries.map((event) => (
              <button
                key={event.id}
                className={[
                  styles['timeline-item'],
                  state.selectedId === event.id ? styles['active'] : '',
                  '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                aria-pressed={state.selectedId === event.id}
                onClick={() => state.setSelectedId(event.id)}
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
        {!state.visibleCount && (
          <div className={styles['empty-inline']}>이 기간에 등록된 사건이 없습니다.</div>
        )}
      </div>
    </>
  );
}
