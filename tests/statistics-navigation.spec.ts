import { expect, test } from '@playwright/test';
import { categories } from '../src/lib/fixture';

test('전체 precedes category filters and restores the complete statistics', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '통계', exact: true }).click();
  const filters = page.getByRole('group', { name: '통계 플랫폼 유형' });
  const all = filters.getByRole('button', { name: '전체', exact: true });
  const code = filters.getByRole('button', { name: '코드 호스팅', exact: true });
  await expect(filters.getByRole('button')).toHaveText([
    '전체',
    ...categories.map((category) => category.name),
  ]);
  await expect(filters.getByRole('button').first()).toHaveText('전체');
  await expect(filters.getByRole('button').nth(1)).toHaveText('코드 호스팅');
  await expect(all).toHaveAttribute('aria-pressed', 'true');

  const metrics = page.locator('[class*="stats-metrics"] strong');
  const rows = page.locator('button[class*="stats-table-row"]');
  const recent = page.locator('[class*="recent-activity"] button');
  const initialMetrics = await metrics.allTextContents();
  const initialRows = await rows.allTextContents();
  const initialRecent = await recent.allTextContents();
  await expect(metrics.first()).toHaveText('4');

  for (const name of ['코드 호스팅', '오픈마켓', '커뮤니티']) {
    const category = filters.getByRole('button', { name, exact: true });
    await category.click();
    await expect(category).toHaveAttribute('aria-pressed', 'true');
    await expect(all).toHaveAttribute('aria-pressed', 'false');
    await all.click();
    await expect(all).toHaveAttribute('aria-pressed', 'true');
    await expect(metrics).toHaveText(initialMetrics);
    await expect(rows).toHaveText(initialRows);
    await expect(recent).toHaveText(initialRecent);
    await expect(filters.locator('[aria-pressed="true"]')).toHaveCount(1);
  }

  await code.click();
  await code.click();
  await expect(code).toHaveAttribute('aria-pressed', 'true');
  await expect(metrics.first()).toHaveText('1');
  await all.focus();
  await all.press('Enter');
  await expect(metrics).toHaveText(initialMetrics);
  await expect(all).toHaveAttribute('aria-pressed', 'true');
});

test('전체 restores the current time period without resetting the timeline', async ({ page }) => {
  await page.goto('/');
  const slider = page.getByRole('slider', { name: '지도 기준 시점' });
  await slider.focus();
  await slider.press('Home');
  const cutoff = await slider.inputValue();
  await page.getByRole('button', { name: '통계', exact: true }).click();
  const filters = page.getByRole('group', { name: '통계 플랫폼 유형' });
  await filters.getByRole('button', { name: '코드 호스팅', exact: true }).click();
  await filters.getByRole('button', { name: '전체', exact: true }).click();
  await expect(slider).toHaveValue(cutoff);
  await expect(page.locator('[class*="stats-metrics"] strong').first()).toHaveText('0');
  await expect(page.getByText('등록된 노출 유형이 없습니다.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '기준일로' }).click();
  await expect(page.locator('[class*="stats-metrics"] strong').first()).toHaveText('4');
  await expect(filters.getByRole('button', { name: '전체', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});

for (const width of [1440, 900, 390]) {
  test(`전체 filter is visible and usable without horizontal overflow at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await page.getByRole('button', { name: '통계', exact: true }).click();
    const filters = page.getByRole('group', { name: '통계 플랫폼 유형' });
    const all = filters.getByRole('button', { name: '전체', exact: true });
    await expect(all).toBeInViewport();
    await filters.getByRole('button', { name: '오픈마켓', exact: true }).click();
    await expect(page.getByText('등록된 사건이 없습니다.', { exact: true })).toBeVisible();
    await all.click();
    await expect(page.locator('[class*="stats-metrics"] strong').first()).toHaveText('4');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    );
  });
}

test('sidebar preserves the legend, reading guide and relationship types across views', async ({
  page,
}) => {
  await page.goto('/');
  const sidebar = page.getByRole('complementary', { name: '플랫폼 탐색' });
  const navigation = sidebar.getByRole('navigation', { name: '플랫폼 유형' });
  await expect(sidebar.getByRole('heading', { name: '지도 안내', exact: true })).toBeVisible();
  await expect(navigation.getByRole('button')).toHaveCount(categories.length);
  await expect(navigation.getByRole('button')).toHaveText(
    categories.map((category) => category.name),
  );
  const reading = sidebar.getByRole('region', { name: '지도 구성' });
  await expect(reading.getByRole('heading', { name: '지도 구성' })).toBeVisible();
  await expect(reading).toContainText('개별 플랫폼');
  await expect(reading).toContainText('사건 집계 시점');
  const relationTypes = sidebar.getByRole('region', { name: '관계 유형' });
  await expect(relationTypes.getByRole('listitem')).toHaveText([
    '재게시',
    '미러링',
    '직접 링크',
    '동일 파일',
    '동일 콘텐츠',
  ]);
  const connections = sidebar.getByRole('region', { name: '연결 상태', exact: true });
  await expect(connections.getByText('검증 완료', { exact: true })).toBeVisible();
  await expect(connections.getByText('검증 전', { exact: true })).toBeVisible();

  const code = navigation.getByRole('button', { name: '코드 호스팅', exact: true });
  await code.click();
  await expect(code).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('complementary', { name: '코드 호스팅 상세 패널' })).toBeVisible();
  await page.getByRole('button', { name: '통계', exact: true }).click();
  await expect(connections).toBeVisible();
  await expect(reading).toContainText('실제 연결은 검증 완료 관계만 포함합니다.');
  await expect(relationTypes).toBeVisible();
  await expect(navigation.locator('[aria-pressed="true"]')).toHaveCount(0);
  await code.click();
  await expect(page.getByRole('complementary', { name: '코드 호스팅 상세 패널' })).toBeVisible();
  await expect(connections).toBeVisible();
  await expect(reading).toContainText('플랫폼을 누르면 관련 사건과 연결 관계를 볼 수 있습니다.');
});
