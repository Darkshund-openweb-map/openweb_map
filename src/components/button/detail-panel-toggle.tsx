// 열린 상세 패널을 접는 원형 화살표 버튼 컴포넌트
import styles from '@/styles/explorer.module.css';

export function DetailPanelToggle({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <button
      className={[styles['panel-handle'], open ? styles['open'] : styles['closed']].join(' ')}
      aria-label={open ? '상세 패널 접기' : '상세 패널 열기'}
      aria-expanded={open}
      onClick={onToggle}
    >
      <svg viewBox="0 0 8 10" aria-hidden="true">
        <path d="M6 1 2 5l4 4" />
      </svg>
    </button>
  );
}
