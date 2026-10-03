import type { Category } from './ecosystem-types';

export const HEX_COLUMN_GAP = 17.6;
export const HEX_ROW_GAP = 15.2;
export const MAP_ELEVATION = 7;

export type HexCell = {
  key: string;
  x: number;
  y: number;
  row: number;
  col: number;
  count: number;
};

// 지도 렌더링과 플랫폼 배치가 같은 육각 격자를 사용한다.
export function getCategoryTiles(category: Category): HexCell[] {
  const [centerX, centerY] = category.center;
  const middle = (category.rows.length - 1) / 2;
  return category.rows.flatMap((count, row) =>
    Array.from({ length: count }, (_, col) => ({
      key: `${row}-${col}`,
      x:
        centerX +
        (col + Math.round(-(count - 1) / 2 - (row % 2) / 2) + (row % 2) / 2) * HEX_COLUMN_GAP,
      y: centerY + (row - middle) * HEX_ROW_GAP,
      row,
      col,
      count,
    })),
  );
}
