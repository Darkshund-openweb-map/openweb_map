import { expect, test } from '@playwright/test';
import type { EcosystemEvent, EcosystemSnapshot, Relation } from '../src/lib/ecosystem-types';
import { categories, platforms } from '../src/lib/fixture';
import {
  createSnapshotQuarters,
  hasTimelineData,
  snapshotAtDate,
  timelineTicks,
} from '../src/lib/snapshot-timeline';

function event(id: string, date: string, exposures = ['이메일']): EcosystemEvent {
  return {
    id,
    date,
    title: id,
    platform: platforms[0].id,
    type: '검토중',
    meta: '',
    exposures,
    dataTypes: [],
  };
}

function relation(id: string, firstSeen: string, recordedAt?: string): Relation {
  return {
    id,
    source: platforms[0].id,
    target: platforms[1].id,
    type: '재게시',
    status: 'candidate',
    confidence: '미평가',
    evidence: 0,
    firstSeen,
    recordedAt,
    lastSeen: '2026-10-02',
    note: '',
  };
}

const snapshot: EcosystemSnapshot = {
  updatedAt: '2026-10-02',
  categories,
  platforms,
  events: [
    event('a', '2024-02-29', ['이메일', '이메일']),
    event('b', '2024-03-31'),
    event('c', '2024-04-01', ['전화번호']),
  ],
  relations: [
    relation('known', '2024-03-01'),
    relation('future', '2026-01-01'),
    relation('unknown', '—'),
    relation('recorded', '—', '2024-03-31'),
  ],
  exposureRows: [],
};

test('quarters include old events, leap dates, year boundaries and the exact latest date', () => {
  const quarters = createSnapshotQuarters({ ...snapshot, events: [event('old', '2013-08-19')] });
  expect(quarters[0]).toEqual({ label: '2013 Q3', date: '2013-09-30' });
  expect(quarters.at(-1)).toEqual({ label: '2026 Q4', date: '2026-10-02' });
  const yearEnd = quarters.findIndex((quarter) => quarter.label === '2023 Q4');
  expect(quarters[yearEnd].date).toBe('2023-12-31');
  expect(quarters[yearEnd + 1]).toEqual({ label: '2024 Q1', date: '2024-03-31' });
  expect(snapshotAtDate(snapshot, '2024-02-29').events.map((item) => item.id)).toEqual(['a']);
  expect(() => snapshotAtDate(snapshot, '2024-02-30')).toThrow();
  expect(createSnapshotQuarters({ ...snapshot, events: [], relations: [] })).toHaveLength(21);
  const ticks = timelineTicks(quarters.length);
  expect(ticks[0]).toBe(0);
  expect(ticks.at(-1)).toBe(quarters.length - 1);
  expect(ticks).toHaveLength(new Set(ticks).size);
});

test('historical counts and exposure rows use only events at or before the cutoff without mutation', () => {
  const original = structuredClone(snapshot);
  const historical = snapshotAtDate(snapshot, '2024-03-31');
  expect(historical.events.map((item) => item.id)).toEqual(['a', 'b']);
  expect(historical.exposureRows).toEqual([
    { name: '이메일', count: 2, heat: 100, date: '03-31', state: '검토중' },
  ]);
  expect(historical.categories.find((item) => item.id === platforms[0].category)?.count).toBe(2);
  expect(historical.readOnly).toBe(true);
  expect(historical.platforms).toBe(snapshot.platforms);
  expect(snapshot).toEqual(original);
  expect(snapshotAtDate(snapshot, snapshot.updatedAt)).toBe(snapshot);
  expect(snapshotAtDate(snapshot, '2020-01-01').events).toEqual([]);
  expect(snapshotAtDate(snapshot, '2020-01-01').exposureRows).toEqual([]);
});

test('future and undated relations never appear in earlier snapshots or leak future last-seen dates', () => {
  const historical = snapshotAtDate(snapshot, '2024-03-31');
  expect(historical.relations.map((item) => item.id)).toEqual(['known', 'recorded']);
  expect(historical.relations.every((item) => item.lastSeen === '—')).toBe(true);
  expect(hasTimelineData({ ...snapshot, events: [], relations: [relation('unknown', '—')] })).toBe(
    false,
  );
  expect(hasTimelineData(snapshot)).toBe(true);
});

test('dragging the timeline updates map counts and baseline restores all fixture events', async ({
  page,
}) => {
  await page.goto('/');
  const timeline = page.getByRole('region', { name: '지도 타임라인' });
  const slider = timeline.getByRole('slider', { name: '지도 기준 시점' });
  await expect(timeline.getByLabel('선택한 분기')).toHaveText('2026 Q3');
  await expect(timeline).toContainText('누적 사건 4건');
  await expect(page.locator('[data-island-id]')).toHaveCount(7);
  await expect(page.locator('[data-map-scene]')).toHaveAttribute('data-layout-scale', '1.000');
  const bounds = (await slider.boundingBox())!;
  await page.mouse.move(bounds.x + bounds.width - 8, bounds.y + bounds.height / 2);
  await page.mouse.down();
  await page.mouse.move(bounds.x + bounds.width * 0.3, bounds.y + bounds.height / 2, { steps: 12 });
  await page.mouse.up();
  await expect(timeline).toContainText('누적 사건 0건');
  await expect(page.locator('[data-island-id]')).toHaveCount(0);
  await expect(page.locator('[data-relation-id]')).toHaveCount(0);
  await expect(page.getByRole('status', { name: '사건 없는 지도' })).toBeVisible();
  await expect(slider).not.toHaveValue('20');
  await timeline.getByRole('button', { name: '기준일로' }).click();
  await expect(slider).toHaveValue('20');
  await expect(timeline).toContainText('2026-09-20까지 누적 사건 4건');
  await expect(page.locator('[data-island-id]')).toHaveCount(7);
  await expect(page.getByRole('status', { name: '사건 없는 지도' })).toHaveCount(0);
});

test('historical dates synchronize detail periods and statistics while preserving selection, depth and zoom', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Github Gist 영토 선택', exact: true }).click();
  await page.getByRole('button', { name: '확대', exact: true }).click();
  await expect(page.getByLabel('확대 배율')).toHaveText('125%');
  const raisedCount = await page
    .locator('[data-island-id="code"] [data-map-layer="sides"] polygon')
    .count();
  await page.getByRole('tab', { name: /^사건/ }).click();
  const slider = page.getByRole('slider', { name: '지도 기준 시점' });
  await slider.focus();
  await slider.press('Home');
  const detail = page.getByRole('complementary', { name: 'Github Gist 상세 패널' });
  await expect(detail).toBeVisible();
  await expect(detail.getByText('이 기간에 등록된 사건이 없습니다.')).toBeVisible();
  await expect(detail.getByRole('button', { name: /변경/ })).toContainText('2021-09-30');
  await expect(page.locator('[data-island-id]')).toHaveCount(0);
  await expect(page.locator('[data-relation-id]')).toHaveCount(0);
  await expect(page.getByLabel('확대 배율')).toHaveText('125%');
  await slider.press('End');
  await expect(
    page.locator('[data-island-id="code"] [data-map-layer="sides"] polygon'),
  ).toHaveCount(raisedCount);
  await expect(page.getByLabel('확대 배율')).toHaveText('125%');
  await slider.press('Home');
  await page.getByRole('button', { name: '통계', exact: true }).click();
  await expect(page.getByText('등록된 노출 유형이 없습니다.')).toBeVisible();
  await page.getByRole('button', { name: '기준일로' }).click();
  await expect(page.getByText('등록된 노출 유형이 없습니다.')).toHaveCount(0);
});

test('playback advances at the chosen speed, stops at baseline and pauses when manually seeking', async ({
  page,
}) => {
  await page.clock.install();
  await page.goto('/');
  const slider = page.getByRole('slider', { name: '지도 기준 시점' });
  await slider.focus();
  await slider.press('ArrowLeft');
  await page.getByRole('button', { name: '4배속', exact: true }).click();
  await page.getByRole('button', { name: '타임라인 재생', exact: true }).click();
  await page.clock.runFor(250);
  await expect(slider).toHaveValue('20');
  await expect(page.getByRole('button', { name: '타임라인 재생', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: '기준일로' })).toBeDisabled();
  await page.getByRole('button', { name: '타임라인 재생', exact: true }).click();
  await expect(slider).toHaveValue('0');
  await page.clock.runFor(500);
  await expect(slider).toHaveValue('2');
  await slider.focus();
  await slider.press('ArrowRight');
  await expect(slider).toHaveValue('3');
  await page.clock.runFor(1000);
  await expect(slider).toHaveValue('3');
  await page.getByRole('button', { name: '타임라인 재생', exact: true }).click();
  await expect(page.getByRole('button', { name: '타임라인 재생', exact: true })).toBeVisible();
});

test('timeline stays within narrow layouts with touch input and an open desktop detail panel', async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    baseURL,
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  await page.goto('/');
  const slider = page.getByRole('slider', { name: '지도 기준 시점' });
  const bounds = (await slider.boundingBox())!;
  await page.touchscreen.tap(bounds.x + bounds.width * 0.3, bounds.y + bounds.height / 2);
  await expect(page.getByRole('region', { name: '지도 타임라인' })).toContainText('누적 사건 0건');
  await expect(page.locator('[data-island-id]')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.setViewportSize({ width: 980, height: 720 });
  await page.getByRole('button', { name: '기준일로' }).click();
  await page.getByRole('button', { name: 'Github Gist 영토 선택', exact: true }).click();
  expect((await slider.boundingBox())!.width).toBeGreaterThan(200);
  const reset = (await page.getByRole('button', { name: '기준일로' }).boundingBox())!;
  const timeline = (await page.getByRole('region', { name: '지도 타임라인' }).boundingBox())!;
  expect(reset.x + reset.width).toBeLessThanOrEqual(timeline.x + timeline.width);
  await context.close();
});
