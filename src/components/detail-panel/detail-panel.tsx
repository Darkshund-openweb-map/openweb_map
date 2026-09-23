'use client';

import styles from '@/components/detail-panel/detail-panel.module.css';
import type { CategoryId, DetailTab, Selection } from '@/lib/ecosystem-types';
import { DetailConnections } from './detail-connections';
import { DetailOverview } from './detail-overview';
import { DetailTabs } from './detail-tabs';
import { EventTimeline } from './event-timeline';
import { useDetailData } from './use-detail-data';

type Props = {
  selected: Selection;
  tab: DetailTab;
  selectedRelation: string | null;
  onTab: (tab: DetailTab) => void;
  onSelectPlatform: (id: string) => void;
  onSelectCategory: (id: CategoryId) => void;
  onSelectRelation: (id: string | null) => void;
};

export function DetailPanel({
  selected,
  tab,
  selectedRelation,
  onTab,
  onSelectPlatform,
  onSelectCategory,
  onSelectRelation,
}: Props) {
  const data = useDetailData(selected);
  if (!selected || !data.category) return null;
  const { category, platform, title, eventCount, relations } = data;
  const relation = relations.find((item) => item.id === selectedRelation);
  const relationTitle = relation
    ? `${data.getPlatform(relation.source)?.name ?? relation.source} → ${data.getPlatform(relation.target)?.name ?? relation.target}`
    : '';
  return (
    <aside className={styles['detail-panel']} aria-label={`${title} 상세 패널`}>
      <div
        className={[styles['detail-title'], platform || relation ? styles['with-subtitle'] : '', '']
          .filter(Boolean)
          .join(' ')}
      >
        <span className={styles['eyebrow']}>
          {relation
            ? `관계 · ${relationTitle}`
            : platform
              ? `개별 플랫폼 · ${platform.name.toUpperCase()}`
              : '플랫폼 유형 · 선택됨'}
        </span>
        <h2>{relation ? `${relation.type} ${relation.evidence}건` : title}</h2>
        {(platform || relation) && (
          <p>
            {relation
              ? `선택한 관계 · 신뢰도 ${relation.confidence} · ${relation.status === 'verified' ? '검증 완료' : relation.status === 'excluded' ? '제외' : '검증 대기'}`
              : `${category.name} > ${title} · 사건 ${eventCount}건`}
          </p>
        )}
      </div>
      <DetailTabs
        tab={tab}
        eventCount={eventCount}
        relationCount={data.verifiedCount}
        onTab={onTab}
      />
      <div
        className={styles['detail-scroll']}
        id="detail-tab-content"
        role="tabpanel"
        aria-labelledby={`detail-tab-${tab}`}
      >
        {tab === 'overview' && (
          <DetailOverview
            category={category}
            platform={platform}
            platforms={data.platforms}
            bars={data.bars}
            trend={data.trend}
            eventCount={eventCount}
            latestDate={data.latestEvent?.date}
            onSelectPlatform={onSelectPlatform}
          />
        )}
        {tab === 'events' && (
          <EventTimeline
            key={`${selected.kind}-${selected.id}`}
            title={title}
            events={data.events}
            referenceDate={data.referenceDate}
          />
        )}
        {tab === 'connections' && (
          <DetailConnections
            relations={relations}
            selectedRelation={selectedRelation}
            onSelectRelation={onSelectRelation}
            onSelectCategory={onSelectCategory}
          />
        )}
      </div>
    </aside>
  );
}
