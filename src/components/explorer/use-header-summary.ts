'use client';

import type { DetailTab, Selection } from '@/lib/ecosystem-types';
import { useEcosystemData } from './ecosystem-data-context';

export function useHeaderSummary(
  selected: Selection,
  tab: DetailTab,
  selectedRelation: string | null,
) {
  const { categories, platforms, relations, events, getPlatform } = useEcosystemData();
  const relation = relations.find((item) => item.id === selectedRelation);
  if (relation)
    return `관계선 선택됨 · 근거 ${relation.evidence}건 · ${relation.status === 'verified' ? '검증 완료' : '검증 대기'}`;
  const relevant = relations.filter(
    (item) =>
      !selected ||
      (selected.kind === 'platform'
        ? item.source === selected.id || item.target === selected.id
        : getPlatform(item.source)?.category === selected.id ||
          getPlatform(item.target)?.category === selected.id),
  );
  if (selected && tab === 'connections')
    return `검증 완료 ${relevant.filter((item) => item.status === 'verified').length}건 · 후보 ${relevant.filter((item) => item.status === 'candidate').length}건 · 제외 ${relevant.filter((item) => item.status === 'excluded').length}건`;
  return `플랫폼 유형 ${categories.length}개 · 공개 플랫폼 ${platforms.length}곳 · 조회 가능 사건 ${events.length}건`;
}
