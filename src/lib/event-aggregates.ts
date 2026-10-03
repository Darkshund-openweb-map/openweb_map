import type { EcosystemEvent, ExposureRow } from './ecosystem-types';

export function normalizeExposurePercentages<T extends { count: number }>(rows: T[]) {
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  if (!total) return rows.map((row) => ({ ...row, heat: 0 }));
  const shares = rows.map((row, index) => {
    const exact = (row.count / total) * 100;
    return { index, base: Math.floor(exact), remainder: exact - Math.floor(exact) };
  });
  let remaining = 100 - shares.reduce((sum, share) => sum + share.base, 0);
  const order = shares
    .toSorted((a, b) => b.remainder - a.remainder || a.index - b.index)
    .map((share) => share.index);
  const percentages = shares.map((share) => share.base);
  for (const index of order) {
    if (!remaining) break;
    percentages[index] += 1;
    remaining -= 1;
  }
  return rows.map((row, index) => ({ ...row, heat: percentages[index] }));
}

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
      rows.set(name, row);
    }
  }
  return normalizeExposurePercentages(
    [...rows.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'ko')),
  );
}
