// 헤더·범례·지도·통계·상세 패널을 현재 탐색 상태에 맞춰 배치하는 컴포넌트
'use client';

import { useEffect, useState } from 'react';
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
import { SnapshotTimeline } from '@/components/timeline/snapshot-timeline';

export function ExplorerContent() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    let savedTheme: string | null = null;
    try {
      savedTheme = window.localStorage.getItem('openweb-map-theme-v2');
    } catch {
      // The theme still works when storage is unavailable.
    }
    const initialTheme = savedTheme === 'light' || savedTheme === 'dark'
      ? savedTheme
      : media.matches ? 'dark' : 'light';
    setTheme(initialTheme);
    document.documentElement.dataset.theme = initialTheme;
    const onSystemThemeChange = (event: MediaQueryListEvent) => {
      try {
        if (window.localStorage.getItem('openweb-map-theme-v2')) return;
      } catch {
        // Continue following the system preference without storage.
      }
      const next = event.matches ? 'dark' : 'light';
      setTheme(next);
      document.documentElement.dataset.theme = next;
    };
    media.addEventListener('change', onSystemThemeChange);
    return () => media.removeEventListener('change', onSystemThemeChange);
  }, []);
  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    try {
      window.localStorage.setItem('openweb-map-theme-v2', next);
    } catch {
      // Keep the in-page theme switch available without storage.
    }
    document.documentElement.dataset.theme = next;
    setTheme(next);
  };
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
        onSelectIncident={state.selectIncident}
        onSelectRelation={state.selectRelation}
      />
      <div className={styles['app-body']}>
        <MapLegend
          category={statistics ? null : category}
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
            theme={theme}
            onToggleTheme={toggleTheme}
          />
          {statistics ? (
            <Statistics
              onSelectCategory={state.selectCategory}
              onSelectPlatform={state.selectPlatform}
              onSelectIncident={state.selectIncident}
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
              onShowAllRelations={state.toggleAllRelations}
            />
          )}
          {state.scope !== 'dark' && <SnapshotTimeline />}
        </section>
        {state.scope !== 'dark' && (
          <>
            <DetailPanelToggle
              open={state.detailOpen}
              onToggle={() => state.setDetailOpen((open) => !open)}
            />
            <DetailPanel
              open={state.detailOpen}
              selected={state.selected}
              tab={state.tab}
              selectedRelation={state.selectedRelation}
              selectedIncidentId={state.selectedIncidentId}
              onTab={state.selectTab}
              onSelectCategory={state.selectCategory}
              onSelectPlatform={state.selectPlatform}
              onSelectRelation={state.selectRelation}
              onIncidentClosed={state.clearSelectedIncident}
            />
          </>
        )}
      </div>
    </ExplorerShell>
  );
}
