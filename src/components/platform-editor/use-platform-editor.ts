'use client';

import { useState, type FormEvent } from 'react';
import type { CategoryId, Platform } from '@/lib/ecosystem-types';
import { useEcosystemData } from '../explorer/ecosystem-data-context';
import { getPlatformPosition } from '../map/geometry';

export type EditorMode = 'add' | 'edit' | 'delete';

export function usePlatformEditor(
  platform: Platform,
  mode: EditorMode,
  onSaved: (id: string) => void,
  onDeleted: () => void,
) {
  const data = useEcosystemData();
  const [fields, setFields] = useState({
    name: mode === 'add' ? '' : platform.name,
    domain: mode === 'add' ? '' : platform.domain,
    description: mode === 'add' ? '' : platform.description,
    category: platform.category,
  });
  const [error, setError] = useState('');
  const setField = (key: 'name' | 'domain' | 'description', value: string) =>
    setFields((current) => ({ ...current, [key]: value }));
  const setCategory = (category: CategoryId) => setFields((current) => ({ ...current, category }));
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      if (mode === 'delete') {
        data.deletePlatform(platform.id);
        onDeleted();
        return;
      }
      const id = mode === 'add' ? `local-${crypto.randomUUID()}` : platform.id;
      const position =
        mode === 'edit' && fields.category === platform.category
          ? { x: platform.x, y: platform.y }
          : getPlatformPosition(
              data.getCategory(fields.category),
              data.platforms.filter((item) => item.id !== id),
            );
      const next: Platform = {
        ...(mode === 'edit' ? platform : {}),
        ...fields,
        ...position,
        id,
        featured: true,
      };
      if (mode === 'add') data.addPlatform(next);
      else data.updatePlatform(next);
      onSaved(id);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '저장하지 못했습니다. 다시 시도해 주세요.');
    }
  };
  return {
    fields,
    setField,
    setCategory,
    submit,
    error,
    categories: data.categories,
    eventCount: data.events.filter((event) => event.platform === platform.id).length,
    relationCount: data.relations.filter(
      (relation) => relation.source === platform.id || relation.target === platform.id,
    ).length,
  };
}
