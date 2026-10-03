import type { EcosystemSnapshot } from './ecosystem-types';
import type { SnapshotQuarter } from '@/types/snapshot-timeline';
import { aggregateExposures } from './event-aggregates';

function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function quarterIndex(value: string): number {
  return Number(value.slice(0, 4)) * 4 + Math.floor((Number(value.slice(5, 7)) - 1) / 3);
}

export function hasTimelineData(snapshot: EcosystemSnapshot): boolean {
  return (
    snapshot.events.some((event) => validDate(event.date)) ||
    snapshot.relations.some(
      (relation) => validDate(relation.firstSeen || '') || validDate(relation.recordedAt || ''),
    )
  );
}

export function createSnapshotQuarters(snapshot: EcosystemSnapshot): SnapshotQuarter[] {
  if (!validDate(snapshot.updatedAt)) throw new Error('유효한 지도 기준일이 필요합니다.');
  const last = quarterIndex(snapshot.updatedAt);
  const dates = [
    ...snapshot.events.map((event) => event.date),
    ...snapshot.relations.map((relation) =>
      validDate(relation.firstSeen) ? relation.firstSeen : (relation.recordedAt ?? ''),
    ),
  ].filter((date) => validDate(date) && date <= snapshot.updatedAt);
  // 최소 5년을 제공하되 더 오래된 실제 사건도 빠짐없이 탐색할 수 있게 확장한다.
  const first = dates.reduce((earliest, date) => Math.min(earliest, quarterIndex(date)), last - 20);
  return Array.from({ length: last - first + 1 }, (_, index) => {
    const absolute = first + index;
    const year = Math.floor(absolute / 4);
    const quarter = (absolute % 4) + 1;
    return {
      label: `${year} Q${quarter}`,
      date:
        absolute === last
          ? snapshot.updatedAt
          : new Date(Date.UTC(year, quarter * 3, 0)).toISOString().slice(0, 10),
    };
  });
}

export function timelineTicks(length: number): number[] {
  const last = length - 1;
  if (last <= 0) return [0];
  const step = Math.max(4, Math.ceil(last / 24) * 4);
  const ticks = [last];
  for (let index = last - step; index >= step / 2; index -= step) ticks.unshift(index);
  return [0, ...ticks];
}

// 과거 DB 복원본이 아니라 현재 조회한 사건을 발생일 기준으로 누적 집계한 화면이다.
// 플랫폼의 이름·배치는 현재 값을 유지한다. 날짜 없는 관계는 과거에 임의로 표시하지 않는다.
export function snapshotAtDate(snapshot: EcosystemSnapshot, cutoff: string): EcosystemSnapshot {
  if (!validDate(cutoff)) throw new Error('유효한 조회 날짜가 필요합니다.');
  if (cutoff >= snapshot.updatedAt) return snapshot;
  const events = snapshot.events.filter((event) => validDate(event.date) && event.date <= cutoff);
  const platformCategories = new Map(
    snapshot.platforms.map((platform) => [platform.id, platform.category]),
  );
  return {
    ...snapshot,
    readOnly: true,
    events,
    categories: snapshot.categories.map((category) => ({
      ...category,
      count: events.filter((event) => platformCategories.get(event.platform) === category.id)
        .length,
    })),
    relations: snapshot.relations
      .filter((relation) => {
        const start = validDate(relation.firstSeen)
          ? relation.firstSeen
          : (relation.recordedAt ?? '');
        return validDate(start) && start <= cutoff;
      })
      .map((relation) => ({
        ...relation,
        lastSeen:
          validDate(relation.lastSeen) && relation.lastSeen > cutoff ? '—' : relation.lastSeen,
      })),
    exposureRows: aggregateExposures(events),
  };
}
