// 선택 상태에 따라 섬 타일의 색상과 높이를 구성하는 컴포넌트
import styles from '@/styles/map.module.css';
import { color as d3Color } from 'd3';
import type { Category, Selection } from '@/lib/ecosystem-types';
import { getExposedFrontEdges, isTileActive, MAP_ELEVATION, type HexCell } from './geometry';
import { HexTileSides } from './hex-tile-sides';
import { HexTileTop } from './hex-tile-top';

type Props = {
  category: Category;
  cells: HexCell[];
  selected: Selection;
  activePlatformIds: Set<string>;
  dimmed: boolean;
  owners: Map<string, string>;
  hoveredOwner: string | null;
  islandHovered: boolean;
  onHoverOwner: (id: string | null) => void;
  onSelectCategory: () => void;
  onSelectPlatform: (id: string) => void;
};

export function IslandTiles({
  category,
  cells,
  selected,
  activePlatformIds,
  dimmed,
  owners,
  hoveredOwner,
  islandHovered,
  onHoverOwner,
  onSelectCategory,
  onSelectPlatform,
}: Props) {
  const tiles = cells.map((cell) => {
    const owner = owners.get(cell.key);
    const active =
      selected?.kind === 'platform'
        ? Boolean(owner && activePlatformIds.has(owner))
        : isTileActive(category, cell, selected, owners);
    const raised = Boolean(selected && active && !dimmed);
    const inactiveFill = category.id === 'files' ? '#d0d9e4' : category.light;
    const baseFill = !selected || dimmed || active ? category.color : inactiveFill;
    const fill =
      islandHovered || (owner && owner === hoveredOwner)
        ? d3Color(baseFill)?.brighter(0.85).formatHex() ?? baseFill
        : baseFill;
    const onSelect = () => {
      if (owner) {
        if (selected?.kind === 'platform' && selected.id === owner) return;
        onSelectPlatform(owner);
        return;
      }
      onSelectCategory();
    };
    return { cell, raised, fill, owner, onSelect };
  });
  const raisedCells = tiles.filter((tile) => tile.raised).map((tile) => tile.cell);
  return (
    <>
      <g className={styles['island-top-layer']} data-map-layer="tops">
        {tiles
          .filter((tile) => !tile.raised)
          .map(({ cell, fill, owner, onSelect }) => (
            <HexTileTop
              key={cell.key}
              cell={cell}
              fill={fill}
              owner={owner}
              onHoverOwner={onHoverOwner}
              onSelect={onSelect}
            />
          ))}
      </g>
      <g
        className={styles['island-side-layer']}
        data-map-layer="sides"
        filter="url(#island-shadow)"
      >
        {tiles
          .filter((tile) => tile.raised)
          .map(({ cell, fill, owner, onSelect }) => (
            <HexTileSides
              key={cell.key}
              cell={cell}
              fill={fill}
              depth={MAP_ELEVATION}
              edges={getExposedFrontEdges(category, cell, raisedCells)}
              owner={owner}
              onHoverOwner={onHoverOwner}
              onSelect={onSelect}
            />
          ))}
      </g>
      <g className={styles['island-top-layer']} data-map-layer="tops">
        {tiles
          .filter((tile) => tile.raised)
          .map(({ cell, fill, owner, onSelect }) => (
            <HexTileTop
              key={cell.key}
              cell={cell}
              fill={fill}
              elevation={MAP_ELEVATION}
              owner={owner}
              onHoverOwner={onHoverOwner}
              onSelect={onSelect}
            />
          ))}
      </g>
    </>
  );
}
