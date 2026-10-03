import type { CategoryId, EcosystemSnapshot } from './ecosystem-types';

type MapData = Pick<EcosystemSnapshot, 'categories' | 'platforms' | 'events' | 'relations'>;

// 날짜별 집계 결과 중 사건이 있는 섬만 지도에 투영한다.
// 원본 목록은 그대로 두어 검색·상세 패널·통계에서 빈 유형도 조회할 수 있게 한다.
export function getIncidentMapData(data: MapData): MapData {
  const platformCategories = new Map(
    data.platforms.map((platform) => [platform.id, platform.category]),
  );
  const counts = new Map<CategoryId, number>();
  for (const event of data.events) {
    const category = platformCategories.get(event.platform);
    if (category) counts.set(category, (counts.get(category) ?? 0) + 1);
  }
  const categories = data.categories.flatMap((category) => {
    const count = counts.get(category.id) ?? 0;
    return count > 0 ? [{ ...category, count }] : [];
  });
  const categoryIds = new Set(categories.map((category) => category.id));
  const platforms = data.platforms.filter((platform) => categoryIds.has(platform.category));
  const platformIds = new Set(platforms.map((platform) => platform.id));
  return {
    categories,
    platforms,
    events: data.events.filter((event) => platformIds.has(event.platform)),
    relations: data.relations.filter(
      (relation) => platformIds.has(relation.source) && platformIds.has(relation.target),
    ),
  };
}
