import styles from '@/components/map/map.module.css';
import type { KeyboardEvent } from 'react';
import type { Category, CategoryId, Platform, Selection } from '@/lib/ecosystem-types';
import { MAP_ELEVATION, type HexCell } from './geometry';
import { IslandTiles } from './island-tiles';

type Props = {
  category: Category;
  cells: HexCell[];
  platforms: Platform[];
  selected: Selection;
  selectedPlatform?: Platform;
  dimmed: boolean;
  onSelectCategory: (id: CategoryId) => void;
  onSelectPlatform: (id: string) => void;
};

export function IslandGroup({
  category,
  cells,
  platforms,
  selected,
  selectedPlatform,
  dimmed,
  onSelectCategory,
  onSelectPlatform,
}: Props) {
  const selectCategory = () => onSelectCategory(category.id);
  const onCategoryKeyDown = (event: KeyboardEvent<SVGGElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      selectCategory();
    }
  };
  return (
    <g opacity={dimmed ? 0.35 : 1} data-island-id={category.id}>
      <g
        className={styles['island-tiles']}
        role="button"
        tabIndex={0}
        aria-label={`${category.name} 섬 선택`}
        onKeyDown={onCategoryKeyDown}
      >
        <IslandTiles
          category={category}
          cells={cells}
          selected={selected}
          dimmed={dimmed}
          selectedPlatform={selectedPlatform}
          onSelectCategory={selectCategory}
        />
      </g>
      <g
        className={styles['island-badge']}
        transform={`translate(${category.badge[0]},${category.badge[1]})`}
        role="button"
        tabIndex={0}
        aria-label={`${category.name} ${category.count}건`}
        onClick={(event) => {
          event.stopPropagation();
          selectCategory();
        }}
        onKeyDown={onCategoryKeyDown}
      >
        <rect x="-62" y="-12" width="124" height="24" fill="transparent" aria-hidden="true" />
        <text
          className={styles['map-label-text']}
          textAnchor="middle"
          y="3"
          fontSize="10.2"
          fontWeight="700"
          fill="#24344b"
        >
          {category.name}
          <tspan dx="6" fontWeight="500" fill="#62718b">
            {category.count}건
          </tspan>
        </text>
      </g>
      {platforms
        .filter(
          (item) =>
            item.category === category.id &&
            (item.featured || (selected?.kind === 'platform' && selected.id === item.id)),
        )
        .map((platform) => {
          if (selected?.kind === 'category' && selected.id !== category.id) return null;
          const active = selected?.kind === 'platform' && selected.id === platform.id;
          const elevated = active || (selected?.kind === 'category' && selected.id === category.id);
          const fullLabel = platform.id === 'github-gist' ? 'GitHub' : platform.name;
          const label = fullLabel.length > 18 ? `${fullLabel.slice(0, 17)}…` : fullLabel;
          const width = Math.max(28, label.length * (/[가-힣]/.test(label) ? 10 : 6) + 12);
          return (
            <g
              key={platform.id}
              className={styles['platform-label']}
              data-platform-id={platform.id}
              data-selected={active}
              transform={`translate(${platform.x},${platform.y - (elevated ? MAP_ELEVATION : 0)})`}
              role="button"
              tabIndex={0}
              aria-label={`${platform.name} 영토 선택`}
              onClick={(event) => {
                event.stopPropagation();
                if (!active) onSelectPlatform(platform.id);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  event.stopPropagation();
                  if (!active) onSelectPlatform(platform.id);
                }
              }}
            >
              <title>{platform.name}</title>
              <rect
                x={-width / 2}
                y="-12"
                width={width}
                height="24"
                fill="transparent"
                aria-hidden="true"
              />
              <text
                className={styles['map-label-text']}
                textAnchor="middle"
                y="3.3"
                fontSize="10.4"
                fontWeight={active ? '800' : '700'}
                fill="#1e293b"
              >
                {label}
              </text>
            </g>
          );
        })}
    </g>
  );
}
