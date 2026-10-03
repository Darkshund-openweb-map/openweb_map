// 지도 선택 상태를 타일·관계·요약 데이터로 변환하는 훅
'use client';

import { useMemo } from 'react';
import type { Selection } from '@/lib/ecosystem-types';
import { useEcosystemData } from '@/hooks/use-ecosystem-data';
import { getSizedCategoryTiles } from '@/lib/hex-layout';
import { getIncidentMapData } from '@/lib/incident-map-data';
import {
  assignTerritoryCells,
  BASE_ISLAND_TILES,
  getPlatformTileQuotas,
} from '@/lib/island-territories';

export function useMapData(requestedSelection: Selection, selectedRelation: string | null) {
  const snapshot = useEcosystemData();
  const { categories, platforms, events, relations } = useMemo(
    () => getIncidentMapData(snapshot, snapshot.timeline.isLatest),
    [snapshot],
  );
  // 숨겨진 섬의 선택 정보는 상위 화면에 보존하되 지도에서는 강조하지 않는다.
  const selected: Selection =
    requestedSelection?.kind === 'category'
      ? categories.some((category) => category.id === requestedSelection.id)
        ? requestedSelection
        : null
      : requestedSelection?.kind === 'platform' &&
          platforms.some((platform) => platform.id === requestedSelection.id)
        ? requestedSelection
        : null;
  const selectedPlatform =
    selected?.kind === 'platform'
      ? platforms.find((platform) => platform.id === selected.id)
      : undefined;
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
    () =>
      categories.map((category) => {
        // 플랫폼 순서를 고정해 데이터 재조회 뒤에도 같은 영토 배치를 유지한다.
        const members = platforms
          .filter((platform) => platform.category === category.id)
          .sort((a, b) => b.x - a.x || a.y - b.y || a.id.localeCompare(b.id));
        const quotas = getPlatformTileQuotas(members, events);
        const tileCount = quotas.length
          ? quotas.reduce((sum, quota) => sum + quota.count, 0)
          : BASE_ISLAND_TILES;
        const cells = getSizedCategoryTiles(category, tileCount);
        const owners = assignTerritoryCells(cells, quotas, members);
        return { category, cells, owners };
      }),
    [categories, platforms, events],
  );
  return {
    isLatest: snapshot.timeline.isLatest,
    selected,
    platforms,
    events,
    relations,
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
