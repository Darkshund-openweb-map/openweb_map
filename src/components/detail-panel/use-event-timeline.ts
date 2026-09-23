'use client';

import { useState } from 'react';
import type { EcosystemEvent } from '@/lib/ecosystem-types';

export const EVENT_PERIODS = ['7일', '30일', '90일', '전체'] as const;
type Period = (typeof EVENT_PERIODS)[number];
type DateRange = { start: string; end: string };

function periodRange(period: Period, referenceDate: string): DateRange {
  if (period === '전체') return { start: '', end: referenceDate };
  const start = new Date(`${referenceDate}T00:00:00Z`);
  start.setUTCDate(start.getUTCDate() - Number.parseInt(period, 10) + 1);
  return { start: start.toISOString().slice(0, 10), end: referenceDate };
}

export function useEventTimeline(events: EcosystemEvent[], referenceDate: string) {
  const [period, setPeriod] = useState<Period | null>('90일');
  const [range, setRange] = useState(() => periodRange('90일', referenceDate));
  const [draftRange, setDraftRange] = useState(range);
  const [dateOpen, setDateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const invalidRange = Boolean(
    draftRange.start && draftRange.end && draftRange.start > draftRange.end,
  );
  const visibleEvents = events
    .filter(
      (event) =>
        (!range.start || event.date >= range.start) && (!range.end || event.date <= range.end),
    )
    .toSorted((a, b) => b.date.localeCompare(a.date));
  const groups = new Map<string, EcosystemEvent[]>();
  for (const event of visibleEvents) {
    const month = event.date.slice(0, 7);
    groups.set(month, [...(groups.get(month) ?? []), event]);
  }

  const selectPeriod = (next: Period) => {
    const nextRange = periodRange(next, referenceDate);
    setPeriod(next);
    setRange(nextRange);
    setDraftRange(nextRange);
    setDateOpen(false);
  };
  const applyRange = () => {
    if (invalidRange) return;
    setRange(draftRange);
    setPeriod(null);
    setDateOpen(false);
  };

  return {
    period,
    range,
    draftRange,
    dateOpen,
    invalidRange,
    groups,
    selectedId: visibleEvents.some((event) => event.id === selectedId)
      ? selectedId
      : visibleEvents[0]?.id,
    visibleCount: visibleEvents.length,
    selectPeriod,
    applyRange,
    setDraftRange,
    setDateOpen,
    setSelectedId,
  };
}
