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

test('DB platform labels scatter in both axes and remain stable regardless of row order', () => {
  const data: DatabaseRows = {
    islands: [{ id: 6, name: 'Official Website' }],
    platforms: Array.from({ length: 5 }, (_, index) => ({
      id: index + 1,
      island_id: 6,
      name: `플랫폼 ${index + 1}`,
    })),
    incidents: [],
    dataTypes: [],
    connections: [],
  };
  const snapshot = createDatabaseSnapshot(data);
  expect(snapshot.categories[0].center).toEqual([417, 497]);
  expect(new Set(snapshot.platforms.map((platform) => platform.x)).size).toBeGreaterThan(2);
  expect(new Set(snapshot.platforms.map((platform) => platform.y)).size).toBeGreaterThan(2);
  expect(
    createDatabaseSnapshot({ ...data, platforms: [...data.platforms].reverse() }).platforms,
  ).toEqual(snapshot.platforms);
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

test('incident descriptions join by ID, preserve separate rows and original text, not similar titles', () => {
  const original = '  첫 번째 설명\n두 번째 줄 <b>원문</b>  ';
  const snapshot = createDatabaseSnapshot({
    ...rows,
    incidents: rows.incidents.map((row) => ({ ...(row as object), title: '동일한 사건 제목' })),
    dataTypes: [
      { id: 1, incident_id: 1, name: '이메일', category: '개인정보', description: original },
      {
        id: 2,
        incident_id: 1,
        name: '이메일',
        category: '개인정보',
        description: '같은 유형의 별도 설명',
      },
      {
        id: 3,
        incident_id: 2,
        name: '이메일',
        category: '개인정보',
        description: '다른 사건의 설명',
      },
      {
        id: 4,
        incident_id: 3,
        name: '숨긴 유형',
        category: '기타',
        description: '숨긴 사건의 설명',
      },
    ],
  });
  const first = snapshot.events.find((event) => event.id === 'incident-1')!;
  const second = snapshot.events.find((event) => event.id === 'incident-2')!;
  expect(first.dataTypes).toEqual([
    { id: 'incident-data-type-1', name: '이메일', category: '개인정보', description: original },
    {
      id: 'incident-data-type-2',
      name: '이메일',
      category: '개인정보',
      description: '같은 유형의 별도 설명',
    },
  ]);
  expect(first.exposures).toEqual(['이메일']);
  expect(second.dataTypes.map((item) => item.description)).toEqual(['다른 사건의 설명']);
  expect(
    snapshot.events
      .flatMap((event) => event.dataTypes)
      .some((item) => item.id === 'incident-data-type-4'),
  ).toBe(false);
});

test('missing descriptions and unlinked incidents stay empty without generated fallback text', () => {
  const snapshot = createDatabaseSnapshot({
    ...rows,
    dataTypes: [
      { id: 1, incident_id: 1, name: '이메일', description: null },
      { id: 2, incident_id: 1, name: '이메일' },
    ],
  });
  expect(
    snapshot.events
      .find((event) => event.id === 'incident-1')
      ?.dataTypes.map((item) => item.description),
  ).toEqual(['', '']);
  expect(snapshot.events.find((event) => event.id === 'incident-2')?.dataTypes).toEqual([]);
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
