import type { Category, CategoryId } from '@/lib/ecosystem-types';
import styles from '@/styles/statistics.module.css';

type Props = {
  categories: Category[];
  active: CategoryId | 'all';
  onSelect: (id: CategoryId | 'all') => void;
};

export function StatisticsCategoryFilter({ categories, active, onSelect }: Props) {
  const filters = [
    { id: 'all' as const, name: '전체', color: undefined },
    ...categories.map((category) => ({
      id: category.id,
      name: category.name,
      color: category.color,
    })),
  ];

  return (
    <div className={styles['category-chips']} role="group" aria-label="통계 플랫폼 유형">
      {filters.map((filter) => (
        <button
          key={filter.id}
          type="button"
          className={active === filter.id ? styles.active : ''}
          aria-pressed={active === filter.id}
          onClick={() => onSelect(filter.id)}
        >
          {filter.color && <i style={{ background: filter.color }} aria-hidden="true" />}
          {filter.name}
        </button>
      ))}
    </div>
  );
}
