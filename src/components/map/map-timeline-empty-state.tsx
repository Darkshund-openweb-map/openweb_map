import styles from '@/styles/map.module.css';

export function MapTimelineEmptyState() {
  return (
    <div className={styles['timeline-empty-state']} role="status" aria-label="사건 없는 지도">
      선택한 시점까지 등록된 사건이 없습니다.
    </div>
  );
}
