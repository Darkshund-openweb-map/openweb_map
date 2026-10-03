// 헤더 검색 결과와 키보드·포인터 상호작용을 관리하는 훅
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { type CategoryId } from '@/lib/ecosystem-types';
import { useEcosystemData } from '@/hooks/use-ecosystem-data';

type Options = {
  onSelectCategory: (id: CategoryId) => void;
  onSelectPlatform: (id: string) => void;
  onSelectIncident: (platformId: string, incidentId: string) => void;
  onSelectRelation: (relationId: string) => void;
};

export function useEcosystemSearch({
  onSelectCategory,
  onSelectPlatform,
  onSelectIncident,
  onSelectRelation,
}: Options) {
  const { categories, platforms, events, relations, getCategory, getPlatform } = useEcosystemData();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const regionRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    const quickPriority = new Map([
      ['github', 0],
      ['gist', 1],
      ['pastebin', 2],
      ['supabase', 3],
      ['github gist', 4],
    ]);
    const categoryPriority = new Map<CategoryId, number>([
      ['code', 0],
      ['text', 1],
      ['backend', 2],
      ['marketplace', 3],
      ['files', 4],
      ['community', 5],
      ['official', 6],
    ]);
    const categoryHits = normalized
      ? categories
          .filter((item) => item.name.toLocaleLowerCase().includes(normalized))
          .map((item) => ({
            key: `c-${item.id}`,
            label: item.name,
            sub: '플랫폼 유형',
            color: item.color,
            category: item.id,
            platform: null as string | null,
            targetId: item.id,
            kind: 'platform' as const,
            score: item.name.toLocaleLowerCase() === normalized ? 0 : 2,
          }))
      : [];
    const platformHits = platforms
      .filter((item) =>
        !normalized
          ? true
          : `${item.name} ${item.domain} ${item.aliases?.join(' ') ?? ''}`
              .toLocaleLowerCase()
              .includes(normalized),
      )
      .map((item) => ({
        key: `p-${item.id}`,
        label: item.name,
        sub: item.domain,
        color: getCategory(item.category).color,
        category: item.category,
        platform: item.id,
        targetId: item.id,
        kind: 'platform' as const,
        score: (() => {
          const name = item.name.toLocaleLowerCase();
          if (!normalized) {
            return (
              (categoryPriority.get(item.category) ?? 5) * 100 + (quickPriority.get(name) ?? 20)
            );
          }
          if (name === normalized) return 0;
          if (name.startsWith(normalized)) return 1;
          if (name.includes(normalized)) return 2;
          return 3;
        })(),
      }));
    const incidentHits = normalized
      ? events
          .filter((item) =>
            [
              item.title,
              ...item.exposures,
              ...item.dataTypes.flatMap((dataType) => [dataType.name, dataType.category]),
            ]
              .join(' ')
              .toLocaleLowerCase()
              .includes(normalized),
          )
          .map((item) => {
            const platform = getPlatform(item.platform);
            return {
              key: `e-${item.id}`,
              label: item.title,
              sub: `사건명 일치 · ${platform?.name ?? item.platform}`,
              color: platform ? getCategory(platform.category).color : '#176bfa',
              category: platform?.category ?? ('code' as CategoryId),
              platform: item.platform,
              targetId: item.id,
              kind: 'incident' as const,
              score: item.title.toLocaleLowerCase() === normalized ? 0 : 1,
            };
          })
      : [];
    const relationHits = normalized
      ? relations
          .filter((item) => {
            const source = getPlatform(item.source)?.name ?? item.source;
            const target = getPlatform(item.target)?.name ?? item.target;
            return `${item.type} ${source} ${target} ${item.note}`
              .toLocaleLowerCase()
              .includes(normalized);
          })
          .map((item) => {
            const source = getPlatform(item.source);
            const target = getPlatform(item.target);
            return {
              key: `r-${item.id}`,
              label: `${source?.name ?? item.source} → ${target?.name ?? item.target}`,
              sub: item.type,
              color: source ? getCategory(source.category).color : '#8053e9',
              category: source?.category ?? ('code' as CategoryId),
              platform: item.source,
              targetId: item.id,
              kind: 'relation' as const,
              score: item.type.toLocaleLowerCase() === normalized ? 0 : 2,
            };
          })
      : [];

    const kindPriority = { incident: 0, platform: 1, relation: 2 };
    return [...incidentHits, ...platformHits, ...categoryHits, ...relationHits]
      .sort(
        (a, b) =>
          (normalized ? kindPriority[a.kind] - kindPriority[b.kind] : 0) ||
          a.score - b.score ||
          a.label.localeCompare(b.label, 'ko'),
      )
      .slice(0, normalized ? 18 : undefined);
  }, [categories, events, getCategory, getPlatform, platforms, query, relations]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen(true);
        inputRef.current?.focus();
      }
      if (event.key === 'Escape') {
        setOpen(false);
        inputRef.current?.blur();
      }
    };
    const onPointer = (event: PointerEvent) => {
      if (regionRef.current && !regionRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, []);

  const choose = (index: number) => {
    const result = results[index];
    if (!result) return;
    if (result.kind === 'incident' && result.platform)
      onSelectIncident(result.platform, result.targetId);
    else if (result.kind === 'relation') onSelectRelation(result.targetId);
    else if (result.platform) onSelectPlatform(result.platform);
    else onSelectCategory(result.category);
    setQuery('');
    setOpen(false);
    inputRef.current?.blur();
  };

  return {
    query,
    open,
    activeIndex,
    results,
    regionRef,
    inputRef,
    setQuery,
    setOpen,
    setActiveIndex,
    choose,
  };
}
