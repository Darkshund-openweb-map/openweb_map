import type { Category } from './ecosystem-types';

const LABEL_GAP = 32;
const HEX_ROW_GAP = 15.2;

export function fitIslandForPlatforms(category: Category, count: number): Category {
  const requiredRows = Math.ceil(((count - 1) * LABEL_GAP) / HEX_ROW_GAP) + 1;
  if (count < 2 || (category.rows.length >= requiredRows && Math.max(...category.rows) >= 5)) {
    return category;
  }
  const rowCount = Math.max(5, requiredRows, category.rows.length);
  return {
    ...category,
    rows: Array.from({ length: rowCount }, (_, index) =>
      Math.min(7, 3 + Math.min(index, rowCount - index - 1) * 2),
    ),
  };
}

export function platformSlot(category: Category, index: number, count: number) {
  return {
    x: category.center[0],
    y: category.center[1] + (index - (count - 1) / 2) * LABEL_GAP,
  };
}
