'use client';

import styles from '@/components/map/map.module.css';
import { type CategoryId, type DetailTab, type Selection } from '@/lib/ecosystem-types';
import { IslandGroup } from './island-group';
import { MapBottomControls, MapEmptyState, RelationToggle } from './map-controls';
import { RelationEvidence, RelationLayer } from './relation-layer';
import { useMapZoom } from './use-map-zoom';
import { useMapData } from './use-map-data';

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
  selected,
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
    platforms,
    relation,
    activeCategory,
    selectedPlatform,
    relatedCategories,
    tileGroups,
    title,
    verifiedCount,
    selectedVerifiedCount,
    candidateCount,
  } = useMapData(selected, selectedRelation);
  const { svgRef, transform, zoomBy, resetView } = useMapZoom();

  const reset = () => {
    resetView();
    onClear();
  };

  return (
    <div className={styles['map-surface']}>
      <RelationToggle
        active={showAllRelations}
        verifiedCount={verifiedCount}
        onToggle={onShowAllRelations}
      />
      <svg
        ref={svgRef}
        className={styles['ecosystem-svg']}
        viewBox={selected ? '0 0 650 614' : '0 0 846 614'}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="오픈웹 생태계 육각형 지도: 섬과 플랫폼을 선택할 수 있습니다"
        onClick={(event) => {
          if (event.target === event.currentTarget) onClear();
        }}
      >
        <defs>
          <pattern id="map-dots" width="18" height="18" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r=".55" fill="#d8e0ed" />
          </pattern>
          <filter id="island-shadow" x="-20%" y="-20%" width="140%" height="150%">
            <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#233856" floodOpacity=".2" />
          </filter>
          <filter id="badge-shadow" x="-20%" y="-40%" width="140%" height="190%">
            <feDropShadow
              dx="0"
              dy="1"
              stdDeviation="1.5"
              floodColor="#7183a2"
              floodOpacity=".18"
            />
          </filter>
        </defs>
        <rect width="846" height="614" fill="url(#map-dots)" pointerEvents="none" />
        <g data-map-scene transform={`${transform.toString()} translate(${selected ? -75 : 5},0)`}>
          <RelationLayer
            selected={selected}
            showAllRelations={showAllRelations}
            selectedRelation={selectedRelation}
            onSelectRelation={onSelectRelation}
          />
          {tileGroups.map(({ category, cells }) => {
            const relatedIsland =
              selected?.kind === 'platform' && relatedCategories.has(category.id);
            const dimmed = Boolean(
              activeCategory && activeCategory !== category.id && !relatedIsland,
            );
            return (
              <IslandGroup
                key={category.id}
                category={category}
                cells={cells}
                platforms={platforms}
                selected={selected}
                selectedPlatform={selectedPlatform}
                tab={tab}
                dimmed={dimmed}
                onSelectCategory={onSelectCategory}
                onSelectPlatform={onSelectPlatform}
              />
            );
          })}
          {relation && (
            <RelationEvidence relation={relation} onClose={() => onSelectRelation(null)} />
          )}
        </g>
      </svg>
      {selected &&
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
        selected={selected}
        selectedRelation={selectedRelation}
        zoom={transform.k}
        onZoom={zoomBy}
        onReset={reset}
      />
    </div>
  );
}
