import { expect, test } from '@playwright/test';
import { fixtureIslandRows, platforms, relations, events, exposureRows } from '../src/lib/fixture';
import {
  applyIslandRows,
  createIslandCategories,
  parseIslandRows,
} from '../src/lib/island-categories';
import { queryIslandRows, readSupabaseConfig } from '../src/lib/supabase/island-query';

const config = { url: 'https://example.supabase.co', publishableKey: 'sb_publishable_test' };

test('DB rows control island names and presence while Korean labels exclude Other', () => {
  const categories = createIslandCategories(fixtureIslandRows);
  expect(categories.map((category) => category.name)).toEqual([
    '코드 호스팅',
    '오픈마켓',
    '텍스트 호스팅',
    '백엔드 서비스',
    '공식 웹사이트',
    '파일 호스팅',
    '커뮤니티',
  ]);
  expect(categories.every((category) => category.description === '')).toBe(true);
  expect(createIslandCategories([{ id: 1, name: '수정한 코드 분류' }])).toMatchObject([
    { id: 'code', sourceId: 1, name: '수정한 코드 분류' },
  ]);
  expect(createIslandCategories([])).toEqual([]);
  expect(createIslandCategories([{ id: 5, name: 'Other' }])).toEqual([]);
});

test('removing a DB island also removes orphaned platforms, incidents and relations', () => {
  const snapshot = applyIslandRows([{ id: 3, name: 'Text Hosting' }], {
    updatedAt: '2026-09-20',
    platforms,
    relations,
    events,
    exposureRows,
  });
  expect(snapshot.platforms.every((platform) => platform.category === 'text')).toBe(true);
  const platformIds = new Set(snapshot.platforms.map((platform) => platform.id));
  expect(snapshot.events.every((event) => platformIds.has(event.platform))).toBe(true);
  expect(snapshot.relations).toEqual([]);
  expect(snapshot.categories[0].count).toBe(snapshot.events.length);
});

test('island query reads only id and name from public without caching or writes', async () => {
  const requests: { url: URL; init?: RequestInit }[] = [];
  const fetcher: typeof fetch = async (input, init) => {
    requests.push({ url: new URL(String(input)), init });
    return Response.json(fixtureIslandRows);
  };
  expect(await queryIslandRows(config, fetcher)).toEqual(fixtureIslandRows);
  expect(requests).toHaveLength(1);
  const request = requests[0];
  expect(request.url.pathname).toBe('/rest/v1/island');
  expect(request.url.searchParams.get('select')).toBe('id,name');
  expect(request.url.searchParams.get('order')).toBe('id.asc');
  expect(request.init).toMatchObject({
    method: 'GET',
    cache: 'no-store',
    redirect: 'error',
    headers: { apikey: config.publishableKey, 'Accept-Profile': 'public' },
  });
});

test('query failures do not return fixture data or include keys in errors', async () => {
  const denied: typeof fetch = async () => new Response(config.publishableKey, { status: 403 });
  await expect(queryIslandRows(config, denied)).rejects.toThrow('조회 실패 (HTTP 403)');
  const offline: typeof fetch = async () => {
    throw new Error(config.publishableKey);
  };
  await expect(queryIslandRows(config, offline)).rejects.toThrow('조회 서버에 연결하지 못했습니다');
  const empty: typeof fetch = async () => Response.json([]);
  expect(await queryIslandRows(config, empty)).toEqual([]);
});

test('invalid rows and privileged keys are rejected', () => {
  expect(() => parseIslandRows({ id: 1, name: 'Code Hosting' })).toThrow();
  expect(() => parseIslandRows([{ id: 1, name: '' }])).toThrow();
  expect(() => parseIslandRows([fixtureIslandRows[0], fixtureIslandRows[0]])).toThrow();
  expect(() => readSupabaseConfig({})).toThrow('설정되지 않았습니다');
  expect(() =>
    readSupabaseConfig({
      NEXT_PUBLIC_SUPABASE_URL: config.url,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_secret_test',
    }),
  ).toThrow('Publishable key 또는 anon key');
  expect(
    readSupabaseConfig({
      NEXT_PUBLIC_SUPABASE_URL: config.url,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: config.publishableKey,
    }),
  ).toEqual(config);
});
