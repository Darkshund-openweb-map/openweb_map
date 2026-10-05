// 하나의 생태계 섬에 타일·이름표·플랫폼 라벨을 묶어 표시하는 컴포넌트
'use client';

import styles from '@/styles/map.module.css';
import { useState, type KeyboardEvent } from 'react';
import type { Category, CategoryId, Platform, Selection } from '@/lib/ecosystem-types';
import { MAP_ELEVATION, type HexCell } from './geometry';
import { IslandTiles } from './island-tiles';
import { platformLabel } from '@/lib/platform-label';
import { getTerritoryCenters } from '@/lib/island-territories';

type Props = {
  category: Category;
  cells: HexCell[];
  owners: Map<string, string>;
  platforms: Platform[];
  selected: Selection;
  activePlatformIds: Set<string>;
  dimmed: boolean;
  onHoverPlatform: (id: string | null) => void;
  onSelectCategory: (id: CategoryId) => void;
  onSelectPlatform: (id: string) => void;
};

export function IslandGroup({
  category,
  cells,
  owners,
  platforms,
  selected,
  activePlatformIds,
  dimmed,
  onHoverPlatform,
  onSelectCategory,
  onSelectPlatform,
}: Props) {
  const [hoveredOwner, setHoveredOwner] = useState<string | null>(null);
  const [islandHovered, setIslandHovered] = useState(false);
  const territoryCenters = getTerritoryCenters(cells, owners);
  const badgeWidth = Math.max(
    84,
    Array.from(category.name).reduce(
      (width, char) => width + (/[가-힣]/.test(char) ? 14.5 : 8.2),
      0,
    ) +
      String(category.count).length * 8.5 +
      44,
  );
  const tileBounds = cells.reduce(
    (bounds, cell) => ({
      minX: Math.min(bounds.minX, cell.x),
      maxX: Math.max(bounds.maxX, cell.x),
      minY: Math.min(bounds.minY, cell.y),
    }),
    { minX: Infinity, maxX: -Infinity, minY: Infinity },
  );
  const badgeX = (tileBounds.minX + tileBounds.maxX) / 2;
  const badgeY = tileBounds.minY - 36;
  const selectCategory = () => onSelectCategory(category.id);
  const onCategoryKeyDown = (event: KeyboardEvent<SVGGElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      selectCategory();
    }
  };
  const activePlatformIsHere =
    selected?.kind === 'platform' &&
    Array.from(owners.values()).some((owner) => activePlatformIds.has(owner));
  const islandSelected =
    (selected?.kind === 'category' && selected.id === category.id) || activePlatformIsHere;
  const hoverPlatform = (id: string | null) => {
    setHoveredOwner(id);
    onHoverPlatform(id);
  };
  return (
    <g
      opacity={islandHovered ? 1 : dimmed ? 0.18 : 1}
      data-island-id={category.id}
      data-selected={islandSelected}
    >
      <g
        className={styles['island-tiles']}
        filter={`url(#island-glow-${category.id})`}
        role="button"
        tabIndex={0}
        aria-label={`${category.name} 섬 선택`}
        onKeyDown={onCategoryKeyDown}
      >
        <IslandTiles
          category={category}
          cells={cells}
          selected={selected}
          activePlatformIds={activePlatformIds}
          dimmed={dimmed}
          owners={owners}
          hoveredOwner={hoveredOwner}
          islandHovered={islandHovered}
          onHoverOwner={hoverPlatform}
          onSelectCategory={selectCategory}
          onSelectPlatform={onSelectPlatform}
        />
      </g>
      <g
        className={styles['island-badge']}
        data-hovered={islandHovered}
        transform={`translate(${badgeX},${badgeY})`}
        role="button"
        tabIndex={0}
        aria-label={`${category.name} ${category.count}건`}
        onPointerEnter={() => setIslandHovered(true)}
        onPointerLeave={() => setIslandHovered(false)}
        onClick={(event) => {
          event.stopPropagation();
          selectCategory();
        }}
        onKeyDown={onCategoryKeyDown}
      >
        <rect
          className={styles['island-title-box']}
          x={-badgeWidth / 2}
          y="-16"
          width={badgeWidth}
          height="32"
          rx="16"
          style={islandHovered ? { fill: category.color, stroke: category.color } : undefined}
          aria-hidden="true"
        />
        <text
          className={styles['island-title-text']}
          textAnchor="middle"
          y="5"
          fontSize="14.5"
          fontWeight={islandHovered ? '800' : '700'}
          fill={islandHovered ? '#ffffff' : category.color}
        >
          {category.name}
          <tspan dx="9" fontWeight="500" fill={islandHovered ? '#ffffff' : '#62718b'}>
            {category.count}건
          </tspan>
        </text>
      </g>
      {platforms
        .filter(
          (item) =>
            item.category === category.id &&
            (selected?.kind !== 'platform' || activePlatformIds.has(item.id)) &&
            (item.featured || (selected?.kind === 'platform' && selected.id === item.id)),
        )
        .map((platform) => {
          if (selected?.kind === 'category' && selected.id !== category.id) return null;
          const active = selected?.kind === 'platform' && selected.id === platform.id;
          const elevated =
            activePlatformIds.has(platform.id) ||
            (selected?.kind === 'category' && selected.id === category.id);
          const { text: label, width } = platformLabel(platform.name);
          const center = territoryCenters.get(platform.id) ?? platform;
          return (
            <g
              key={platform.id}
              className={styles['platform-label']}
              data-platform-id={platform.id}
              data-selected={active}
              transform={`translate(${center.x},${center.y - (elevated ? MAP_ELEVATION : 0)})`}
              role="button"
              tabIndex={0}
              aria-label={`${platform.name} 영토 선택`}
              onPointerEnter={() => hoverPlatform(platform.id)}
              onPointerLeave={() => hoverPlatform(null)}
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
                className={styles['platform-label-box']}
                x={-width / 2}
                y="-10"
                width={width}
                height="20"
                rx="10"
                aria-hidden="true"
              />
              <text
                className={styles['map-label-text']}
                textAnchor="middle"
                y="5"
                fontSize="14.5"
                fontWeight={active ? '700' : '600'}
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
