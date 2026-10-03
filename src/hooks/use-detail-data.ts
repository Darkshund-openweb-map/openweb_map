// 선택한 섬 또는 플랫폼의 상세 패널 데이터를 구성하는 훅
'use client';

import type { Selection } from '@/lib/ecosystem-types';
import { useEcosystemData } from '@/hooks/use-ecosystem-data';

export function useDetailData(selected: Selection) {
  const data = useEcosystemData();
  const platform = selected?.kind === 'platform' ? data.getPlatform(selected.id) : undefined;
  const categoryId = selected?.kind === 'category' ? selected.id : platform?.category;
  const category = categoryId ? data.getCategory(categoryId) : undefined;
  const platforms = data.platforms.filter((item) => item.category === categoryId);
  const platformIds = new Set(platform ? [platform.id] : platforms.map((item) => item.id));
  const events = data.events.filter((event) => platformIds.has(event.platform));
  const relations = data.relations.filter(
    (item) => platformIds.has(item.source) || platformIds.has(item.target),
  );
  const latestEvent = events.toSorted((a, b) => b.date.localeCompare(a.date))[0];
  const percent = (count: number) =>
    events.length ? Math.round((count / events.length) * 100) : 0;
  const bars = platform
    ? [...new Set(events.flatMap((event) => event.exposures))]
        .map((name) => ({
          name,
          value: percent(events.filter((event) => event.exposures.includes(name)).length),
        }))
        .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name, 'ko'))
    : platforms.map((item) => ({
        name: item.name,
        value: percent(events.filter((event) => event.platform === item.id).length),
      }));
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
    title: platform?.name ?? category?.name ?? '',
    eventCount: platform ? events.length : (category?.count ?? 0),
    verifiedCount: relations.filter((item) => item.status === 'verified').length,
    getPlatform: data.getPlatform,
  };
}
