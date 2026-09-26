// 선택 영역에 표시할 관계가 없을 때 안내를 제공하는 컴포넌트
import styles from '@/styles/map.module.css';
import { Button } from '@/components/button/button';

export function MapEmptyState({
  kind,
  title,
  candidateCount,
  onReview,
}: {
  kind: 'category' | 'platform';
  title: string;
  candidateCount: number;
  onReview: () => void;
}) {
  return (
    <div className={styles['map-empty-card']}>
      <strong>
        {kind === 'category' ? '섬 사이 연결선이 없습니다' : '검증 완료된 관계가 없습니다'}
      </strong>
      <p>
        {kind === 'category' ? (
          <>
            섬 연결선은 검증 완료된 플랫폼 연결을 다시 집계한 값입니다.
            <br />
            {title}에는 검증 완료 관계가 0건이라 그릴 선이 없습니다.
          </>
        ) : (
          <>
            {title}에서 출발하거나 도착하는 관계 중 검증을 끝낸 건이 없어 연결선은 그리지 않습니다.
            <br />
            후보 관계는 전체 관계 보기에서 확인할 수 있습니다.
          </>
        )}
      </p>
      {candidateCount > 0 && <Button onClick={onReview}>후보 관계 {candidateCount}건 보기</Button>}
    </div>
  );
}
