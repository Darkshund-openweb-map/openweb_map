import type { Category } from './ecosystem-types';
import {
  getCategoryTiles,
  HEX_COLUMN_GAP,
  HEX_ROW_GAP,
  MAP_ELEVATION,
  type HexCell,
} from './hex-layout';
import { platformLabel } from './platform-label';

type Position = { x: number; y: number };
type Placement = Position & { width: number };
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const VERTICAL_CLEARANCE = 24 + MAP_ELEVATION + 5;
const HORIZONTAL_CLEARANCE = 8;
const SEARCH_WIDTH = 48;
const SCATTER_ANCHORS: Record<number, readonly (readonly [number, number])[]> = {
  1: [[0, 0]],
  2: [
    [-0.4, -0.38],
    [0.38, 0.32],
  ],
  3: [
    [-0.38, -0.42],
    [0.46, -0.02],
    [-0.14, 0.52],
  ],
  4: [
    [-0.3, -0.54],
    [0.34, -0.12],
    [-0.38, 0.26],
    [0.25, 0.57],
  ],
  5: [
    [-0.45, -0.43],
    [0.4, -0.48],
    [-0.1, 0.06],
    [-0.38, 0.51],
    [0.45, 0.4],
  ],
};

function expandedIsland(category: Category, growth: number, count: number): Category {
  if (!growth) return category;
  // 적은 수의 긴 이름 때문에 섬이 아래로 길어져 이웃 섬의 제목을 덮지 않도록 한다.
  const preferredRows = count <= 2 ? 6 : count <= 5 ? 9 : Math.ceil(Math.sqrt(count) * 4) + 1;
  const rowCount = Math.min(
    category.rows.length + growth,
    Math.max(category.rows.length, preferredRows),
  );
  const columns = Math.max(...category.rows) + growth;
  const middle = (rowCount - 1) / 2;
  return {
    ...category,
    rows: Array.from({ length: rowCount }, (_, row) =>
      Math.max(3, Math.round(columns * Math.sqrt(1 - 0.65 * ((row - middle) / middle) ** 2))),
    ),
  };
}

function rowBounds(cells: HexCell[], rowCount: number) {
  return Array.from({ length: rowCount }, (_, index) => {
    const row = cells.filter((cell) => cell.row === index);
    return {
      left: Math.min(...row.map((cell) => cell.x)) - 6,
      right: Math.max(...row.map((cell) => cell.x)) + 6,
    };
  });
}

function placeLabels(category: Category, names: readonly string[]): Position[] | null {
  const cells = getCategoryTiles(category);
  const bounds = rowBounds(cells, category.rows.length);
  const minY = Math.min(...cells.map((cell) => cell.y));
  const maxY = Math.max(...cells.map((cell) => cell.y));
  const halfWidth =
    (Math.max(...cells.map((cell) => cell.x)) - Math.min(...cells.map((cell) => cell.x))) / 2;
  const halfHeight = (maxY - minY) / 2;
  const seed = Array.from(category.id).reduce((sum, character) => sum + character.charCodeAt(0), 0);
  const rotation = ((seed % 5) - 2) * 0.08;
  const labels = names
    .map((name, index) => {
      const width = platformLabel(name).width;
      const radius = Math.sqrt((index + 0.6) / names.length) * 0.8;
      const anchor = SCATTER_ANCHORS[names.length]?.[index] ?? [
        Math.cos(index * GOLDEN_ANGLE) * radius,
        Math.sin(index * GOLDEN_ANGLE) * radius,
      ];
      const target = {
        x:
          category.center[0] +
          (anchor[0] * Math.cos(rotation) - anchor[1] * Math.sin(rotation)) * halfWidth,
        y:
          category.center[1] +
          (anchor[0] * Math.sin(rotation) + anchor[1] * Math.cos(rotation)) * halfHeight,
      };
      const candidates = cells.filter((cell) => {
        // 선택된 라벨이 3D 높이만큼 올라와도 섬 경계와 다른 이름을 침범하지 않도록 여백을 둔다.
        const samples = [cell.y - 12 - MAP_ELEVATION, cell.y, cell.y + 12];
        const inside = samples.every((y) => {
          if (y < minY - 8 || y > maxY + 8) return false;
          const row =
            bounds[Math.max(0, Math.min(bounds.length - 1, Math.round((y - minY) / HEX_ROW_GAP)))];
          return cell.x - width / 2 >= row.left && cell.x + width / 2 <= row.right;
        });
        return inside;
      });
      const score = (cell: Position) =>
        2 * ((cell.x - target.x) / Math.max(halfWidth, 1)) ** 2 +
        ((cell.y - target.y) / Math.max(halfHeight, 1)) ** 2;
      return {
        index,
        width,
        candidates: candidates.map((cell) => ({ ...cell, score: score(cell) })),
      };
    })
    .toSorted((a, b) => b.width - a.width || a.index - b.index);

  // 여러 배치 후보를 유지해 긴 이름 하나 때문에 섬 전체가 불필요하게 커지는 것을 막는다.
  // 난수를 사용하지 않아 재조회나 타임라인 조작으로 위치가 달라지지 않는다.
  type State = { score: number; placed: (Placement & { index: number })[] };
  let states: State[] = [{ score: 0, placed: [] }];
  for (const label of labels) {
    const next: State[] = [];
    for (const state of states) {
      for (const cell of label.candidates) {
        if (
          !state.placed.every(
            (other) =>
              Math.abs(cell.y - other.y) >= VERTICAL_CLEARANCE ||
              Math.abs(cell.x - other.x) >= (label.width + other.width) / 2 + HORIZONTAL_CLEARANCE,
          )
        )
          continue;
        const placed = [
          ...state.placed,
          { x: cell.x, y: cell.y, width: label.width, index: label.index },
        ];
        if (placed.length === names.length && names.length > 1) {
          const spreadX =
            Math.max(...placed.map((item) => item.x)) - Math.min(...placed.map((item) => item.x));
          const spreadY =
            Math.max(...placed.map((item) => item.y)) - Math.min(...placed.map((item) => item.y));
          if (spreadX < HEX_COLUMN_GAP * (names.length === 2 ? 1.5 : 2) || spreadY < HEX_ROW_GAP)
            continue;
        }
        next.push({ score: state.score + cell.score, placed });
      }
    }
    states = next.toSorted((a, b) => a.score - b.score).slice(0, SEARCH_WIDTH);
    if (!states.length) return null;
  }
  const positions: Position[] = new Array(names.length);
  for (const { index, x, y } of states[0].placed) positions[index] = { x, y };
  return positions;
}

export function layoutIslandPlatforms(category: Category, names: readonly string[]) {
  if (!names.length) return { category, positions: [] as Position[] };
  for (let growth = 0; growth <= 24; growth += 1) {
    const fitted = expandedIsland(category, growth, names.length);
    const positions = placeLabels(fitted, names);
    if (positions) return { category: fitted, positions };
  }
  throw new Error(`${category.name}의 플랫폼 이름을 배치할 공간이 부족합니다.`);
}
