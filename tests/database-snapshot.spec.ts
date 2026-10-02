import { expect, test } from '@playwright/test';
import { createDatabaseSnapshot, type DatabaseRows } from '../src/lib/supabase/database-snapshot';
import { queryTableRows } from '../src/lib/supabase/rest-query';

const timestamp = '2026-10-02T12:00:00+00:00';
const rows: DatabaseRows = {
  islands: [
    { id: 1, name: 'Code Hosting' },
    { id: 5, name: 'Other' },
    { id: 8, name: 'Community' },
  ],
  platforms: [
    {
      id: 1,
      island_id: 8,
      name: 'X',
      domain: 'x.com',
      description: '',
      incidents_count: 0,
      updated_at: timestamp,
    },
    {
      id: 11,
      island_id: 1,
      name: 'Github',
      domain: 'github.com',
      description: '',
      updated_at: timestamp,
    },
    { id: 90, island_id: 5, name: '숨긴 플랫폼', domain: 'example.com', description: '' },
  ],
  incidents: [
    {
      id: 1,
      platform_id: 1,
      title: '실제 사건 A',
      status: '검토중',
      published_at: '2026-09-30T00:00:00+00:00',
      created_at: timestamp,
    },
    {
      id: 2,
      platform_id: 1,
      title: '실제 사건 B',
      status: '검토중',
      published_at: null,
      created_at: timestamp,
    },
    { id: 3, platform_id: 90, title: '숨긴 사건', status: '검토중', published_at: timestamp },
  ],
  dataTypes: [
    { id: 1, incident_id: 1, name: '이메일', category: '개인정보' },
    { id: 2, incident_id: 1, name: ' 이메일 ', category: '개인정보' },
    { id: 3, incident_id: 2, name: '이메일', category: '개인정보' },
    { id: 4, incident_id: 3, name: '숨긴 정보', category: '기타' },
  ],
  connections: [],
};

test('only DB platforms and incidents appear with actual names and numeric ID associations', () => {
  const snapshot = createDatabaseSnapshot(rows);
  expect(snapshot.readOnly).toBe(true);
  expect(snapshot.platforms.map((platform) => platform.name).sort()).toEqual(['Github', 'X']);
  expect(snapshot.events.map((event) => event.platform)).toEqual(['platform-1', 'platform-1']);
  expect(snapshot.events[0].date).toBe('2026-10-02');
  expect(snapshot.categories.find((category) => category.id === 'community')?.count).toBe(2);
  expect(snapshot.relations).toEqual([]);
  expect(snapshot.updatedAt).toBe('2026-10-02');
});

test('exposure counts deduplicate incident type rows and exclude hidden islands', () => {
  const snapshot = createDatabaseSnapshot(rows);
  expect(snapshot.exposureRows).toEqual([
    { name: '이메일', count: 2, heat: 100, date: '10-02', state: '검토중' },
  ]);
  expect(snapshot.events.every((event) => event.exposures.length === 1)).toBe(true);
});

test('DB platform labels get separated slots while retaining the island center', () => {
  const snapshot = createDatabaseSnapshot({
    islands: [{ id: 6, name: 'Official Website' }],
    platforms: Array.from({ length: 5 }, (_, index) => ({
      id: index + 1,
      island_id: 6,
      name: `플랫폼 ${index + 1}`,
    })),
    incidents: [],
    dataTypes: [],
    connections: [],
  });
  const category = snapshot.categories[0];
  for (const [index, platform] of snapshot.platforms.entries()) {
    expect(platform.x).toBe(category.center[0]);
    if (index) expect(platform.y - snapshot.platforms[index - 1].y).toBeGreaterThanOrEqual(30);
  }
  expect(snapshot.platforms[2].y).toBe(category.center[1]);
});

test('empty DB tables remain empty instead of showing fixture platforms or relationships', () => {
  const snapshot = createDatabaseSnapshot({
    ...rows,
    platforms: [],
    incidents: [],
    dataTypes: [],
    connections: [],
  });
  expect(snapshot.platforms).toEqual([]);
  expect(snapshot.events).toEqual([]);
  expect(snapshot.relations).toEqual([]);
  expect(snapshot.exposureRows).toEqual([]);
  expect(snapshot.categories.every((category) => category.count === 0)).toBe(true);
});

test('relationships without verification evidence are not marked verified', () => {
  const snapshot = createDatabaseSnapshot({
    ...rows,
    connections: [
      {
        id: 1,
        source_platform_id: 1,
        target_platform_id: 11,
        connection_type: '재게시',
        created_at: timestamp,
      },
    ],
  });
  expect(snapshot.relations).toMatchObject([
    {
      source: 'platform-1',
      target: 'platform-11',
      status: 'candidate',
      confidence: '미평가',
      evidence: 0,
    },
  ]);
});

test('large DB results follow Content-Range rather than silently truncating a server-capped page', async () => {
  const offsets: string[] = [];
  const fetcher: typeof fetch = async (input) => {
    const offset = new URL(String(input)).searchParams.get('offset')!;
    offsets.push(offset);
    return offset === '0'
      ? Response.json([{ id: 1 }, { id: 2 }], { headers: { 'Content-Range': '0-1/3' } })
      : Response.json([{ id: 3 }], { headers: { 'Content-Range': '2-2/3' } });
  };
  const result = await queryTableRows(
    { url: 'https://example.supabase.co', publishableKey: 'sb_publishable_test' },
    'incidents',
    'id',
    fetcher,
  );
  expect(result).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
  expect(offsets).toEqual(['0', '2']);
});
