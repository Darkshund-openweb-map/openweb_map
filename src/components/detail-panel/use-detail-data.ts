'use client';

import type { Selection } from '@/lib/ecosystem-types';
import { useEcosystemData } from '../explorer/ecosystem-data-context';

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
    ? data.exposureRows.map((row) => ({
        name: row.name,
        value: percent(events.filter((event) => event.exposures.includes(row.name)).length),
      }))
    : platforms.map((item) => ({
        name: item.name,
        value: percent(events.filter((event) => event.platform === item.id).length),
      }));
  const months = platform ? 4 : 12;
  const reference = new Date(`${data.updatedAt}T00:00:00Z`);
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
    events,
    relations,
    latestEvent,
    bars,
    trend,
    referenceDate: data.updatedAt,
    title: platform?.name ?? category?.name ?? '',
    eventCount: platform ? events.length : (category?.count ?? 0),
    verifiedCount: relations.filter((item) => item.status === 'verified').length,
    getPlatform: data.getPlatform,
  };
}
