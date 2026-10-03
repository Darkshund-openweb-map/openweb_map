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

// 요청한 칸 수만큼 중앙에서 바깥으로 확장되는 균형 잡힌 육각 섬을 만든다.
export function getSizedCategoryTiles(category: Category, tileCount: number): HexCell[] {
  const count = Math.max(1, Math.min(80, Math.floor(tileCount)));
  const axial: { q: number; r: number }[] = [{ q: 0, r: 0 }];
  const directions = [
    [-1, 1],
    [-1, 0],
    [0, -1],
    [1, -1],
    [1, 0],
    [0, 1],
  ] as const;
  for (let radius = 1; axial.length < count; radius += 1) {
    const ring: { q: number; r: number }[] = [];
    let q = radius;
    let r = 0;
    for (const [dq, dr] of directions) {
      for (let step = 0; step < radius; step += 1) {
        ring.push({ q, r });
        q += dq;
        r += dr;
      }
    }
    const start = ring.findIndex((cell) => cell.q === radius && cell.r === 1 - radius);
    axial.push(...[...ring.slice(start), ...ring.slice(0, start)].slice(0, count - axial.length));
  }

  const averageX = axial.reduce((sum, cell) => sum + cell.q + cell.r / 2, 0) / count;
  const averageR = axial.reduce((sum, cell) => sum + cell.r, 0) / count;
  const rows = [...new Set(axial.map((cell) => cell.r))].sort((a, b) => a - b);
  const columns = new Map(
    rows.map((row) => [
      row,
      axial.filter((cell) => cell.r === row).sort((a, b) => a.q - b.q),
    ]),
  );
  return axial.map((cell) => {
    const row = rows.indexOf(cell.r);
    const rowCells = columns.get(cell.r)!;
    const col = rowCells.findIndex((item) => item.q === cell.q);
    return {
      key: `${row}-${col}`,
      x: category.center[0] + (cell.q + cell.r / 2 - averageX) * HEX_COLUMN_GAP,
      y: category.center[1] + (cell.r - averageR) * HEX_ROW_GAP,
      row,
      col,
      count: rowCells.length,
    };
  });
}
