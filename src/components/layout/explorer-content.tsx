// 헤더·범례·지도·통계·상세 패널을 현재 탐색 상태에 맞춰 배치하는 컴포넌트
'use client';

import styles from '@/styles/explorer.module.css';
import { useEcosystemData } from '@/hooks/use-ecosystem-data';
import { useExplorerState } from '@/hooks/use-explorer-state';
import { DetailPanel } from '@/components/detail/detail-panel';
import { EcosystemMap } from '@/components/map/ecosystem-map';
import { Statistics } from '@/components/statistics/statistics';
import { AppHeader } from '@/components/header/app-header';
import { ContentHeader } from '@/components/header/content-header';
import { DetailPanelToggle } from '@/components/button/detail-panel-toggle';
import { EmptyScope } from './empty-scope';
import { ExplorerShell } from './explorer-shell';
import { MapLegend } from '@/components/legend/map-legend';

export function ExplorerContent() {
  const state = useExplorerState();
  const { getCategory, getPlatform } = useEcosystemData();
  const category =
    state.selected?.kind === 'category'
      ? getCategory(state.selected.id)
      : state.selected?.kind === 'platform'
        ? getCategory(getPlatform(state.selected.id)?.category ?? 'code')
        : null;
  const platform = state.selected?.kind === 'platform' ? getPlatform(state.selected.id) : null;
  const name = platform?.name ?? category?.name ?? '전체 오픈웹';
  const statistics = state.view === 'statistics';

  return (
    <ExplorerShell>
      <AppHeader
        scope={state.scope}
        onScope={state.changeScope}
        onHome={state.clearSelection}
        onSelectCategory={state.selectCategory}
        onSelectPlatform={state.selectPlatform}
      />
      <div className={styles['app-body']}>
        <MapLegend
          category={category}
          selected={Boolean(state.selected)}
          tab={state.tab}
          statistics={statistics}
          onSelectCategory={state.selectCategory}
        />
        <section className={styles['main-content']} aria-label="오픈웹 생태계 탐색">
          <ContentHeader
            scope={state.scope}
            view={state.view}
            selected={state.selected}
            category={category}
            platformName={platform?.name}
            name={name}
            tab={state.tab}
            selectedRelation={state.selectedRelation}
            detailOpen={state.detailOpen}
            onClear={state.clearSelection}
            onSelectCategory={() => category && state.selectCategory(category.id)}
            onOpenDetail={() => state.setDetailOpen(true)}
            onView={(view) => {
              state.setView(view);
              if (view === 'statistics') state.setDetailOpen(false);
            }}
          />
          {statistics ? (
            <Statistics
              onSelectCategory={state.selectCategory}
              onSelectPlatform={state.selectPlatform}
            />
          ) : state.scope === 'dark' ? (
            <EmptyScope onReturn={() => state.changeScope('open')} />
          ) : (
            <EcosystemMap
              selected={state.selected}
              tab={state.tab}
              showAllRelations={state.showAllRelations}
              selectedRelation={state.selectedRelation}
              onSelectCategory={state.selectCategory}
              onSelectPlatform={state.selectPlatform}
              onSelectRelation={state.selectRelation}
              onClear={state.clearSelection}
              onShowAllRelations={() => state.setShowAllRelations((value) => !value)}
            />
          )}
        </section>
        {!statistics && state.selected && state.detailOpen && (
          <>
            <DetailPanelToggle onClose={() => state.setDetailOpen(false)} />
            <DetailPanel
              selected={state.selected}
              tab={state.tab}
              selectedRelation={state.selectedRelation}
              onTab={state.selectTab}
              onSelectCategory={state.selectCategory}
              onSelectPlatform={state.selectPlatform}
              onSelectRelation={state.selectRelation}
              onDeleted={state.clearSelection}
            />
          </>
        )}
      </div>
    </ExplorerShell>
  );
}
