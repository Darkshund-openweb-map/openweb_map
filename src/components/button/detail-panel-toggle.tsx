// 열린 상세 패널을 접는 원형 화살표 버튼 컴포넌트
import styles from '@/styles/explorer.module.css';

export function DetailPanelToggle({ onClose }: { onClose: () => void }) {
  return (
    <button
      className={[styles['panel-handle'], styles['open']].join(' ')}
      aria-label="상세 패널 접기"
      onClick={onClose}
    >
      <svg viewBox="0 0 8 10" aria-hidden="true">
        <path d="M6 1 2 5l4 4" />
      </svg>
    </button>
  );
}
