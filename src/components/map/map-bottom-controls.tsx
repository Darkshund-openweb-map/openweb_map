// 지도 하단의 안내 문구와 확대·축소·전체 보기 버튼을 제공하는 컴포넌트
import styles from '@/styles/map.module.css';
import type { Selection } from '@/lib/ecosystem-types';

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
