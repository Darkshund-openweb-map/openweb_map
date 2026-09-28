// 상세 패널의 기간별 추이를 작은 세로 막대 차트로 표시하는 컴포넌트
import styles from '@/styles/detail-panel.module.css';
import sharedStyles from '@/styles/shared.module.css';

export function MiniChart({
  title,
  points,
}: {
  title: string;
  points: { label: string; value: number }[];
}) {
  const max = Math.max(1, ...points.map((point) => point.value));
  return (
    <div className={styles['mini-chart']}>
      <div className={sharedStyles['block-heading']}>{title}</div>
      <div className={styles['chart-bars']}>
        {points.map((point, index) => (
          <span
            key={point.label}
            title={`${point.label} · ${point.value}건`}
            style={{
              height: `${(point.value / max) * 44}px`,
              background: index === points.length - 1 ? '#1867f2' : '#7fbbff',
            }}
          />
        ))}
      </div>
      <div className={styles['chart-axis']}>
        {points
          .filter(
            (_, index) =>
              index % Math.max(1, Math.floor(points.length / 3)) === 0 ||
              index === points.length - 1,
          )
          .map((point) => (
            <span key={point.label}>{point.label}</span>
          ))}
      </div>
    </div>
  );
}
