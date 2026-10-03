import { expect, test } from '@playwright/test';
import type { Category } from '../src/lib/ecosystem-types';
import { getCategoryTiles, HEX_COLUMN_GAP, MAP_ELEVATION } from '../src/lib/hex-layout';
import { islandLayouts } from '../src/lib/island-layouts';
import { platformLabel } from '../src/lib/platform-label';
import { layoutIslandPlatforms } from '../src/lib/platform-layout';

const groups = [
  { id: 1, names: ['Github', 'GitLab', 'Gist'] },
  { id: 2, names: ['Taobao', 'Xianyu'] },
  { id: 3, names: ['Pastebin'] },
  { id: 4, names: ['Supabase', 'Firebase'] },
  { id: 6, names: ['오늘의집', '무신사', '한컴', '웹젠', '펄어비스'] },
  { id: 7, names: ['Mega', 'Google Drive', 'Fex.net', 'Dropbox'] },
  { id: 8, names: ['X', 'Telegram', 'Reddit'] },
];

function categoryFor(id: number): Category {
  return { ...islandLayouts[id], name: `섬 ${id}`, description: '', count: 0 };
}

for (const { id, names } of groups) {
  test(`${islandLayouts[id].id}: organic label positions stay inside tiles without flat/3D hitbox collisions`, () => {
    const original = categoryFor(id);
    const before = structuredClone(original);
    const layout = layoutIslandPlatforms(original, names);
    const cells = getCategoryTiles(layout.category);
    expect(original).toEqual(before);
    expect(layout.category.center).toEqual(original.center);
    expect(layoutIslandPlatforms(original, names)).toEqual(layout);
    for (const position of layout.positions) {
      expect(cells.some((cell) => cell.x === position.x && cell.y === position.y)).toBe(true);
    }
    if (names.length > 1) {
      const xs = layout.positions.map((position) => position.x);
      const ys = layout.positions.map((position) => position.y);
      expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThanOrEqual(HEX_COLUMN_GAP * 1.5);
      expect(Math.max(...ys) - Math.min(...ys)).toBeGreaterThan(15);
    }
    for (let first = 0; first < names.length; first += 1) {
      expect(platformLabel(names[first]).text).toBe(names[first]);
      for (let second = first + 1; second < names.length; second += 1) {
        // 어느 쪽을 선택해도 투명 클릭 영역까지 서로 침범하지 않아야 한다.
        for (const raised of [-1, first, second]) {
          const a = layout.positions[first];
          const b = layout.positions[second];
          const gapX =
            Math.abs(a.x - b.x) -
            (platformLabel(names[first]).width + platformLabel(names[second]).width) / 2;
          const gapY =
            Math.abs(
              a.y -
                (raised === first ? MAP_ELEVATION : 0) -
                (b.y - (raised === second ? MAP_ELEVATION : 0)),
              ) - 16;
          expect(gapX >= 8 || gapY >= 5).toBe(true);
        }
      }
    }
  });
}

test('empty and long-name layouts are deterministic and use the same width as rendered labels', () => {
  const category = categoryFor(6);
  expect(layoutIslandPlatforms(category, []).category).toEqual(category);
  expect(layoutIslandPlatforms(category, []).positions).toEqual([]);
  const names = ['아주 긴 한글 플랫폼 이름', 'WWWWWWWWWWWWWWWWWW', 'Google Drive'];
  const layout = layoutIslandPlatforms(category, names);
  expect(layoutIslandPlatforms(category, names)).toEqual(layout);
  expect(layout.positions).toHaveLength(names.length);
  expect(platformLabel(names[0]).text).toContain('…');
  expect(platformLabel(names[0]).width).toBeLessThanOrEqual(132);
});

test('current islands stay separated after fitting their platform names', () => {
  const islands = groups.map(({ id, names }) => ({
    id,
    cells: getCategoryTiles(layoutIslandPlatforms(categoryFor(id), names).category),
  }));
  for (let first = 0; first < islands.length; first += 1) {
    for (let second = first + 1; second < islands.length; second += 1) {
      const distance = Math.min(
        ...islands[first].cells.flatMap((a) =>
          islands[second].cells.map((b) => Math.hypot(a.x - b.x, a.y - b.y)),
        ),
      );
      expect(distance, `island ${islands[first].id} / ${islands[second].id}`).toBeGreaterThan(24);
    }
  }
});
