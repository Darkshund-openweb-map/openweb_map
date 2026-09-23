import { range } from 'd3';
import { type Category, type Platform, type Selection } from '@/lib/ecosystem-types';

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
  if (!selected || selected.kind === 'category') return true;
  if (!selectedPlatform || selectedPlatform.category !== category.id) return true;

  const horizontalDistance = cell.x - selectedPlatform.x;
  const verticalDistance = (cell.y - selectedPlatform.y) * 1.08;
  const territoryRadius = category.id === 'code' ? 48 : 40;

  return Math.hypot(horizontalDistance, verticalDistance) <= territoryRadius;
}
