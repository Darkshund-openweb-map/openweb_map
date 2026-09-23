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
  // Click an actual top face, not a badge or a forced event.
  await island.locator('[data-map-layer="tops"] polygon').first().click();
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
  await page.getByRole('button', { name: '다크웹', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: '등록된 다크웹 플랫폼이 없습니다' }),
  ).toBeVisible();
});
