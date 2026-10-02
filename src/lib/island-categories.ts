import type { Category, EcosystemSnapshot } from './ecosystem-types';
import { islandLayouts } from './island-layouts';

export type IslandRow = { id: number; name: string };

const koreanNames: Readonly<Record<string, string>> = {
  'code hosting': '코드 호스팅',
  'open marketplace': '오픈마켓',
  'text hosting': '텍스트 호스팅',
  'backend service': '백엔드 서비스',
  'official website': '공식 웹사이트',
  'file hosting': '파일 호스팅',
  community: '커뮤니티',
};

const normalizeName = (name: string) => name.trim().replace(/\s+/g, ' ').toLowerCase();

export function parseIslandRows(value: unknown): IslandRow[] {
  if (!Array.isArray(value)) throw new Error('섬 조회 응답 형식이 올바르지 않습니다.');
  const ids = new Set<number>();
  return value.map((row: unknown) => {
    if (
      !row ||
      typeof row !== 'object' ||
      !('id' in row) ||
      typeof row.id !== 'number' ||
      !Number.isSafeInteger(row.id) ||
      row.id < 1 ||
      !('name' in row) ||
      typeof row.name !== 'string' ||
      !row.name.trim() ||
      ids.has(row.id)
    ) {
      throw new Error('섬 조회 응답에 유효하지 않은 ID 또는 이름이 있습니다.');
    }
    ids.add(row.id);
    return { id: row.id, name: row.name.trim() };
  });
}

export function createIslandCategories(rows: IslandRow[]): Category[] {
  return rows
    .filter((row) => row.id !== 5 && normalizeName(row.name) !== 'other')
    .map((row) => {
      const layout = islandLayouts[row.id];
      if (!layout) throw new Error(`섬 ID ${row.id}에 해당하는 지도 배치가 없습니다.`);
      return {
        ...layout,
        sourceId: row.id,
        name: koreanNames[normalizeName(row.name)] ?? row.name,
        description: '',
        count: 0,
      };
    });
}

export function applyIslandRows(
  rows: IslandRow[],
  data: Omit<EcosystemSnapshot, 'categories'>,
): EcosystemSnapshot {
  const categories = createIslandCategories(rows);
  const categoryIds = new Set(categories.map((category) => category.id));
  const platforms = data.platforms.filter((platform) => categoryIds.has(platform.category));
  const platformIds = new Set(platforms.map((platform) => platform.id));
  const events = data.events.filter((event) => platformIds.has(event.platform));
  const categoriesByPlatform = new Map(
    platforms.map((platform) => [platform.id, platform.category]),
  );

  return {
    ...data,
    categories: categories.map((category) => ({
      ...category,
      count: events.filter((event) => categoriesByPlatform.get(event.platform) === category.id)
        .length,
    })),
    platforms,
    events,
    relations: data.relations.filter(
      (relation) => platformIds.has(relation.source) && platformIds.has(relation.target),
    ),
    exposureRows: data.exposureRows.map((row) => ({
      ...row,
      count: events.filter((event) => event.exposures.includes(row.name)).length,
    })),
  };
}
