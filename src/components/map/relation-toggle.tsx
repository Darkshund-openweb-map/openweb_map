// 지도에서 전체 관계선 표시 여부를 전환하는 컴포넌트
import styles from '@/styles/map.module.css';

export function RelationToggle({
  active,
  verifiedCount,
  onToggle,
}: {
  active: boolean;
  verifiedCount: number;
  onToggle: () => void;
}) {
  return (
    <div className={styles['map-top-control']}>
      <button
        className={styles['relation-switch']}
        type="button"
        role="switch"
        aria-checked={active}
        onClick={onToggle}
      >
        <span
          className={[styles['switch-track'], active ? styles['on'] : '', '']
            .filter(Boolean)
            .join(' ')}
        >
          <span />
        </span>
        전체 관계 보기
      </button>
      <span>검증 {verifiedCount}건</span>
    </div>
  );
}
