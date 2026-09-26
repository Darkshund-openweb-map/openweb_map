import { range } from 'd3';
import { type Category, type Platform, type Selection } from '@/lib/ecosystem-types';

export const MAP_ELEVATION = 7;

export const HEX_POINTS = range(6)
  .map((index) => {
    const angle = ((index * 60 - 90) * Math.PI) / 180;
    return `${(10.1 * Math.cos(angle)).toFixed(2)},${(10.1 * Math.sin(angle)).toFixed(2)}`;
  })
  .join(' ');

export type HexCell = {
  key: string;
  x: number;
  y: number;
  row: number;
  col: number;
  count: number;
};

export function getCategoryTiles(category: Category): HexCell[] {
  const [centerX, centerY] = category.center;
  const middle = (category.rows.length - 1) / 2;
  const columnGap = category.id === 'cloud' ? 19 : 17.6;
  const rowGap = category.id === 'code' || category.id === 'text' ? 17.3 : 15.2;

  return category.rows.flatMap((count, row) =>
    range(count).map((col) => ({
      key: `${row}-${col}`,
      // Keep each row on the same hex lattice, even when its cell count changes parity.
      x: centerX + (col + Math.round(-(count - 1) / 2 - (row % 2) / 2) + (row % 2) / 2) * columnGap,
      y: centerY + (row - middle) * rowGap,
      row,
      col,
      count,
    })),
  );
}

export function isTileActive(
  category: Category,
  cell: HexCell,
  selected: Selection,
  selectedPlatform?: Platform,
) {
  if (!selected) return true;
  if (selected.kind === 'category') return selected.id === category.id;
  if (!selectedPlatform || selectedPlatform.category !== category.id) return false;

  const horizontalDistance = cell.x - selectedPlatform.x;
  const verticalDistance = (cell.y - selectedPlatform.y) * 1.08;
  const territoryRadius = category.id === 'code' ? 48 : 40;

  return Math.hypot(horizontalDistance, verticalDistance) <= territoryRadius;
}

export function getExposedFrontEdges(category: Category, cell: HexCell, raisedCells: HexCell[]) {
  const halfColumnGap = (category.id === 'cloud' ? 19 : 17.6) / 2;
  const rowGap = category.id === 'code' || category.id === 'text' ? 17.3 : 15.2;
  const hasNeighbor = (direction: number) =>
    raisedCells.some(
      (neighbor) =>
        Math.abs(neighbor.x - cell.x - direction * halfColumnGap) < 0.05 &&
        Math.abs(neighbor.y - cell.y - rowGap) < 0.05,
    );
  return { left: !hasNeighbor(-1), right: !hasNeighbor(1) };
}

export function getPlatformPosition(category: Category, platforms: Platform[]) {
  const candidates = getCategoryTiles(category);
  const occupied = platforms.filter((platform) => platform.category === category.id);
  const score = (cell: HexCell) => {
    const clearance = occupied.length
      ? Math.min(
          ...occupied.map((platform) => Math.hypot(platform.x - cell.x, platform.y - cell.y)),
        )
      : 100;
    return clearance - Math.hypot(cell.x - category.center[0], cell.y - category.center[1]) * 0.15;
  };
  const cell = candidates.toSorted((a, b) => score(b) - score(a))[0];
  return { x: cell?.x ?? category.center[0], y: cell?.y ?? category.center[1] };
}
