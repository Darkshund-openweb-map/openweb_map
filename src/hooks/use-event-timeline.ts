// 사건 타임라인의 기간과 날짜 범위 상태를 관리하는 훅
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

export function useEventTimeline(
  events: EcosystemEvent[],
  referenceDate: string,
  requestedEventId: string | null = null,
) {
  const initialPeriod: Period = requestedEventId ? '전체' : '90일';
  const [period, setPeriod] = useState<Period | null>(initialPeriod);
  const [customRange, setCustomRange] = useState(() => periodRange(initialPeriod, referenceDate));
  const effectivePeriod: Period | null = requestedEventId ? '전체' : period;
  const range = effectivePeriod ? periodRange(effectivePeriod, referenceDate) : customRange;
  const [draftRange, setDraftRange] = useState(range);
  const [dateOpen, updateDateOpen] = useState(false);
  const setDateOpen = (open: boolean) => {
    if (open) setDraftRange(range);
    updateDateOpen(open);
  };
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
    setDraftRange(nextRange);
    setDateOpen(false);
  };
  const applyRange = () => {
    if (invalidRange) return;
    setCustomRange(draftRange);
    setPeriod(null);
    setDateOpen(false);
  };

  return {
    period: effectivePeriod,
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
