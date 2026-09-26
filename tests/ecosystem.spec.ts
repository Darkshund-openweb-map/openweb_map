import { test, expect, type Page } from '@playwright/test';

async function openMap(page: Page) {
  await page.goto('/');
  await page.waitForFunction(() => {
    const svg = document.querySelector('svg[aria-label^="오픈웹 생태계"]');
    return svg && '__zoom' in svg;
  });
}

test('hex faces remain clickable and stationary on hover; zoom, pan and reset work', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await openMap(page);
  const island = page.getByRole('button', { name: '코드 저장소 섬 선택', exact: true });
  await expect(island.locator('[data-map-layer="sides"] polygon')).toHaveCount(0);
  // Click an actual top face, not a badge or a forced event.
  await island.locator('[data-map-layer="tops"] polygon').first().click();
  await expect(page.getByRole('complementary', { name: '코드 저장소 상세 패널' })).toBeVisible();
  await page.getByRole('button', { name: '상세 패널 접기' }).click();
  const detailButton = page.getByRole('button', { name: '상세 보기', exact: false });
  await expect(detailButton).toBeVisible();
  const detailButtonBox = (await detailButton.boundingBox())!;
  expect(detailButtonBox.width).toBeGreaterThan(detailButtonBox.height);
  await detailButton.click();
  await expect(page.getByRole('complementary', { name: '코드 저장소 상세 패널' })).toBeVisible();
  const top = island.locator('[data-map-layer="tops"] polygon').first();
  const before = await top.boundingBox();
  const scene = page.locator('[data-map-scene]');
  const beforeMarkup = await scene.innerHTML();
  for (let index = 0; index < 5; index++) {
    await top.hover();
    await page.mouse.move(10, 10);
  }
  expect(await top.boundingBox()).toEqual(before);
  expect(await scene.innerHTML()).toBe(beforeMarkup);
  await expect(island.locator('[data-map-layer="sides"] polygon').first()).toBeVisible();
  await page.getByRole('button', { name: '확대', exact: true }).click();
  await expect(page.getByLabel('확대 배율')).toHaveText('125%');
  const svg = page.locator('svg[aria-label^="오픈웹 생태계"]');
  const box = (await svg.boundingBox())!;
  const transform = await scene.getAttribute('transform');
  await page.mouse.move(box.x + 30, box.y + 30);
  await page.mouse.down();
  await page.mouse.move(box.x + 80, box.y + 65, { steps: 8 });
  await page.mouse.up();
  expect(await scene.getAttribute('transform')).not.toBe(transform);
  await page.getByRole('button', { name: '전체 보기' }).click();
  await expect(page.getByLabel('확대 배율')).toHaveText('100%');
  await expect(page.getByRole('heading', { name: '전체 오픈웹', exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test('selecting Pastebin does not raise the related code repository island', async ({ page }) => {
  await openMap(page);
  await page.getByRole('combobox').fill('Pastebin');
  await page.getByRole('option', { name: /Pastebin/ }).click();

  const codeIsland = page.getByRole('button', { name: '코드 저장소 섬 선택', exact: true });
  const textIsland = page.getByRole('button', { name: '텍스트 호스팅 섬 선택', exact: true });
  expect(await codeIsland.evaluate((node) => node.parentElement?.getAttribute('opacity'))).toBe(
    '0.35',
  );
  await expect(codeIsland.locator('[data-map-layer="sides"] polygon')).toHaveCount(0);
  expect(await textIsland.locator('[data-map-layer="sides"] polygon').count()).toBeGreaterThan(0);
  await expect(page.getByRole('complementary', { name: 'Pastebin 상세 패널' })).toBeVisible();
});

test('platform territory is contiguous and only relevant events appear; date filters apply', async ({
  page,
}) => {
  await openMap(page);
  await page.getByRole('button', { name: 'GitHub Gist 영토 선택', exact: true }).click();
  const island = page.getByRole('button', { name: '코드 저장소 섬 선택', exact: true });
  const centers = await island
    .locator('[data-map-layer="tops"] polygon[fill="#447aff"]')
    .evaluateAll((nodes) =>
      nodes.map((node) => {
        const numbers = node
          .getAttribute('transform')!
          .match(/-?\d+(?:\.\d+)?/g)!
          .map(Number);
        return { x: numbers[0], y: numbers[1] };
      }),
    );
  expect(centers.length).toBeGreaterThan(1);
  const visited = new Set([0]);
  const pending = [0];
  while (pending.length) {
    const current = centers[pending.pop()!];
    centers.forEach((point, index) => {
      if (!visited.has(index) && Math.hypot(point.x - current.x, point.y - current.y) < 22) {
        visited.add(index);
        pending.push(index);
      }
    });
  }
  expect(visited.size).toBe(centers.length);
  await page.getByRole('tab', { name: /^사건/ }).click();
  const detail = page.getByRole('complementary', { name: 'GitHub Gist 상세 패널' });
  await expect(detail.getByText('쿠팡 API 관련 코드 게시')).toBeVisible();
  await detail.getByRole('button', { name: '7일', exact: true }).click();
  await expect(detail.getByText('이 기간에 등록된 사건이 없습니다.')).toBeVisible();
  await detail.getByRole('button', { name: '전체', exact: true }).click();
  await detail.getByRole('button', { name: /변경/ }).click();
  await detail.getByLabel('시작일').fill('2026-08-31');
  await detail.getByLabel('종료일').fill('2026-08-30');
  await expect(detail.getByRole('button', { name: '적용', exact: true })).toBeDisabled();
  await detail.getByLabel('종료일').fill('2026-08-31');
  await detail.getByRole('button', { name: '적용', exact: true }).click();
  await expect(detail.getByText('쿠팡 API 관련 코드 게시')).toBeVisible();
  await page.getByRole('combobox').fill('Telegram');
  await page.getByRole('option', { name: /Telegram/ }).click();
  await page.getByRole('tab', { name: /^사건/ }).click();
  const telegram = page.getByRole('complementary', { name: 'Telegram 상세 패널' });
  await expect(telegram.getByText('JB오토리스할부 DB 유출')).toBeVisible();
  await expect(telegram.getByText('쿠팡 API 관련 코드 게시')).toHaveCount(0);
});

test('candidate relations remain unverified when selected, and search handles no results', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await openMap(page);
  await page.getByRole('switch', { name: '전체 관계 보기' }).click();
  const relation = page.locator('[data-relation-id="gist-mega"]');
  await relation.focus();
  await page.keyboard.press('Enter');
  const detail = page.getByRole('complementary', { name: 'GitHub Gist 상세 패널' });
  await expect(detail.getByRole('heading', { name: '동일 파일 1건' })).toBeVisible();
  await expect(detail.getByText('선택한 관계 · 신뢰도 중간 · 검증 대기')).toBeVisible();
  await expect(page.getByRole('tab', { name: '연결 0', exact: true })).toBeVisible();
  await page.keyboard.press('Control+k');
  const input = page.getByRole('combobox');
  await expect(input).toBeFocused();
  await input.fill('nonexistent-platform');
  await expect(page.getByText('검색 결과가 없습니다.')).toBeVisible();
  await input.press('Escape');
  await expect(page.getByRole('listbox')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('community shows Xianyu and Taobao without inventing incidents', async ({ page }) => {
  await openMap(page);
  const xianyu = page.getByRole('button', { name: '시엔위 영토 선택', exact: true });
  const taobao = page.getByRole('button', { name: '타오바오 영토 선택', exact: true });
  await expect(xianyu).toBeVisible();
  await expect(taobao).toBeVisible();
  const xianyuBox = (await xianyu.boundingBox())!;
  const taobaoBox = (await taobao.boundingBox())!;
  expect(xianyuBox.x + xianyuBox.width).toBeLessThan(taobaoBox.x);

  await xianyu.click();
  const details = page.getByRole('complementary', { name: '시엔위 상세 패널' });
  await expect(details).toBeVisible();
  await expect(details.getByText('goofish.com')).toBeVisible();
  await details.getByRole('tab', { name: '사건 0', exact: true }).click();
  await expect(details.getByText('이 기간에 등록된 사건이 없습니다.')).toBeVisible();

  await page.getByRole('combobox').fill('Taobao');
  await page.getByRole('option', { name: /타오바오/ }).click();
  const taobaoDetails = page.getByRole('complementary', { name: '타오바오 상세 패널' });
  await expect(taobaoDetails).toBeVisible();
  await expect(taobaoDetails.getByText('taobao.com')).toBeVisible();
  await expect(taobaoDetails.getByRole('tab', { name: '사건 0', exact: true })).toBeVisible();
});

test('statistics selection opens its own platform and mobile has no horizontal overflow', async ({
  page,
}) => {
  await openMap(page);
  await page.getByRole('button', { name: '통계', exact: true }).click();
  await expect(page.getByRole('heading', { name: '오픈웹 노출 분포 분석' })).toBeVisible();
  await page.getByRole('button', { name: /JB오토리스할부 DB 유출/ }).click();
  await expect(page.getByRole('complementary', { name: 'Telegram 상세 패널' })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await openMap(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.getByRole('combobox').fill('Pastebin');
  await page.getByRole('option', { name: /Pastebin/ }).click();
  await expect(page.getByRole('complementary', { name: 'Pastebin 상세 패널' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.getByRole('button', { name: '상세 패널 접기' }).click();
  await page.getByRole('button', { name: /상세 보기/ }).click();
  await expect(page.getByRole('complementary', { name: 'Pastebin 상세 패널' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.getByRole('button', { name: '다크웹', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: '등록된 다크웹 플랫폼이 없습니다' }),
  ).toBeVisible();
});

test('full viewport starts flat and labels use outlines instead of visible boxes', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await openMap(page);
  expect(await page.locator('[data-web-scope-shell]').boundingBox()).toEqual({
    x: 0,
    y: 0,
    width: 1920,
    height: 1080,
  });
  await expect(page.locator('[data-map-layer="sides"] polygon')).toHaveCount(0);
  const label = page.getByRole('button', { name: 'AWS S3 영토 선택', exact: true });
  await expect(label.locator('rect')).toHaveAttribute('fill', 'transparent');
  expect(await label.locator('text').evaluate((node) => getComputedStyle(node).paintOrder)).toBe(
    'stroke',
  );
  await page.getByRole('button', { name: /클라우드 스토리지 \d+건/, exact: true }).click();
  await expect(
    page.getByRole('complementary', { name: '클라우드 스토리지 상세 패널' }),
  ).toBeVisible();
});

test('AWS S3 stays blue with gray surroundings and keeps depth through repeated clicks', async ({
  page,
}) => {
  await openMap(page);
  await page.getByRole('button', { name: 'AWS S3 영토 선택', exact: true }).click();
  const island = page.getByRole('button', { name: '클라우드 스토리지 섬 선택', exact: true });
  const raised = island.locator('[data-elevation="7"]');
  const sides = island.locator('[data-map-layer="sides"] polygon');
  const initialCount = await raised.count();
  expect(initialCount).toBeGreaterThan(0);
  const surroundings = island.locator('[data-elevation="0"]');
  expect(await surroundings.count()).toBeGreaterThan(0);
  expect(
    await surroundings.evaluateAll((nodes) =>
      nodes.every((node) => node.getAttribute('fill') === '#d0d9e4'),
    ),
  ).toBe(true);
  expect(await sides.count()).toBeLessThan(initialCount * 2);
  expect(
    await raised.evaluateAll((nodes) =>
      nodes.every((node) => node.getAttribute('fill') === '#4cc4f9'),
    ),
  ).toBe(true);
  const detail = page.getByRole('complementary', { name: 'AWS S3 상세 패널' });
  await page.getByRole('tab', { name: /^사건/ }).click();
  // The label's transparent hit target covers some central faces; both targets preserve selection.
  await page.getByRole('button', { name: 'AWS S3 영토 선택', exact: true }).click();
  await raised.first().click();
  await expect(detail).toBeVisible();
  await expect(page.getByRole('tab', { name: /^사건/ })).toHaveAttribute('aria-selected', 'true');
  await expect(raised).toHaveCount(initialCount);
  await sides.first().click();
  await expect(detail).toBeVisible();
  await expect(raised).toHaveCount(initialCount);
  expect(
    await surroundings.evaluateAll((nodes) =>
      nodes.every((node) => node.getAttribute('fill') === '#d0d9e4'),
    ),
  ).toBe(true);
  await page.getByRole('button', { name: '전체 보기' }).click();
  await expect(page.locator('[data-map-layer="sides"] polygon')).toHaveCount(0);
  expect(
    await island
      .locator('[data-elevation="0"]')
      .evaluateAll((nodes) => nodes.every((node) => node.getAttribute('fill') === '#4cc4f9')),
  ).toBe(true);
});

test('platform actions validate, add, edit, move and delete local data', async ({ page }) => {
  await openMap(page);
  await page.getByRole('button', { name: 'AWS S3 영토 선택', exact: true }).click();
  await page.getByRole('button', { name: '데이터 추가', exact: true }).click();
  let dialog = page.getByRole('dialog', { name: '플랫폼 추가', exact: true });
  await dialog.getByLabel('플랫폼 이름').fill('AWS S3');
  await dialog.getByLabel('도메인', { exact: true }).fill('example.com');
  await dialog.getByRole('button', { name: '추가', exact: true }).click();
  await expect(dialog.getByRole('alert')).toHaveText('같은 이름의 플랫폼이 이미 있습니다.');
  await dialog.getByLabel('플랫폼 이름').fill('새 플랫폼');
  await dialog.getByLabel('도메인', { exact: true }).fill('not-a-domain');
  await dialog.getByRole('button', { name: '추가', exact: true }).click();
  await expect(dialog.getByRole('alert')).toHaveText(
    '도메인은 example.com 형식으로 입력해 주세요.',
  );
  await dialog.getByLabel('도메인', { exact: true }).fill('https://example.com');
  await dialog.getByLabel('설명', { exact: true }).fill('로컬 관리 테스트');
  await dialog.getByRole('button', { name: '추가', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('complementary', { name: '새 플랫폼 상세 패널' })).toBeVisible();
  await expect(
    page.getByRole('button', { name: '새 플랫폼 영토 선택', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: '데이터 수정', exact: true }).click();
  dialog = page.getByRole('dialog', { name: '플랫폼 수정', exact: true });
  await dialog.getByLabel('플랫폼 이름').fill('수정 플랫폼');
  await dialog.getByLabel('도메인', { exact: true }).fill('updated.example.com');
  await dialog.getByLabel('플랫폼 유형').selectOption('community');
  await dialog.getByRole('button', { name: '저장', exact: true }).click();
  const detail = page.getByRole('complementary', { name: '수정 플랫폼 상세 패널' });
  await expect(detail).toBeVisible();
  await expect(detail.getByText('updated.example.com')).toBeVisible();
  await expect(
    page
      .locator('[data-island-id="community"]')
      .getByRole('button', { name: '수정 플랫폼 영토 선택', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: '데이터 삭제', exact: true }).click();
  dialog = page.getByRole('dialog', { name: '플랫폼 삭제', exact: true });
  await dialog.getByRole('button', { name: '취소', exact: true }).click();
  await expect(detail).toBeVisible();
  await page.getByRole('button', { name: '데이터 삭제', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: '삭제 확인', exact: true }).click();
  await expect(page.getByRole('heading', { name: '전체 오픈웹', exact: true })).toBeVisible();
  await expect(
    page.getByRole('button', { name: '수정 플랫폼 영토 선택', exact: true }),
  ).toHaveCount(0);
  await page.getByRole('combobox').fill('수정 플랫폼');
  await expect(page.getByText('검색 결과가 없습니다.')).toBeVisible();
});

test('deleting a platform clears its events and relations; reload restores fixtures', async ({
  page,
}) => {
  await openMap(page);
  await page.getByRole('button', { name: 'GitHub Gist 영토 선택', exact: true }).click();
  await page.getByRole('button', { name: '데이터 삭제', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: '플랫폼 삭제', exact: true });
  await expect(dialog.getByText(/연결된 사건 [1-9]\d*개와 관계/)).toBeVisible();
  await dialog.getByRole('button', { name: '삭제 확인', exact: true }).click();
  await page.getByRole('switch', { name: '전체 관계 보기' }).click();
  await expect(page.locator('[data-relation-id="gist-mega"]')).toHaveCount(0);
  await page.getByRole('button', { name: '통계', exact: true }).click();
  await expect(page.getByText('쿠팡 API 관련 코드 게시')).toHaveCount(0);
  await openMap(page);
  await expect(
    page.getByRole('button', { name: 'GitHub Gist 영토 선택', exact: true }),
  ).toBeVisible();
});

test('platform editor fits mobile and short viewports', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 650 });
  await openMap(page);
  await page.getByRole('combobox').fill('AWS S3');
  await page.getByRole('option', { name: /AWS S3/ }).click();
  await page.getByRole('button', { name: '데이터 수정', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: '플랫폼 수정', exact: true });
  const bounds = (await dialog.boundingBox())!;
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.y).toBeGreaterThanOrEqual(0);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(390);
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(650);
  await dialog.getByRole('button', { name: '취소', exact: true }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});
