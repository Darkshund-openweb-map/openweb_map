// 선택 상태에 따라 섬 타일의 색상과 높이를 구성하는 컴포넌트
import styles from '@/styles/map.module.css';
import type { Category, Platform, Selection } from '@/lib/ecosystem-types';
import { getExposedFrontEdges, isTileActive, MAP_ELEVATION, type HexCell } from './geometry';
import { HexTileSides } from './hex-tile-sides';
import { HexTileTop } from './hex-tile-top';

type Props = {
  category: Category;
  cells: HexCell[];
  selected: Selection;
  dimmed: boolean;
  selectedPlatform?: Platform;
  onSelectCategory: () => void;
};

export function IslandTiles({
  category,
  cells,
  selected,
  dimmed,
  selectedPlatform,
  onSelectCategory,
}: Props) {
  const tiles = cells.map((cell) => {
    const active = isTileActive(category, cell, selected, selectedPlatform);
    const raised = Boolean(selected && active && !dimmed);
    const inactiveFill = category.id === 'cloud' ? '#d0d9e4' : category.light;
    const fill = !selected || dimmed || active ? category.color : inactiveFill;
    const onSelect = () => {
      // A selected top/side must not turn a platform selection into an island selection.
      if (selected && active && !dimmed) return;
      onSelectCategory();
    };
    return { cell, raised, fill, onSelect };
  });
  const raisedCells = tiles.filter((tile) => tile.raised).map((tile) => tile.cell);
  return (
    <>
      <g className={styles['island-top-layer']} data-map-layer="tops">
        {tiles
          .filter((tile) => !tile.raised)
          .map(({ cell, fill, onSelect }) => (
            <HexTileTop key={cell.key} cell={cell} fill={fill} onSelect={onSelect} />
          ))}
      </g>
      <g
        className={styles['island-side-layer']}
        data-map-layer="sides"
        filter="url(#island-shadow)"
      >
        {tiles
          .filter((tile) => tile.raised)
          .map(({ cell, fill, onSelect }) => (
            <HexTileSides
              key={cell.key}
              cell={cell}
              fill={fill}
              depth={MAP_ELEVATION}
              edges={getExposedFrontEdges(category, cell, raisedCells)}
              onSelect={onSelect}
            />
          ))}
      </g>
      <g className={styles['island-top-layer']} data-map-layer="tops">
        {tiles
          .filter((tile) => tile.raised)
          .map(({ cell, fill, onSelect }) => (
            <HexTileTop
              key={cell.key}
              cell={cell}
              fill={fill}
              elevation={MAP_ELEVATION}
              onSelect={onSelect}
            />
          ))}
      </g>
    </>
  );
}
