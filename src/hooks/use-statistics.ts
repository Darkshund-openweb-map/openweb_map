// 통계 화면의 필터와 집계 데이터를 관리하는 훅
'use client';

import { useState } from 'react';
import type { CategoryId } from '@/lib/ecosystem-types';
import { useEcosystemData } from '@/hooks/use-ecosystem-data';
import { normalizeExposurePercentages } from '@/lib/event-aggregates';

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
      : normalizeExposurePercentages(
          exposureRows
            .flatMap((row) => {
              const matching = visibleEvents.filter((event) => event.exposures.includes(row.name));
              if (!matching.length) return [];
              return [
                {
                  ...row,
                  count: matching.length,
                  date: matching[0].date.slice(5),
                  state: matching[0].type,
                  heat: 0,
                },
              ];
            })
            .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'ko')),
        );
  const selectCategory = (id: CategoryId | 'all') => setActive(id);
  const verifiedCount = relations.filter(
    (relation) =>
      relation.status === 'verified' && (ids.has(relation.source) || ids.has(relation.target)),
  ).length;
  return {
    categories,
    active,
    rows,
    events: visibleEvents,
    verifiedCount,
    relations,
    selectCategory,
  };
}
