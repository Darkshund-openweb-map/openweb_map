import styles from '@/components/map/map.module.css';
import type { Selection } from '@/lib/ecosystem-types';
import { Button } from '../ui/button';

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

export function MapBottomControls({
  selected,
  selectedRelation,
  zoom,
  onZoom,
  onReset,
}: {
  selected: Selection;
  selectedRelation: string | null;
  zoom: number;
  onZoom: (factor: number) => void;
  onReset: () => void;
}) {
  return (
    <div className={styles['map-bottom-bar']}>
      <span>
        <i className={styles['hint-dot']} />
        {selectedRelation
          ? '선택한 관계선 강조 · 근거(Evidence) 팝업 표시'
          : selected
            ? '플랫폼을 선택해 사건과 외부 연결을 확인하세요'
            : '섬을 선택해 플랫폼 유형을 탐색하세요'}
      </span>
      <div className={styles['map-actions']}>
        <div className={styles['zoom-buttons']}>
          <button type="button" aria-label="축소" onClick={() => onZoom(1 / 1.25)}>
            −
          </button>
          <output aria-label="확대 배율">{Math.round(zoom * 100)}%</output>
          <button type="button" aria-label="확대" onClick={() => onZoom(1.25)}>
            ＋
          </button>
        </div>
        <button type="button" onClick={onReset}>
          ⌗ 전체 보기
        </button>
      </div>
    </div>
  );
}

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
