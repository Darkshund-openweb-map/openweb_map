import type { CategoryId, EcosystemSnapshot } from './ecosystem-types';

type MapData = Pick<EcosystemSnapshot, 'categories' | 'platforms' | 'events' | 'relations'>;

// 현재 시점에서는 사건이 없는 섬도 자리를 유지한다.
// 과거 시점에서는 당시까지 사건이 등장한 섬과 연결만 지도에 투영한다.
export function getIncidentMapData(data: MapData, showEmptyIslands = false): MapData {
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
    return showEmptyIslands || count > 0 ? [{ ...category, count }] : [];
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
