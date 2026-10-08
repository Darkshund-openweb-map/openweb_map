import { expect, test } from '@playwright/test';

test('detail toggle shows the full open web summary without a selection', async ({ page }) => {
  await page.goto('/');
  const toggle = page.getByRole('button', { name: '상세 패널 열기' });
  await expect(toggle).toBeVisible();
  await toggle.click();

  const panel = page.getByRole('complementary', { name: '오픈웹 생태계 상세 패널' });
  await expect(panel).toBeVisible();
  await expect(panel.getByRole('heading', { name: '오픈웹 생태계' })).toBeVisible();
  await expect(panel.getByText('오픈웹 생태계 · 전체')).toHaveCount(0);
  await expect(panel.getByText('전체 노출 유형')).toBeVisible();
  await panel.getByRole('tab', { name: /^사건/ }).click();
  await expect(panel.getByText('오픈웹 생태계 사건 · 최신순')).toBeVisible();
  await panel.getByRole('tab', { name: /^연결/ }).click();
  await expect(panel.getByText('관계 요약 · 검토 상태별')).toBeVisible();

  await page.getByRole('button', { name: '통계', exact: true }).click();
  await page.getByRole('button', { name: '상세 패널 열기' }).click();
  await expect(panel.getByRole('heading', { name: '오픈웹 생태계' })).toBeVisible();
});

for (const { label, url } of [
  { label: '연결', url: 'https://d4rkn3ttz-collaboration.github.io/Connection-Map/' },
  { label: '다크웹', url: 'https://darkchoco-map.darkchoco.workers.dev/' },
]) {
  test(`${label} navigation replaces the current tab`, async ({ page, context }) => {
    await page.route(url, (route) =>
      route.fulfill({ status: 200, contentType: 'text/html', body: '<h1>Destination</h1>' }),
    );
    await page.goto('/');
    const originalTabCount = context.pages().length;
    await page.getByRole('button', { name: label, exact: true }).click();
    await expect(page).toHaveURL(url);
    await expect(page.getByRole('heading', { name: 'Destination' })).toBeVisible();
    expect(context.pages()).toHaveLength(originalTabCount);
  });
}
