// 지도 선택 상태를 타일·관계·요약 데이터로 변환하는 훅
'use client';

import { useMemo } from 'react';
import type { Selection } from '@/lib/ecosystem-types';
import { useEcosystemData } from '@/hooks/use-ecosystem-data';
import { getCategoryTiles } from '@/components/map/geometry';

export function useMapData(selected: Selection, selectedRelation: string | null) {
  const { categories, platforms, relations, getPlatform } = useEcosystemData();
  const selectedPlatform = selected?.kind === 'platform' ? getPlatform(selected.id) : undefined;
  const activeCategory = selected?.kind === 'category' ? selected.id : selectedPlatform?.category;
  const relation = relations.find((item) => item.id === selectedRelation);
  const ids = new Set(
    selectedPlatform
      ? [selectedPlatform.id]
      : platforms.filter((item) => item.category === activeCategory).map((item) => item.id),
  );
  const relevantRelations = relations.filter(
    (item) => ids.has(item.source) || ids.has(item.target),
  );
  const tileGroups = useMemo(
    () => categories.map((category) => ({ category, cells: getCategoryTiles(category) })),
    [categories],
  );
  return {
    platforms,
    relation,
    activeCategory,
    selectedPlatform,
    tileGroups,
    title:
      selectedPlatform?.name ?? categories.find((item) => item.id === activeCategory)?.name ?? '',
    verifiedCount: relations.filter((item) => item.status === 'verified').length,
    selectedVerifiedCount: relevantRelations.filter((item) => item.status === 'verified').length,
    candidateCount: relevantRelations.filter((item) => item.status === 'candidate').length,
  };
}
