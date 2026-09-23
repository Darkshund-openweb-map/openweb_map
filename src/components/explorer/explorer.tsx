'use client';

import styles from '@/components/explorer/explorer.module.css';
import type { EcosystemSnapshot } from '@/lib/ecosystem-types';
import { DetailPanel } from '../detail-panel/detail-panel';
import { AppHeader } from './app-header';
import { ContentHeader } from './content-header';
import { EcosystemDataProvider, useEcosystemData } from './ecosystem-data-context';
import { ExplorerShell } from './explorer-shell';
import { MapLegend } from './map-legend';
import { useExplorerState } from './use-explorer-state';
import { EcosystemMap } from '../map/ecosystem-map';
import { Statistics } from '../statistics/statistics';
import { Button } from '../ui/button';

function ExplorerContent() {
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
            onClear={state.clearSelection}
            onSelectCategory={() => category && state.selectCategory(category.id)}
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
            <div className={styles['empty-scope']}>
              <h2>등록된 다크웹 플랫폼이 없습니다</h2>
              <p>현재 등록된 데이터가 없습니다.</p>
              <Button onClick={() => state.changeScope('open')}>오픈웹으로 돌아가기</Button>
            </div>
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
        {!statistics && state.selected && state.detailOpen ? (
          <>
            <button
              className={[styles['panel-handle'], styles['open']].join(' ')}
              aria-label="상세 패널 접기"
              onClick={() => state.setDetailOpen(false)}
            >
              ‹
            </button>
            <DetailPanel
              selected={state.selected}
              tab={state.tab}
              selectedRelation={state.selectedRelation}
              onTab={state.selectTab}
              onSelectCategory={state.selectCategory}
              onSelectPlatform={state.selectPlatform}
              onSelectRelation={state.selectRelation}
            />
          </>
        ) : (
          <div className={styles['collapsed-panel']}>
            <button
              className={styles['panel-handle']}
              aria-label="상세 패널 펼치기"
              onClick={() => state.setDetailOpen(true)}
            >
              ‹
            </button>
            <span>상세 패널</span>
          </div>
        )}
      </div>
    </ExplorerShell>
  );
}

export function Explorer({ initialData }: { initialData: EcosystemSnapshot }) {
  return (
    <EcosystemDataProvider data={initialData}>
      <ExplorerContent />
    </EcosystemDataProvider>
  );
}
