// 생태계 섬·플랫폼·관계선과 지도 조작 UI를 조합하는 지도 컴포넌트
'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import styles from '@/styles/map.module.css';
import { type CategoryId, type DetailTab, type Selection } from '@/lib/ecosystem-types';
import { IslandGroup } from './island-group';
import { MapBottomControls } from './map-bottom-controls';
import { MapEmptyState } from './map-empty-state';
import { MapTimelineEmptyState } from './map-timeline-empty-state';
import { RelationToggle } from './relation-toggle';
import { RelationEvidence } from './relation-evidence';
import { RelationLayer } from './relation-layer';
import { useMapZoom } from '@/hooks/use-map-zoom';
import { useMapData } from '@/hooks/use-map-data';
import { AdminLoginDialog } from './admin-login-dialog';
import { useAdmin } from '@/hooks/use-admin';

type Props = {
  selected: Selection;
  tab: DetailTab;
  showAllRelations: boolean;
  selectedRelation: string | null;
  onSelectCategory: (id: CategoryId) => void;
  onSelectPlatform: (id: string) => void;
  onSelectRelation: (id: string | null) => void;
  onClear: () => void;
  onShowAllRelations: () => void;
};

export function EcosystemMap({
  selected: requestedSelection,
  tab,
  showAllRelations,
  selectedRelation,
  onSelectCategory,
  onSelectPlatform,
  onSelectRelation,
  onClear,
  onShowAllRelations,
}: Props) {
  const {
    selected,
    platforms,
    events,
    relations,
    relation,
    activeCategory,
    tileGroups,
    title,
    verifiedCount,
    selectedVerifiedCount,
    candidateCount,
  } = useMapData(requestedSelection, selectedRelation);
  const { svgRef, transform, zoomBy, resetView } = useMapZoom();
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);
  const [hoveredPlatformId, setHoveredPlatformId] = useState<string | null>(null);
  const { isAdmin } = useAdmin();
  const hoveredPlatform = hoveredPlatformId
    ? platforms.find((platform) => platform.id === hoveredPlatformId)
    : undefined;
  const hoveredCategory = hoveredPlatform
    ? tileGroups.find(({ category }) => category.id === hoveredPlatform.category)?.category
    : undefined;
  const hoveredEvents = hoveredPlatform
    ? events.filter((event) => event.platform === hoveredPlatform.id)
    : [];
  const latestHoveredDate = hoveredEvents
    .map((event) => event.date)
    .sort((a, b) => b.localeCompare(a))[0];
  const platformAnchors = useMemo(() => {
    const anchors = new Map<string, { x: number; y: number }>();
    tileGroups.forEach(({ cells, owners }) => {
      const cellByKey = new Map(cells.map((cell) => [cell.key, cell]));
      const territories = new Map<string, typeof cells>();
      owners.forEach((platformId, cellKey) => {
        const cell = cellByKey.get(cellKey);
        if (!cell) return;
        const territory = territories.get(platformId) ?? [];
        territory.push(cell);
        territories.set(platformId, territory);
      });
      territories.forEach((territory, platformId) => {
        anchors.set(platformId, {
          x: territory.reduce((sum, cell) => sum + cell.x, 0) / territory.length,
          y: territory.reduce((sum, cell) => sum + cell.y, 0) / territory.length,
        });
      });
    });
    return anchors;
  }, [tileGroups]);
  const connectedRelations = useMemo(
    () =>
      selected?.kind === 'platform'
        ? relations.filter(
            (item) =>
              item.status !== 'excluded' &&
              (item.source === selected.id || item.target === selected.id),
          )
        : [],
    [relations, selected],
  );
  const activePlatformIds = useMemo(() => {
    const ids = new Set<string>();
    if (selected?.kind !== 'platform') return ids;
    ids.add(selected.id);
    connectedRelations.forEach((item) => {
      ids.add(item.source);
      ids.add(item.target);
    });
    return ids;
  }, [connectedRelations, selected]);
  const activeCategoryIds = useMemo(
    () =>
      new Set(
        platforms
          .filter((platform) => activePlatformIds.has(platform.id))
          .map((platform) => platform.category),
      ),
    [activePlatformIds, platforms],
  );

  const reset = () => {
    resetView();
    onClear();
  };

  return (
    <div className={styles['map-surface']}>
      <div className={styles['admin-button-edge']}>
        <button
          type="button"
          className={styles['admin-map-button']}
          aria-label={isAdmin ? '관리자 메뉴' : '관리자 로그인'}
          onClick={() => setAdminDialogOpen(true)}
        >
          <Image src="/dachshund-logo.png" alt="" width={72} height={28} priority />
        </button>
      </div>
      <RelationToggle
        active={showAllRelations}
        verifiedCount={verifiedCount}
        onToggle={onShowAllRelations}
      />
      <svg
        ref={svgRef}
        className={styles['ecosystem-svg']}
        viewBox={selected ? '0 -30 700 720' : '0 -30 910 720'}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        onClick={(event) => {
          if (event.target === event.currentTarget) reset();
        }}
        aria-label="오픈웹 생태계 육각형 지도: 섬과 플랫폼을 선택할 수 있습니다"
      >
        <defs>
          <pattern id="map-dots" width="18" height="18" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r=".55" fill="#d8e0ed" />
          </pattern>
          <filter id="island-shadow" x="-20%" y="-20%" width="140%" height="160%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#233856" floodOpacity=".2" />
          </filter>
          {tileGroups.map(({ category }) => (
            <filter
              key={category.id}
              id={`island-glow-${category.id}`}
              x="-15%"
              y="-15%"
              width="130%"
              height="130%"
            >
              <feDropShadow
                dx="0"
                dy="0"
                stdDeviation="1.4"
                floodColor={category.color}
                floodOpacity=".18"
              />
            </filter>
          ))}
        </defs>
        <rect
          y="-30"
          width="910"
          height="720"
          fill="url(#map-dots)"
          onClick={(event) => {
            event.stopPropagation();
            reset();
          }}
        />
        <g data-map-scene transform={`${transform.toString()} translate(${selected ? -75 : 5},0)`}>
          {tileGroups.map(({ category, cells, owners }) => {
            const dimmed =
              selected?.kind === 'platform'
                ? !activeCategoryIds.has(category.id)
                : Boolean(activeCategory && activeCategory !== category.id);
            return (
              <IslandGroup
                key={category.id}
                category={category}
                cells={cells}
                owners={owners}
                platforms={platforms}
                selected={selected}
                activePlatformIds={activePlatformIds}
                dimmed={dimmed}
                onHoverPlatform={setHoveredPlatformId}
                onSelectCategory={onSelectCategory}
                onSelectPlatform={onSelectPlatform}
              />
            );
          })}
          <RelationLayer
            relations={relations}
            selected={selected}
            activePlatformIds={activePlatformIds}
            platformAnchors={platformAnchors}
            selectedRelation={selectedRelation}
            onSelectRelation={onSelectRelation}
          />
          {relation && (
            <RelationEvidence relation={relation} onClose={() => onSelectRelation(null)} />
          )}
          {hoveredPlatform && hoveredCategory && (
            <foreignObject
              x={hoveredPlatform.x < 600 ? hoveredPlatform.x + 28 : hoveredPlatform.x - 268}
              y={Math.max(-18, Math.min(530, hoveredPlatform.y - 82))}
              width="240"
              height="176"
              className={styles['platform-hover-card-object']}
              pointerEvents="none"
            >
              <div className={styles['platform-hover-card']} role="tooltip">
                <div
                  className={styles['platform-hover-eyebrow']}
                  style={{ color: hoveredCategory.color }}
                >
                  개별 플랫폼 · {hoveredPlatform.name.toUpperCase()}
                </div>
                <strong className={styles['platform-hover-name']}>{hoveredPlatform.name}</strong>
                <div className={styles['platform-hover-path']}>
                  {hoveredCategory.name} &gt; {hoveredPlatform.name} · 사건 {hoveredEvents.length}건
                </div>
                <div className={styles['platform-hover-metrics']}>
                  <div>
                    <span>전체 사건</span>
                    <b>{hoveredEvents.length}건</b>
                  </div>
                  <div>
                    <span>최근 관측일</span>
                    <b>{latestHoveredDate?.slice(5) ?? '—'}</b>
                  </div>
                </div>
                <p>{hoveredPlatform.description || '등록된 설명이 없습니다.'}</p>
              </div>
            </foreignObject>
          )}
        </g>
      </svg>
      {!tileGroups.length && <MapTimelineEmptyState />}
      {tileGroups.length > 0 &&
        selected &&
        tab === 'connections' &&
        !selectedVerifiedCount &&
        !relation &&
        !showAllRelations && (
          <MapEmptyState
            kind={selected.kind}
            title={title}
            candidateCount={candidateCount}
            onReview={onShowAllRelations}
          />
        )}
      <MapBottomControls
        empty={!tileGroups.length}
        selected={selected}
        selectedRelation={relation?.id ?? null}
        zoom={transform.k}
        onZoom={zoomBy}
        onReset={reset}
      />
      {adminDialogOpen && <AdminLoginDialog onClose={() => setAdminDialogOpen(false)} />}
    </div>
  );
}
