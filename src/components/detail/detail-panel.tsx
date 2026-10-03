// 선택 항목의 개요·사건·연결 탭을 담는 상세 패널 컴포넌트
'use client';

import styles from '@/styles/detail-panel.module.css';
import type { DetailTab, Selection } from '@/lib/ecosystem-types';
import { DetailConnections } from './detail-connections';
import { DetailOverview } from './detail-overview';
import { DetailTabs } from './detail-tabs';
import { EventTimeline } from './event-timeline';
import { useDetailData } from '@/hooks/use-detail-data';
import { CategoryPlatformAdd, PlatformActions } from '@/components/platform/platform-actions';

type Props = {
  open: boolean;
  selected: Selection;
  tab: DetailTab;
  selectedRelation: string | null;
  selectedIncidentId: string | null;
  onTab: (tab: DetailTab) => void;
  onSelectPlatform: (id: string) => void;
  onSelectRelation: (id: string | null) => void;
  onIncidentClosed: () => void;
};

export function DetailPanel({
  open,
  selected,
  tab,
  selectedRelation,
  selectedIncidentId,
  onTab,
  onSelectPlatform,
  onSelectRelation,
  onIncidentClosed,
}: Props) {
  const data = useDetailData(selected);
  if (!selected || !data.category) return null;
  const { category, platform, title, eventCount, relations } = data;
  return (
    <aside
      className={[styles['detail-panel'], open ? styles.open : styles.closed].join(' ')}
      aria-label={`${title} 상세 패널`}
      aria-hidden={!open}
      inert={!open}
      data-detail-panel
    >
      <div
        className={[styles['detail-title'], platform ? styles['with-subtitle'] : '', '']
          .filter(Boolean)
          .join(' ')}
      >
        {!platform && <span className={styles['eyebrow']}>플랫폼 유형 · 선택됨</span>}
        <h2>{title}</h2>
        {platform && (
          <p>
            {category.name} &gt; {title} · 사건 {eventCount}건
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
            relations={relations}
            platforms={data.allPlatforms}
            categories={data.categories}
            referenceDate={data.referenceDate}
            requestedIncidentId={selectedIncidentId}
            onIncidentClosed={onIncidentClosed}
          />
        )}
        {tab === 'connections' && (
          <DetailConnections
            relations={relations}
            selectedRelation={selectedRelation}
            onSelectRelation={onSelectRelation}
          />
        )}
      </div>
      {platform && <PlatformActions key={platform.id} platform={platform} />}
      {!platform && <CategoryPlatformAdd category={category} onSelectPlatform={onSelectPlatform} />}
    </aside>
  );
}
