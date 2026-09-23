'use client';

import { useState } from 'react';
import { type CategoryId, type DetailTab, type Selection } from '@/lib/ecosystem-types';
import type { Scope, View } from './types';
import { useEcosystemData } from './ecosystem-data-context';

export function useExplorerState() {
  const { relations } = useEcosystemData();
  const [scope, setScope] = useState<Scope>('open');
  const [view, setView] = useState<View>('map');
  const [selected, setSelected] = useState<Selection>(null);
  const [tab, setTab] = useState<DetailTab>('overview');
  const [detailOpen, setDetailOpen] = useState(false);
  const [showAllRelations, setShowAllRelations] = useState(false);
  const [selectedRelation, setSelectedRelation] = useState<string | null>(null);

  const clearSelection = () => {
    setSelected(null);
    setTab('overview');
    setDetailOpen(false);
    setSelectedRelation(null);
    setShowAllRelations(false);
  };

  const selectCategory = (id: CategoryId) => {
    setScope('open');
    setView('map');
    setSelected({ kind: 'category', id });
    setTab('overview');
    setDetailOpen(true);
    setSelectedRelation(null);
    setShowAllRelations(false);
  };

  const selectPlatform = (id: string) => {
    setScope('open');
    setView('map');
    setSelected({ kind: 'platform', id });
    setTab('overview');
    setDetailOpen(true);
    setSelectedRelation(null);
    setShowAllRelations(false);
  };

  const selectRelation = (id: string | null) => {
    const relation = relations.find((item) => item.id === id);
    if (id && !relation) return;
    setSelectedRelation(id);
    if (!relation) return;
    setSelected({ kind: 'platform', id: relation.source });
    setTab('connections');
    setDetailOpen(true);
    setShowAllRelations(true);
  };

  const selectTab = (nextTab: DetailTab) => {
    setTab(nextTab);
    setSelectedRelation(null);
    setShowAllRelations(false);
  };

  const changeScope = (nextScope: Scope) => {
    setScope(nextScope);
    setView('map');
    setSelected(null);
    setTab('overview');
    setDetailOpen(false);
    setSelectedRelation(null);
    setShowAllRelations(nextScope === 'connected');
  };

  return {
    scope,
    view,
    selected,
    tab,
    detailOpen,
    showAllRelations,
    selectedRelation,
    setView,
    setDetailOpen,
    setShowAllRelations,
    clearSelection,
    selectCategory,
    selectPlatform,
    selectRelation,
    selectTab,
    changeScope,
  };
}
