// 상세 패널의 단일 핵심 지표를 표시하는 컴포넌트
import styles from '@/styles/detail-panel.module.css';

export function Metric({
  label,
  value,
  caption,
}: {
  label: string;
  value: string;
  caption?: string;
}) {
  return (
    <div className={styles['metric']}>
      <span>{label}</span>
      <strong>{value}</strong>
      {caption && <small>{caption}</small>}
    </div>
  );
}
