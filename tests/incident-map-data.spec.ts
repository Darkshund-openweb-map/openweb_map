import { expect, test } from '@playwright/test';
import type { EcosystemSnapshot } from '../src/lib/ecosystem-types';
import { categories, events, platforms, relations } from '../src/lib/fixture';
import { getIncidentMapData } from '../src/lib/incident-map-data';
import { snapshotAtDate } from '../src/lib/snapshot-timeline';

const snapshot: EcosystemSnapshot = {
  updatedAt: '2026-09-20',
  categories: categories.map((category) => ({ ...category, count: 999 })),
  platforms,
  events: [
    { ...events[0], date: '2026-03-31' },
    { ...events[3], date: '2026-04-01' },
    { ...events[1], date: '2026-07-01' },
    events[2],
  ],
  relations: relations.map((relation) => ({ ...relation, firstSeen: '2026-01-01' })),
  exposureRows: [],
};

test('islands appear at their first incident, disappear on rewind and return at baseline', () => {
  const original = structuredClone(snapshot);
  for (const [date, expected] of [
    ['2026-03-30', []],
    ['2026-03-31', ['code']],
    ['2026-04-01', ['code', 'text']],
    ['2026-07-01', ['code', 'text', 'community']],
    ['2026-03-30', []],
    ['2026-09-20', ['code', 'text', 'community']],
  ] as const) {
    const visible = getIncidentMapData(snapshotAtDate(snapshot, date));
    expect(visible.categories.map((category) => category.id)).toEqual(expected);
  }
  expect(snapshot).toEqual(original);
  expect(snapshot.categories).toHaveLength(7);
});

test('relations never create islands or leave lines attached to hidden islands', () => {
  const before = getIncidentMapData(snapshotAtDate(snapshot, '2026-03-30'));
  expect(before.categories).toEqual([]);
  expect(before.platforms).toEqual([]);
  expect(before.relations).toEqual([]);
  const codeOnly = getIncidentMapData(snapshotAtDate(snapshot, '2026-03-31'));
  expect(codeOnly.relations).toEqual([]);
  const codeAndText = getIncidentMapData(snapshotAtDate(snapshot, '2026-04-01'));
  expect(codeAndText.relations.map((relation) => relation.id)).toEqual([
    'gist-pastebin',
    'gist-rentry',
    'code-text',
  ]);
  expect(codeAndText.platforms.some((platform) => platform.category === 'files')).toBe(false);
});

test('map totals use incidents rather than stale counters and keep platform locations stable', () => {
  const latest = getIncidentMapData(snapshot);
  expect(latest.categories.map((category) => [category.id, category.count])).toEqual([
    ['code', 1],
    ['text', 1],
    ['community', 2],
  ]);
  for (const platform of latest.platforms) {
    expect(platform).toBe(snapshot.platforms.find((item) => item.id === platform.id));
  }
  const older = getIncidentMapData(snapshotAtDate(snapshot, '2026-03-31'));
  expect(older.categories[0].center).toEqual(latest.categories[0].center);
  expect(older.categories[0].badge).toEqual(latest.categories[0].badge);
});

test('empty data and orphaned incidents do not create placeholder islands', () => {
  for (const incidentList of [[], [{ ...events[0], platform: 'missing-platform' }]]) {
    const result = getIncidentMapData({ ...snapshot, events: incidentList });
    expect(result.categories).toEqual([]);
    expect(result.platforms).toEqual([]);
    expect(result.events).toEqual([]);
    expect(result.relations).toEqual([]);
  }
});
