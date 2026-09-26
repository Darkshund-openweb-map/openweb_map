// 상세 패널의 비율 데이터를 가로 막대로 표시하는 컴포넌트
import styles from '@/styles/detail-panel.module.css';
import sharedStyles from '@/styles/shared.module.css';

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
