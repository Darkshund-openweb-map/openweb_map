import { range } from 'd3';
import { type Category, type Platform, type Selection } from '@/lib/ecosystem-types';

import { getCategoryTiles, HEX_COLUMN_GAP, HEX_ROW_GAP, type HexCell } from '@/lib/hex-layout';
export { getCategoryTiles, MAP_ELEVATION, type HexCell } from '@/lib/hex-layout';

export const HEX_POINTS = range(6)
  .map((index) => {
    const angle = ((index * 60 - 90) * Math.PI) / 180;
    return `${(10.1 * Math.cos(angle)).toFixed(2)},${(10.1 * Math.sin(angle)).toFixed(2)}`;
  })
  .join(' ');

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
  const halfColumnGap = HEX_COLUMN_GAP / 2;
  const hasNeighbor = (direction: number) =>
    raisedCells.some(
      (neighbor) =>
        Math.abs(neighbor.x - cell.x - direction * halfColumnGap) < 0.05 &&
        Math.abs(neighbor.y - cell.y - HEX_ROW_GAP) < 0.05,
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
