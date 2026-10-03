// 탐색 화면의 범위·선택·탭·관계 표시 상태를 관리하는 훅
'use client';

import { useState } from 'react';
import { type CategoryId, type DetailTab, type Selection } from '@/lib/ecosystem-types';
import type { Scope, View } from '@/types/explorer';
import { useEcosystemData } from '@/hooks/use-ecosystem-data';

export function useExplorerState() {
  const { relations, timeline } = useEcosystemData();
  const [scope, setScope] = useState<Scope>('open');
  const [view, setView] = useState<View>('map');
  const [selected, setSelected] = useState<Selection>(null);
  const [tab, setTab] = useState<DetailTab>('overview');
  const [detailOpen, setDetailOpen] = useState(false);
  const [showAllRelations, setShowAllRelations] = useState(false);
  const [selectedRelation, setSelectedRelation] = useState<string | null>(null);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);

  const clearSelection = () => {
    setSelected(null);
    setTab('overview');
    setDetailOpen(false);
    setSelectedRelation(null);
    setSelectedIncidentId(null);
    setShowAllRelations(false);
  };

  const selectCategory = (id: CategoryId) => {
    setScope('open');
    setView('map');
    setSelected({ kind: 'category', id });
    setTab('overview');
    setDetailOpen(true);
    setSelectedRelation(null);
    setSelectedIncidentId(null);
    setShowAllRelations(false);
  };

  const selectPlatform = (id: string) => {
    setScope('open');
    setView('map');
    setSelected({ kind: 'platform', id });
    setTab('overview');
    setDetailOpen(true);
    setSelectedRelation(null);
    setSelectedIncidentId(null);
    setShowAllRelations(false);
  };

  const selectIncident = (platformId: string, incidentId?: string) => {
    selectPlatform(platformId);
    setTab('events');
    setSelectedIncidentId(incidentId ?? null);
  };

  const selectRelation = (id: string | null) => {
    const relation = relations.find((item) => item.id === id);
    if (id && !relation) return;
    setSelectedRelation(id);
    setSelectedIncidentId(null);
    if (!relation) return;
    setSelected({ kind: 'platform', id: relation.source });
    setTab('connections');
    setDetailOpen(true);
    setShowAllRelations(true);
  };

  const selectTab = (nextTab: DetailTab) => {
    setTab(nextTab);
    setSelectedRelation(null);
    setSelectedIncidentId(null);
    setShowAllRelations(false);
  };

  const changeScope = (nextScope: Scope) => {
    if (nextScope === 'dark') timeline.pause();
    setScope(nextScope);
    setView('map');
    setSelected(null);
    setTab('overview');
    setDetailOpen(false);
    setSelectedRelation(null);
    setSelectedIncidentId(null);
    setShowAllRelations(nextScope === 'connected');
  };

  return {
    scope,
    view,
    selected,
    tab,
    detailOpen,
    showAllRelations,
    selectedRelation: relations.some((relation) => relation.id === selectedRelation)
      ? selectedRelation
      : null,
    selectedIncidentId,
    setView,
    setDetailOpen,
    setShowAllRelations,
    clearSelection,
    selectCategory,
    selectPlatform,
    selectIncident,
    clearSelectedIncident: () => setSelectedIncidentId(null),
    selectRelation,
    selectTab,
    changeScope,
  };
}
