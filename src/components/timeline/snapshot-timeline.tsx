'use client';

import type { CSSProperties } from 'react';
import { useEcosystemData } from '@/hooks/use-ecosystem-data';
import { timelineTicks } from '@/lib/snapshot-timeline';
import styles from '@/styles/snapshot-timeline.module.css';

export function SnapshotTimeline() {
  const { timeline, events } = useEcosystemData();
  const last = timeline.quarters.length - 1;
  const progress = `${(timeline.index / last) * 100}%`;

  return (
    <section className={styles.timeline} aria-label="지도 타임라인">
      <div className={styles.controls}>
        <button
          type="button"
          className={styles.play}
          aria-label={timeline.playing ? '타임라인 일시정지' : '타임라인 재생'}
          onClick={timeline.togglePlay}
          disabled={!timeline.available}
        >
          <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
            {timeline.playing ? (
              <path d="M5 4h3v12H5zM12 4h3v12h-3z" fill="currentColor" />
            ) : (
              <path d="M6 3.5 16 10 6 16.5Z" fill="currentColor" />
            )}
          </svg>
        </button>
        <div className={styles.speeds} role="group" aria-label="재생 속도">
          {([1, 2, 4] as const).map((speed) => (
            <button
              key={speed}
              type="button"
              aria-label={`${speed}배속`}
              aria-pressed={timeline.speed === speed}
              onClick={() => timeline.setSpeed(speed)}
              disabled={!timeline.available}
            >
              {speed}×
            </button>
          ))}
        </div>
      </div>
      <div className={styles.snapshot}>
        <span>SNAPSHOT</span>
        <output aria-label="선택한 분기" aria-live="off">
          {timeline.current.label}
        </output>
      </div>
      <div className={styles.track}>
        <input
          type="range"
          min={0}
          max={last}
          step={1}
          value={timeline.index}
          disabled={!timeline.available}
          aria-label="지도 기준 시점"
          aria-valuetext={`${timeline.current.label}, ${timeline.current.date}까지 사건 ${events.length}건`}
          aria-describedby="snapshot-timeline-description"
          onPointerDown={timeline.pause}
          onChange={(event) => timeline.seek(Number(event.target.value))}
          style={{ '--timeline-progress': progress } as CSSProperties}
        />
        <div className={styles.ticks} aria-hidden="true">
          {timelineTicks(timeline.quarters.length).map((index, position, indices) => (
            <span
              key={index}
              className={
                position === 0
                  ? styles.first
                  : position === indices.length - 1
                    ? styles.last
                    : undefined
              }
              style={{ left: `${(index / last) * 100}%` }}
            >
              {timeline.quarters[index].label}
            </span>
          ))}
        </div>
      </div>
      <button
        type="button"
        className={styles.reset}
        onClick={timeline.reset}
        disabled={timeline.isLatest && !timeline.playing}
        title={`${timeline.baseline} 기준으로 복귀`}
      >
        <span aria-hidden="true">↻</span> 기준일로
      </button>
      <p className={styles.description} id="snapshot-timeline-description">
        {timeline.available ? (
          <>
            <time dateTime={timeline.current.date}>{timeline.current.date}</time>까지 누적 사건{' '}
            <strong>{events.length}건</strong>
          </>
        ) : (
          '날짜가 있는 사건이나 관계가 등록되면 타임라인을 탐색할 수 있습니다.'
        )}
      </p>
    </section>
  );
}
