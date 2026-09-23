import styles from '@/components/detail-panel/detail-panel.module.css';
import type { DetailTab } from '@/lib/ecosystem-types';

export function DetailTabs({
  tab,
  eventCount,
  relationCount,
  onTab,
}: {
  tab: DetailTab;
  eventCount: number;
  relationCount: number;
  onTab: (tab: DetailTab) => void;
}) {
  const tabs = [
    { id: 'overview' as const, name: '개요', count: undefined },
    { id: 'events' as const, name: '사건', count: eventCount },
    { id: 'connections' as const, name: '연결', count: relationCount },
  ];
  return (
    <div className={styles['detail-tabs']} role="tablist" aria-label="상세 정보">
      {tabs.map((item) => (
        <button
          key={item.id}
          id={`detail-tab-${item.id}`}
          role="tab"
          aria-controls="detail-tab-content"
          aria-selected={tab === item.id}
          className={tab === item.id ? styles['active'] : ''}
          onClick={() => onTab(item.id)}
        >
          {item.name} {item.count !== undefined && <span>{item.count}</span>}
        </button>
      ))}
    </div>
  );
}
