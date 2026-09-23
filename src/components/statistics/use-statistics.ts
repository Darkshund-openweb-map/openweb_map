'use client';

import { useState } from 'react';
import type { CategoryId } from '@/lib/ecosystem-types';
import { useEcosystemData } from '../explorer/ecosystem-data-context';

export function useStatistics() {
  const { categories, platforms, events, exposureRows, relations } = useEcosystemData();
  const [active, setActive] = useState<CategoryId | 'all'>('all');
  const categoryPlatforms = platforms.filter(
    (item) => active === 'all' || item.category === active,
  );
  const ids = new Set(categoryPlatforms.map((item) => item.id));
  const visibleEvents = events
    .filter((event) => ids.has(event.platform))
    .toSorted((a, b) => b.date.localeCompare(a.date));
  const rows =
    active === 'all'
      ? exposureRows
      : exposureRows.flatMap((row) => {
          const matching = visibleEvents.filter((event) => event.exposures.includes(row.name));
          if (!matching.length) return [];
          return [
            {
              ...row,
              count: matching.length,
              date: matching[0].date.slice(5),
              heat: Math.round((matching.length / visibleEvents.length) * 100),
            },
          ];
        });
  const selectCategory = (id: CategoryId) => setActive(active === id ? 'all' : id);
  const platformCounts = new Map(
    categories.map((category) => [
      category.id,
      platforms.filter((item) => item.category === category.id).length,
    ]),
  );
  const verifiedCount = relations.filter(
    (relation) =>
      relation.status === 'verified' && (ids.has(relation.source) || ids.has(relation.target)),
  ).length;
  return {
    categories,
    active,
    rows,
    events: visibleEvents,
    platformCounts,
    verifiedCount,
    selectCategory,
  };
}
