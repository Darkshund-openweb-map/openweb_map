// 하나의 생태계 섬에 타일·이름표·플랫폼 라벨을 묶어 표시하는 컴포넌트
'use client';

import styles from '@/styles/map.module.css';
import { color as d3Color } from 'd3';
import { useState, type KeyboardEvent } from 'react';
import type { Category, CategoryId, Platform, Selection } from '@/lib/ecosystem-types';
import { MAP_ELEVATION, type HexCell } from './geometry';
import { IslandTiles } from './island-tiles';
import { platformLabel } from '@/lib/platform-label';
import { mapLabelArtwork, mapPlatformArtwork } from '@/lib/map-label-artwork';
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
      maxY: Math.max(bounds.maxY, cell.y),
    }),
    { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity },
  );
  const badgeX = (tileBounds.minX + tileBounds.maxX) / 2;
  const badgeY = tileBounds.minY - 36;
  const labelColor = d3Color(category.color)?.brighter(0.5).formatHex() ?? category.color;
  const platformLabels = platforms
    .filter(
      (item) =>
        item.category === category.id &&
        (selected?.kind !== 'platform' || activePlatformIds.has(item.id)) &&
        (item.featured || (selected?.kind === 'platform' && selected.id === item.id)) &&
        (selected?.kind !== 'category' || selected.id === category.id),
    )
    .map((platform) => {
      const active = selected?.kind === 'platform' && selected.id === platform.id;
      const elevated =
        activePlatformIds.has(platform.id) ||
        (selected?.kind === 'category' && selected.id === category.id);
      const { text, width } = platformLabel(platform.name);
      const center = territoryCenters.get(platform.id) ?? platform;
      return {
        platform,
        active,
        text,
        width,
        x: center.x,
        y: center.y - (elevated ? MAP_ELEVATION : 0),
      };
    });
  const artworkWidth = Math.max(300, tileBounds.maxX - tileBounds.minX + 80);
  const artworkHeight = Math.max(220, tileBounds.maxY - tileBounds.minY + 80);
  const artworkX = (tileBounds.minX + tileBounds.maxX - artworkWidth) / 2;
  const artworkY = (tileBounds.minY + tileBounds.maxY - artworkHeight) / 2;
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
          fill="#353a42"
          stroke={islandHovered ? labelColor : '#777f8c'}
          opacity="0"
          pointerEvents="none"
          aria-hidden="true"
        />
        <text
          className={styles['island-title-text']}
          textAnchor="middle"
          y="5"
          fontSize="14.5"
          fontWeight={islandHovered ? '800' : '700'}
          fill={labelColor}
          opacity="0"
          pointerEvents="none"
        >
          {category.name}
          <tspan dx="9" fontWeight="500" fill="#c1c9d4">
            {category.count}건
          </tspan>
        </text>
        <image
          x={-badgeWidth / 2}
          y="-16"
          width={badgeWidth}
          height="32"
          href={mapLabelArtwork({
            text: category.name,
            count: `${category.count}건`,
            color: labelColor,
            width: badgeWidth,
            height: 32,
            highlighted: islandHovered,
          })}
          aria-hidden="true"
        />
      </g>
      {platformLabels.map(({ platform, active, text: label, width, x, y }) => {
          return (
            <g
              key={platform.id}
              className={styles['platform-label']}
              data-platform-id={platform.id}
              data-selected={active}
              transform={`translate(${x},${y})`}
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
                y="-11"
                width={width}
                height="22"
                rx="8"
                fill="#353a42"
                stroke="#777f8c"
                opacity="0"
                pointerEvents="all"
                aria-hidden="true"
              />
              <text
                className={styles['map-label-text']}
                textAnchor="middle"
                y="5"
                fontSize="14.5"
                fontWeight={active ? '700' : '600'}
                fill={labelColor}
                opacity="0"
                pointerEvents="none"
              >
                {label}
              </text>
            </g>
          );
        })}
      {platformLabels.length > 0 && (
        <image
          x={artworkX}
          y={artworkY}
          width={artworkWidth}
          height={artworkHeight}
          href={mapPlatformArtwork({
            labels: platformLabels.map(({ text, x, y, width, active }) => ({
              text,
              x,
              y,
              width,
              highlighted: active,
            })),
            color: labelColor,
            x: artworkX,
            y: artworkY,
            width: artworkWidth,
            height: artworkHeight,
          })}
          pointerEvents="none"
          aria-hidden="true"
        />
      )}
    </g>
  );
}
