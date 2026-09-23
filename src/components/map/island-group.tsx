import styles from '@/components/map/map.module.css';
import type { KeyboardEvent } from 'react';
import {
  type Category,
  type CategoryId,
  type DetailTab,
  type Platform,
  type Selection,
} from '@/lib/ecosystem-types';
import type { HexCell } from './geometry';
import { IslandTiles } from './island-tiles';

const badgeWidths: Record<CategoryId, number> = {
  code: 90,
  text: 108,
  community: 82,
  cloud: 118,
  files: 92,
  backend: 98,
  release: 94,
  other: 66,
};

type Props = {
  category: Category;
  cells: HexCell[];
  platforms: Platform[];
  selected: Selection;
  selectedPlatform?: Platform;
  tab: DetailTab;
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
  tab,
  dimmed,
  onSelectCategory,
  onSelectPlatform,
}: Props) {
  const badgeWidth = badgeWidths[category.id];
  const selectCategory = () => onSelectCategory(category.id);
  const onCategoryKeyDown = (event: KeyboardEvent<SVGGElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      selectCategory();
    }
  };

  return (
    <g opacity={dimmed ? 0.35 : 1}>
      <g
        className={styles['island-tiles']}
        role="button"
        tabIndex={0}
        aria-label={`${category.name} 섬 선택`}
        onClick={(event) => {
          event.stopPropagation();
          selectCategory();
        }}
        onKeyDown={onCategoryKeyDown}
      >
        <IslandTiles
          category={category}
          cells={cells}
          selected={selected}
          tab={tab}
          dimmed={dimmed}
          selectedPlatform={selectedPlatform}
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
        <rect
          x={-badgeWidth / 2}
          y="-10"
          width={badgeWidth}
          height="21"
          rx="10"
          fill="white"
          stroke="#dde6f2"
          filter="url(#badge-shadow)"
        />
        <circle cx={-badgeWidth / 2 + 10} cy="0" r="3.1" fill={category.color} />
        <text
          x={-badgeWidth / 2 + 18}
          y="3"
          fontSize={
            category.id === 'code' || category.id === 'cloud' || category.id === 'backend' ? 8.2 : 9
          }
          fontWeight="600"
          fill="#1b2536"
        >
          {category.name}
        </text>
        <text x={badgeWidth / 2 - 8} y="3" fontSize="9" textAnchor="end" fill="#62718b">
          {category.count}건
        </text>
      </g>
      {category.id === 'code' && selected?.kind === 'category' && selected.id === 'code' && (
        <g transform="translate(245,160)">
          <rect
            x="-14"
            y="-8"
            width="28"
            height="16"
            rx="3"
            fill="white"
            stroke="#a9b5c8"
            strokeWidth=".6"
          />
          <text textAnchor="middle" y="3" fontSize="9" fontWeight="600" fill="#1e293b">
            기타
          </text>
        </g>
      )}
      {platforms
        .filter(
          (item) =>
            item.category === category.id &&
            (item.featured || (selected?.kind === 'platform' && selected.id === item.id)),
        )
        .map((platform) => {
          if (selected?.kind === 'category' && selected.id !== category.id) return null;
          const label = platform.id === 'github-gist' ? 'GitHub' : platform.name;
          const width = Math.max(23, label.length * (/[가-힣]/.test(label) ? 9 : 5.3) + 10);
          return (
            <g
              key={platform.id}
              className={styles['platform-label']}
              transform={`translate(${platform.x},${platform.y})`}
              role="button"
              tabIndex={0}
              aria-label={`${platform.name} 영토 선택`}
              onClick={(event) => {
                event.stopPropagation();
                onSelectPlatform(platform.id);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onSelectPlatform(platform.id);
                }
              }}
            >
              <rect
                x={-width / 2}
                y="-8"
                width={width}
                height="17"
                rx="3"
                fill="#fff"
                stroke={
                  selected?.kind === 'platform' && selected.id === platform.id
                    ? '#172a4d'
                    : '#a9b5c8'
                }
                strokeWidth=".6"
              />
              <text textAnchor="middle" y="3.3" fontSize="9.4" fontWeight="600" fill="#1e293b">
                {label}
              </text>
            </g>
          );
        })}
    </g>
  );
}
