// 선택한 섬 또는 플랫폼의 상세 패널 데이터를 구성하는 훅
'use client';

import type { Selection } from '@/lib/ecosystem-types';
import { useEcosystemData } from '@/hooks/use-ecosystem-data';
import { normalizeExposurePercentages } from '@/lib/event-aggregates';

export function useDetailData(selected: Selection) {
  const data = useEcosystemData();
  const platform = selected?.kind === 'platform' ? data.getPlatform(selected.id) : undefined;
  const categoryId = selected?.kind === 'category' ? selected.id : platform?.category;
  const category = categoryId ? data.getCategory(categoryId) : undefined;
  const platforms = categoryId
    ? data.platforms.filter((item) => item.category === categoryId)
    : data.platforms;
  const platformIds = new Set(platform ? [platform.id] : platforms.map((item) => item.id));
  const events = data.events.filter((event) => platformIds.has(event.platform));
  const relations = data.relations.filter(
    (item) => platformIds.has(item.source) || platformIds.has(item.target),
  );
  const latestEvent = events.toSorted((a, b) => b.date.localeCompare(a.date))[0];
  const bars = platform
    ? normalizeExposurePercentages(
        [...new Set(events.flatMap((event) => event.exposures))]
          .map((name) => ({
            name,
            count: events.filter((event) => event.exposures.includes(name)).length,
          }))
          .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'ko')),
      ).map(({ name, heat }) => ({ name, value: heat }))
    : !categoryId
      ? normalizeExposurePercentages(
          data.exposureRows.map((row) => ({ name: row.name, count: row.count })),
        ).map(({ name, heat }) => ({ name, value: heat }))
      : normalizeExposurePercentages(
          platforms.map((item) => ({
            name: item.name,
            count: events.filter((event) => event.platform === item.id).length,
          })),
        ).map(({ name, heat }) => ({ name, value: heat }));
  const months = platform ? 4 : 12;
  const reference = new Date(`${data.timeline.current.date}T00:00:00Z`);
  const trend = Array.from({ length: months }, (_, index) => {
    const month = new Date(
      Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth() - months + index + 1, 1),
    )
      .toISOString()
      .slice(0, 7);
    return { label: month, value: events.filter((event) => event.date.startsWith(month)).length };
  });
  return {
    category,
    platform,
    platforms,
    allPlatforms: data.platforms,
    categories: data.categories,
    events,
    relations,
    latestEvent,
    bars,
    trend,
    referenceDate: data.timeline.current.date,
    title: platform?.name ?? category?.name ?? '전체 오픈웹 생태계',
    eventCount: category ? (platform ? events.length : category.count) : events.length,
    verifiedCount: relations.filter((item) => item.status === 'verified').length,
    getPlatform: data.getPlatform,
  };
}
