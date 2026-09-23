'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { type CategoryId } from '@/lib/ecosystem-types';
import { useEcosystemData } from './ecosystem-data-context';

type Options = {
  onSelectCategory: (id: CategoryId) => void;
  onSelectPlatform: (id: string) => void;
};

export function useEcosystemSearch({ onSelectCategory, onSelectPlatform }: Options) {
  const { categories, platforms, getCategory } = useEcosystemData();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const regionRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    const categoryHits = categories
      .filter((item) => !normalized || item.name.toLocaleLowerCase().includes(normalized))
      .map((item) => ({
        key: `c-${item.id}`,
        label: item.name,
        sub: '플랫폼 유형',
        color: item.color,
        category: item.id,
        platform: null as string | null,
      }));
    const platformHits = platforms
      .filter((item) =>
        !normalized
          ? item.featured
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
      }));
    return [...platformHits, ...categoryHits].slice(0, 8);
  }, [categories, getCategory, platforms, query]);

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
    if (result.platform) onSelectPlatform(result.platform);
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
