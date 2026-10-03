// 플랫폼 유형 탐색과 지도·통계 해석에 필요한 범례를 제공하는 사이드바
import styles from '@/styles/map-legend.module.css';
import { type Category, type CategoryId } from '@/lib/ecosystem-types';
import { useEcosystemData } from '@/hooks/use-ecosystem-data';
import { HexSwatch } from './hex-swatch';

type Props = {
  category: Category | null;
  onSelectCategory: (id: CategoryId) => void;
};

export function MapLegend({ category, onSelectCategory }: Props) {
  const { categories } = useEcosystemData();
  return (
    <aside className={styles.sidebar} aria-label="플랫폼 탐색">
      <h2 className={styles.heading}>지도 안내</h2>
      <p className={styles.subtitle}>플랫폼 유형</p>
      <nav className={styles.list} aria-label="플랫폼 유형">
        {categories.map((item) => (
          <button
            key={item.id}
            type="button"
            className={category?.id === item.id ? styles.active : ''}
            aria-pressed={category?.id === item.id}
            onClick={() => onSelectCategory(item.id)}
          >
            <HexSwatch color={item.color} />
            <span>{item.name}</span>
          </button>
        ))}
      </nav>
      <section className={styles.section} aria-label="연결 상태">
        <h3>연결선 기준</h3>
        <div className={styles.connectionRow}>
          <svg viewBox="0 0 30 12" aria-hidden="true">
            <circle cx="3" cy="6" r="2.5" />
            <path d="M5.5 6h19" />
            <circle cx="27" cy="6" r="2.5" />
          </svg>
          <span className={styles['verified-status']}>검증 완료 관계</span>
        </div>
        <div className={styles.connectionRow}>
          <svg viewBox="0 0 30 12" aria-hidden="true">
            <circle cx="3" cy="6" r="2.5" />
            <path className={styles.dashed} d="M5.5 6h19" />
            <circle cx="27" cy="6" r="2.5" />
          </svg>
          <span>검증 대기 관계</span>
        </div>
        <div className={styles.connectionRow}>
          <svg className={styles.direction} viewBox="0 0 34 16" aria-hidden="true">
            <path className={styles.source} d="m7 1 5.2 3v6L7 13l-5.2-3V4Z" />
            <path className={styles.arrow} d="M14 7h6m-2-2 2 2-2 2" />
            <path className={styles.target} d="m27 1 5.2 3v6L27 13l-5.2-3V4Z" />
          </svg>
          <span>출발 → 도착 플랫폼</span>
        </div>
      </section>
    </aside>
  );
}
