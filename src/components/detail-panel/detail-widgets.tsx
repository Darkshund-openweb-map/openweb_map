import styles from '@/components/detail-panel/detail-panel.module.css';
import sharedStyles from '@/components/ui/shared.module.css';
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

export function Bars({
  items,
  caption,
}: {
  items: { name: string; value: number }[];
  caption: string;
}) {
  return (
    <div className={styles['bars-block']}>
      <div className={sharedStyles['block-heading']}>
        {caption}
        <span>전체 대비</span>
      </div>
      {items.map((item, index) => (
        <div className={styles['bar-row']} key={item.name}>
          <div>
            <span>{item.name}</span>
            <span>{item.value}%</span>
          </div>
          <div className={styles['bar-track']}>
            <span
              style={{
                width: `${Math.max(0, Math.min(item.value, 100))}%`,
                background: index === 0 ? '#2865e8' : '#8ec7ff',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

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
