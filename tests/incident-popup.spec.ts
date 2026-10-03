import { expect, test, type Page } from '@playwright/test';

async function openEvents(page: Page, platform: string) {
  await page.goto('/');
  await page.getByRole('combobox').fill(platform);
  await page.getByRole('option', { name: new RegExp(platform) }).click();
  await page.getByRole('tab', { name: /^사건/ }).click();
}

test('clicking an incident opens every associated description to the left and Escape restores focus', async ({
  page,
}) => {
  await openEvents(page, 'Github Gist');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  const incident = page.getByRole('button', { name: /쿠팡 API 관련 코드 게시/ });
  await expect(incident.locator('[data-connection-path]')).toHaveCount(3);
  const pastebinPath = incident.locator('[data-connection-path="gist-pastebin"]');
  await expect(pastebinPath).toHaveAttribute('title', 'Github Gist → Pastebin');
  expect(await pastebinPath.locator('i').first().evaluate((node) => getComputedStyle(node).backgroundColor)).toBe(
    'rgb(68, 122, 255)',
  );
  expect(await pastebinPath.locator('i').last().evaluate((node) => getComputedStyle(node).backgroundColor)).toBe(
    'rgb(44, 191, 175)',
  );
  await incident.click();
  const popup = page.getByRole('dialog', { name: '쿠팡 API 관련 코드 게시', exact: true });
  await expect(popup).toBeVisible();
  await expect(popup.getByRole('heading', { level: 3 })).toHaveCount(0);
  const exposureTag = popup.getByText('API 키 노출', { exact: true });
  await expect(exposureTag).toBeVisible();
  await expect(exposureTag.locator('..')).toHaveClass(/meta/);
  await expect(popup.getByText('테스트용 사건 설명입니다.', { exact: false })).toContainText(
    '원문에 있는 줄바꿈을 그대로 표시합니다.',
  );
  await expect(
    popup.getByText('같은 사건에 별도로 등록된 두 번째 테스트 설명입니다.'),
  ).toBeVisible();
  expect(
    await popup
      .getByText(/테스트용 사건 설명입니다/)
      .evaluate((node) => getComputedStyle(node).whiteSpace),
  ).toBe('pre-wrap');
  const panel = (await page
    .getByRole('complementary', { name: 'Github Gist 상세 패널' })
    .boundingBox())!;
  const box = (await popup.boundingBox())!;
  expect(box.x + box.width).toBeLessThan(panel.x);
  await expect(incident).toHaveAttribute('aria-expanded', 'true');
  await expect(popup.getByRole('button', { name: '사건 설명 닫기' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(popup).toHaveCount(0);
  await expect(incident).toBeFocused();
  await incident.press('Enter');
  await expect(popup).toBeVisible();
  await popup.getByRole('button', { name: '사건 설명 닫기' }).click();
  await expect(incident).toBeFocused();
});

test('another incident replaces the popup and clicking outside or changing views dismisses it', async ({
  page,
}) => {
  await openEvents(page, 'Telegram');
  const accountSale = page.getByRole('button', { name: /한국 nexon 계정 판매/ });
  await expect(accountSale.getByText('계정 판매', { exact: true })).toBeVisible();
  await expect(accountSale.getByText('Telegram · 계정 판매', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: /JB오토리스할부 DB 유출/ }).click();
  await expect(page.getByRole('dialog')).toContainText(
    '첫 번째 Telegram 사건의 테스트 설명입니다.',
  );
  await page.getByRole('button', { name: /한국 nexon 계정 판매/ }).click();
  await expect(page.getByRole('dialog')).toHaveCount(1);
  await expect(page.getByRole('dialog')).toContainText(
    '두 번째 Telegram 사건의 테스트 설명입니다.',
  );
  await expect(page.getByRole('dialog')).not.toContainText(
    '첫 번째 Telegram 사건의 테스트 설명입니다.',
  );
  await page.getByRole('heading', { name: 'Telegram', exact: true }).first().click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: /한국 nexon 계정 판매/ }).click();
  await page.getByRole('tab', { name: '개요', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('tab', { name: /^사건/ }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('empty descriptions show an honest empty state; date filters and snapshots do not retain stale popups', async ({
  page,
}) => {
  await openEvents(page, 'Pastebin');
  const incident = page.getByRole('button', { name: /남양주요양원진료주소/ });
  await incident.click();
  await expect(page.getByRole('dialog').getByText('등록된 설명이 없습니다.')).toBeVisible();
  await page.getByRole('button', { name: '7일', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: '전체', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await incident.click();
  const slider = page.getByRole('slider', { name: '지도 기준 시점' });
  await slider.focus();
  await slider.press('Home');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: '기준일로' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('popup remains readable inside mobile and short viewports', async ({ page }) => {
  for (const viewport of [
    { width: 390, height: 650 },
    { width: 320, height: 480 },
  ]) {
    await page.setViewportSize(viewport);
    await openEvents(page, 'Github Gist');
    await page.getByRole('button', { name: /쿠팡 API 관련 코드 게시/ }).click();
    const popup = page.getByRole('dialog', { name: '쿠팡 API 관련 코드 게시', exact: true });
    const box = (await popup.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
    expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
    expect(await popup.evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true);
    await popup.getByRole('button', { name: '사건 설명 닫기' }).click();
    await expect(popup).toHaveCount(0);
  }
});
