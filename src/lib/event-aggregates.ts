import type { EcosystemEvent, ExposureRow } from './ecosystem-types';

// 사건별 중복 노출 유형을 제거하고, 현재 조회 범위의 최신 사건으로 집계한다.
export function aggregateExposures(events: EcosystemEvent[]): ExposureRow[] {
  const rows = new Map<string, ExposureRow>();
  for (const event of events.toSorted((a, b) => b.date.localeCompare(a.date))) {
    for (const name of new Set(event.exposures)) {
      const row = rows.get(name) ?? {
        name,
        count: 0,
        heat: 0,
        date: event.date.slice(5),
        state: event.type,
      };
      row.count += 1;
      row.heat = Math.round((row.count / events.length) * 100);
      rows.set(name, row);
    }
  }
  return [...rows.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'ko'));
}
