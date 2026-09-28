// 범례와 검색 결과에서 카테고리 색상을 육각형으로 표시하는 컴포넌트
import styles from '@/styles/explorer.module.css';

export function HexSwatch({ color }: { color: string }) {
  return <span className={styles['legend-hex']} style={{ background: color }} />;
}
