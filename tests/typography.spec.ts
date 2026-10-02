import { expect, test } from '@playwright/test';

test('detail copy and header summary have readable spacing', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Pastebin 영토 선택', exact: true }).click();
  const panel = page.getByRole('complementary', { name: 'Pastebin 상세 패널' });
  expect((await panel.boundingBox())!.width).toBeGreaterThanOrEqual(300);
  const typography = await panel
    .locator('[class*="body-copy"]')
    .first()
    .evaluate((node) => {
      const style = getComputedStyle(node);
      return { font: parseFloat(style.fontSize), line: parseFloat(style.lineHeight) };
    });
  expect(typography.font).toBeGreaterThanOrEqual(12);
  expect(typography.line / typography.font).toBeGreaterThanOrEqual(1.6);
  const title = await page.getByRole('heading', { name: 'Pastebin', level: 1 }).boundingBox();
  const summary = await page.locator('[class*="content-summary"]').boundingBox();
  expect(summary!.y - title!.y - title!.height).toBeGreaterThanOrEqual(4);
  const heading = await panel
    .locator('[class*="block-heading"]')
    .first()
    .evaluate((node) => parseFloat(getComputedStyle(node).marginBottom));
  expect(heading).toBeGreaterThanOrEqual(10);
});

for (const width of [1440, 900, 390]) {
  test(`statistics allow long Korean copy without collisions at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await page.getByRole('button', { name: '통계', exact: true }).click();
    const row = page.locator('button[class*="stats-table-row"]').first();
    const label = row.locator('strong');
    await label.evaluate((node) => {
      node.textContent = '개인정보와 인증정보가 포함된 긴 노출 유형 이름의 자연스러운 줄바꿈 확인';
    });
    const copy = await label.evaluate((node) => {
      const style = getComputedStyle(node);
      return {
        font: parseFloat(style.fontSize),
        line: parseFloat(style.lineHeight),
        overflow: node.scrollWidth > node.clientWidth + 1,
        nowrap: style.whiteSpace === 'nowrap',
      };
    });
    expect(copy.font).toBeGreaterThanOrEqual(12);
    expect(copy.line / copy.font).toBeGreaterThanOrEqual(1.6);
    expect(copy.overflow).toBe(false);
    expect(copy.nowrap).toBe(false);
    expect((await row.boundingBox())!.height).toBeGreaterThanOrEqual(54);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    );
    const chips = await page
      .locator('[class*="category-chips"]')
      .evaluate((node) => parseFloat(getComputedStyle(node).gap));
    expect(chips).toBeGreaterThanOrEqual(8);
  });
}
