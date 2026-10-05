import { expect, test } from '@playwright/test';

test('larger map labels and detail counts stay inside their backgrounds', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto('/');
  const labels = await page
    .locator('g[class*="island-badge"], g[class*="platform-label"]')
    .evaluateAll((groups) =>
      groups.map((group) => {
        const text = group.querySelector('text')!.getBBox();
        const box = group.querySelector('rect')!.getBBox();
        return {
          font: parseFloat(getComputedStyle(group.querySelector('text')!).fontSize),
          fits:
            text.x >= box.x - 1 &&
            text.y >= box.y - 1 &&
            text.x + text.width <= box.x + box.width + 1 &&
            text.y + text.height <= box.y + box.height + 1,
        };
      }),
    );
  expect(labels.length).toBeGreaterThan(0);
  expect(labels.every((label) => label.font >= 14.5 && label.fits)).toBe(true);

  const territoryOffsets = await page.locator('g[data-platform-id]').evaluateAll((groups) =>
    groups.map((group) => {
      const island = group.closest('[data-island-id]')!;
      const owner = group.getAttribute('data-platform-id');
      const tiles = [...island.querySelectorAll('[data-map-layer="tops"] polygon')].filter(
        (tile) => tile.getAttribute('data-owner-id') === owner,
      ) as SVGPolygonElement[];
      const coordinate = (element: SVGGraphicsElement) => {
        const matrix = element.transform.baseVal.consolidate()!.matrix;
        return { x: matrix.e, y: matrix.f };
      };
      const center = tiles.reduce(
        (sum, tile) => {
          const position = coordinate(tile);
          return { x: sum.x + position.x, y: sum.y + position.y };
        },
        { x: 0, y: 0 },
      );
      const label = coordinate(group as SVGGraphicsElement);
      return {
        count: tiles.length,
        distance: Math.hypot(label.x - center.x / tiles.length, label.y - center.y / tiles.length),
      };
    }),
  );
  expect(territoryOffsets.every((offset) => offset.count > 0 && offset.distance < 0.01)).toBe(true);

  const labelOverlaps = await page.locator('[data-island-id]').evaluateAll((islands) =>
    islands.flatMap((island) => {
      const boxes = [...island.querySelectorAll('g[data-platform-id] rect')].map((rect) =>
        rect.getBoundingClientRect(),
      );
      return boxes.flatMap((box, index) =>
        boxes
          .slice(index + 1)
          .map(
            (other) =>
              box.left < other.right - 1 &&
              box.right > other.left + 1 &&
              box.top < other.bottom - 1 &&
              box.bottom > other.top + 1,
          ),
      );
    }),
  );
  expect(labelOverlaps).not.toContain(true);

  await page.locator('g[data-platform-id]').first().click();
  const badges = page.locator('[role="tab"] span');
  await badges.first().evaluate((badge) => {
    badge.textContent = '47';
  });
  await badges.last().evaluate((badge) => {
    badge.textContent = '2';
  });
  const counts = await badges.evaluateAll((nodes) =>
    nodes.map((badge) => ({
      width: badge.clientWidth,
      scrollWidth: badge.scrollWidth,
      height: badge.clientHeight,
      scrollHeight: badge.scrollHeight,
    })),
  );
  expect(
    counts.every((count) => count.scrollWidth <= count.width && count.scrollHeight <= count.height),
  ).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

test('map controls keep their labels on one line beside an open detail panel', async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 900 });
  await page.goto('/');
  await page.locator('g[data-platform-id]').first().click();
  const actions = await page.locator('[class*="map-actions"] > button').evaluateAll((buttons) =>
    buttons.map((button) => ({
      height: button.clientHeight,
      scrollHeight: button.scrollHeight,
      whiteSpace: getComputedStyle(button).whiteSpace,
    })),
  );
  expect(
    actions.every(
      (button) => button.scrollHeight <= button.height && button.whiteSpace === 'nowrap',
    ),
  ).toBe(true);
});

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
  expect(summary!.x).toBeGreaterThan(title!.x + title!.width);
  expect(Math.abs(summary!.y - title!.y)).toBeLessThan(title!.height);
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
