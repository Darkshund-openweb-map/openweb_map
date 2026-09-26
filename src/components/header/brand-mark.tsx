// WEB SCOPE 브랜드를 세 개의 육각형으로 표현하는 장식 컴포넌트
import styles from '@/styles/explorer.module.css';

export function BrandMark() {
  return (
    <span className={styles['brand-mark']} aria-hidden="true">
      <i />
      <i />
      <i />
    </span>
  );
}
