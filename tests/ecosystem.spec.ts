import { test, expect, type Page } from '@playwright/test';

async function openMap(page: Page) {
  await page.goto('/');
  await page.waitForFunction(() => {
    const svg = document.querySelector('svg[aria-label^="오픈웹 생태계"]');
    return svg && '__zoom' in svg;
  });
}

test('map shows the seven Korean island categories without Other', async ({ page }) => {
  await openMap(page);
  await expect(page.locator('[data-island-id]')).toHaveCount(7);
  for (const name of [
    '코드 호스팅',
    '오픈마켓',
    '텍스트 호스팅',
    '백엔드 서비스',
    '공식 웹사이트',
    '파일 호스팅',
    '커뮤니티',
  ]) {
    await expect(page.getByRole('button', { name: `${name} 섬 선택`, exact: true })).toBeVisible();
  }
  await expect(page.getByRole('button', { name: '기타 섬 선택', exact: true })).toHaveCount(0);
});

test('each island has 38 base cells and each platform owns four plus one per two incidents without overlap', async ({ page }) => {
  await openMap(page);
  const expected = {
    code: 50,
    marketplace: 46,
    text: 46,
    backend: 38,
    official: 38,
    files: 46,
    community: 51,
  };
  for (const [id, count] of Object.entries(expected)) {
    await expect(page.locator(`[data-island-id="${id}"] [data-map-layer="tops"] polygon`)).toHaveCount(count);
  }

  const community = page.locator('[data-island-id="community"]');
  const selectedCells = async () =>
    new Set(
      await community
        .locator('[data-map-layer="tops"] polygon[data-elevation="7"]')
        .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-cell-key')!)),
    );
  await page.getByRole('button', { name: 'Telegram 영토 선택', exact: true }).click();
  const telegram = await selectedCells();
  expect(telegram.size).toBe(18);
  await page.getByRole('button', { name: '트위터 영토 선택', exact: true }).click();
  const twitter = await selectedCells();
  expect(twitter.size).toBe(16);
  expect([...telegram].filter((key) => twitter.has(key))).toHaveLength(0);
});

test('hovering one territory cell brightens every cell owned by that platform', async ({ page }) => {
  await openMap(page);
  const island = page.locator('[data-island-id="community"]');
  const telegram = island.locator('[data-map-layer="tops"] polygon[data-owner-id="telegram"]');
  const twitter = island.locator('[data-map-layer="tops"] polygon[data-owner-id="twitter"]');
  const original = await telegram.first().getAttribute('fill');
  const otherOriginal = await twitter.first().getAttribute('fill');

  await telegram.last().dispatchEvent('pointerover');
  const highlighted = await telegram.evaluateAll((nodes) =>
    nodes.map((node) => node.getAttribute('fill')),
  );
  expect(new Set(highlighted).size).toBe(1);
  expect(highlighted[0]).not.toBe(original);
  await expect(twitter.first()).toHaveAttribute('fill', otherOriginal!);

  await telegram.last().dispatchEvent('pointerout');
  await expect(telegram.first()).toHaveAttribute('fill', original!);

  const label = page.getByRole('button', { name: 'Telegram 영토 선택', exact: true });
  await label.dispatchEvent('pointerover');
  await expect(telegram.first()).not.toHaveAttribute('fill', original!);
  const hoverCard = page.getByRole('tooltip');
  await expect(hoverCard).toContainText('개별 플랫폼 · TELEGRAM');
  await expect(hoverCard).toContainText('전체 사건');
  await expect(hoverCard).toContainText('최근 관측일');
  await expect(hoverCard).toContainText('메시지 기반 커뮤니티입니다.');
  expect(
    await page.locator('[data-island-id="official"]').evaluate((island, tooltip) => {
      return Boolean(island.compareDocumentPosition(tooltip as Node) & Node.DOCUMENT_POSITION_FOLLOWING);
    }, await hoverCard.elementHandle()),
  ).toBe(true);
  await label.dispatchEvent('pointerout');
  await expect(telegram.first()).toHaveAttribute('fill', original!);
  await expect(hoverCard).toHaveCount(0);

  const islandLabel = page.getByRole('button', { name: /커뮤니티 \d+건/, exact: true });
  const titleFill = await islandLabel.locator('rect').evaluate((node) => getComputedStyle(node).fill);
  await islandLabel.dispatchEvent('pointerover');
  await expect(telegram.first()).not.toHaveAttribute('fill', original!);
  await expect(twitter.first()).not.toHaveAttribute('fill', otherOriginal!);
  expect(await islandLabel.locator('rect').evaluate((node) => getComputedStyle(node).fill)).not.toBe(
    titleFill,
  );
  await expect(islandLabel.locator('text')).toHaveAttribute('fill', '#ffffff');
  await expect(islandLabel.locator('text')).toHaveAttribute('font-weight', '800');
  await islandLabel.dispatchEvent('pointerout');
  await expect(telegram.first()).toHaveAttribute('fill', original!);
  await expect(islandLabel.locator('text')).toHaveAttribute('fill', '#fa812d');
  await expect(islandLabel.locator('text')).toHaveAttribute('font-weight', '700');

  await telegram.last().dispatchEvent('click');
  await expect(page.getByRole('complementary', { name: 'Telegram 상세 패널' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Github Gist 영토 선택', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: '네이버 영토 선택', exact: true })).toBeVisible();
});

test('overview limits exposure types to the selected platform and empty statistics stay empty', async ({
  page,
}) => {
  await openMap(page);
  await page.getByRole('button', { name: 'Pastebin 영토 선택', exact: true }).click();
  const details = page.getByRole('complementary', { name: 'Pastebin 상세 패널' });
  const bars = details.locator('[class*="bars-block"]');
  await expect(bars.locator('[class*="bar-row"]')).toHaveCount(1);
  await expect(bars.getByText('이메일 노출', { exact: true })).toBeVisible();
  await expect(bars.getByText('계정 판매', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: '통계', exact: true }).click();
  await page
    .locator('[class*="category-chips"]')
    .getByRole('button', { name: /오픈마켓/ })
    .click();
  await expect(page.getByText('등록된 노출 유형이 없습니다.', { exact: true })).toBeVisible();
  await expect(page.getByText('등록된 사건이 없습니다.', { exact: true })).toBeVisible();
});

test('exposure bars and statistics show categories while the incident popup preserves source names', async ({
  page,
}) => {
  await openMap(page);
  await page.getByRole('button', { name: 'Github Gist 영토 선택', exact: true }).click();
  const details = page.getByRole('complementary', { name: 'Github Gist 상세 패널' });
  const bars = details.locator('[class*="bars-block"]');
  await expect(bars.locator('[class*="bar-row"]')).toHaveCount(1);
  await expect(bars.getByText('API 키 노출', { exact: true })).toBeVisible();
  await expect(bars.getByText('100%', { exact: true })).toBeVisible();
  await expect(bars).not.toContainText('Google');
  await expect(bars).not.toContainText('OpenAI');
  await page.getByRole('tab', { name: /^사건/ }).click();
  await details.getByRole('button', { name: /쿠팡 API 관련 코드 게시/ }).click();
  const popup = page.getByRole('dialog', { name: '쿠팡 API 관련 코드 게시' });
  await expect(popup.getByRole('heading', { name: 'Google API key 노출' })).toBeVisible();
  await expect(popup.getByRole('heading', { name: 'OpenAI API key 노출' })).toBeVisible();
  await popup.getByRole('button', { name: '사건 설명 닫기' }).click();
  await page.getByRole('button', { name: '통계', exact: true }).click();
  const table = page
    .locator('[class*="stats-table"]')
    .filter({ has: page.getByRole('button', { name: /API 키 노출/ }) })
    .last();
  const row = table.getByRole('button', { name: /API 키 노출/ });
  await expect(row).toHaveCount(1);
  await expect(row).toContainText('1건');
  await expect(table).not.toContainText('Google API');
  await expect(table).not.toContainText('OpenAI API');
});

test('hex faces remain clickable and stationary on hover; zoom, pan and reset work', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await openMap(page);
  const island = page.getByRole('button', { name: '백엔드 서비스 섬 선택', exact: true });
  await expect(island.locator('[data-map-layer="sides"] polygon')).toHaveCount(0);
  // Click an actual top face, not a badge or a forced event.
  await island.locator('[data-map-layer="tops"] polygon').last().click();
  await expect(page.getByRole('complementary', { name: '백엔드 서비스 상세 패널' })).toBeVisible();
  await page.getByRole('button', { name: '상세 패널 접기' }).click();
  const detailButton = page.getByRole('button', { name: '상세 보기', exact: false });
  await expect(detailButton).toBeVisible();
  const detailButtonBox = (await detailButton.boundingBox())!;
  expect(detailButtonBox.width).toBeGreaterThan(detailButtonBox.height);
  await detailButton.click();
  await expect(page.getByRole('complementary', { name: '백엔드 서비스 상세 패널' })).toBeVisible();
  const top = island.locator('[data-map-layer="tops"] polygon').last();
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
  // 좌상단의 관리자 버튼 hover 영역을 피하고 실제 SVG 빈 공간을 드래그한다.
  const dragStart = { x: box.x + 30, y: box.y + 100 };
  expect(
    await svg.evaluate(
      (node, point) => document.elementFromPoint(point.x, point.y) === node,
      dragStart,
    ),
  ).toBe(true);
  await page.mouse.move(dragStart.x, dragStart.y);
  await page.mouse.down();
  await page.mouse.move(box.x + 80, box.y + 135, { steps: 8 });
  await page.mouse.up();
  expect(await scene.getAttribute('transform')).not.toBe(transform);
  await page.getByRole('button', { name: '전체 보기' }).click();
  await expect(page.getByLabel('확대 배율')).toHaveText('100%');
  await expect(page.getByRole('heading', { name: '전체 오픈웹', exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test('code and text hex spacing matches community in flat and raised views', async ({ page }) => {
  await openMap(page);
  const getSpacing = async (id: string) =>
    page
      .locator(`[data-island-id="${id}"] [data-map-layer="tops"] polygon`)
      .evaluateAll((nodes) => {
        const cells = nodes.map((node) => {
          const [x, y] = node
            .getAttribute('transform')!
            .match(/-?\d+(?:\.\d+)?/g)!
            .map(Number);
          return {
            x,
            y: y + Number(node.getAttribute('data-elevation')),
            row: Number(node.getAttribute('data-cell-key')!.split('-')[0]),
          };
        });
        const firstRow = cells.filter((cell) => cell.row === 0).sort((a, b) => a.x - b.x);
        const secondRow = cells.filter((cell) => cell.row === 1);
        return { column: firstRow[1].x - firstRow[0].x, row: secondRow[0].y - firstRow[0].y };
      });
  const community = await getSpacing('community');
  expect(community.column).toBeCloseTo(17.6);
  expect(community.row).toBeCloseTo(15.2);
  for (const [id, label] of [
    ['code', '코드 호스팅 섬 선택'],
    ['text', '텍스트 호스팅 섬 선택'],
  ]) {
    const flat = await getSpacing(id);
    expect(flat.column).toBeCloseTo(community.column);
    expect(flat.row).toBeCloseTo(community.row);
    const island = page.getByRole('button', { name: label, exact: true });
    await island.locator('[data-elevation="0"]').last().click();
    const raised = await getSpacing(id);
    expect(raised.column).toBeCloseTo(community.column);
    expect(raised.row).toBeCloseTo(community.row);
    expect(await island.locator('[data-map-layer="sides"] polygon').count()).toBeGreaterThan(0);
    await page.getByRole('button', { name: '전체 보기' }).click();
  }
});

test('selecting Pastebin also raises and emphasizes its connected code island', async ({ page }) => {
  await openMap(page);
  await page.getByRole('combobox').fill('Pastebin');
  await page.getByRole('option', { name: /Pastebin/ }).click();

  const codeIsland = page.getByRole('button', { name: '코드 호스팅 섬 선택', exact: true });
  const textIsland = page.getByRole('button', { name: '텍스트 호스팅 섬 선택', exact: true });
  expect(await codeIsland.evaluate((node) => node.parentElement?.getAttribute('opacity'))).toBe(
    '1',
  );
  await expect(codeIsland.locator('..')).toHaveAttribute('data-selected', 'true');
  await expect(textIsland.locator('..')).toHaveAttribute('data-selected', 'true');
  const pastebinLabel = page.getByRole('button', { name: 'Pastebin 영토 선택', exact: true });
  await expect(pastebinLabel).toHaveAttribute('data-selected', 'true');
  await expect(pastebinLabel.locator('text')).toHaveAttribute('fill', '#1e293b');
  const selectedIslandTitle = page.getByRole('button', { name: /텍스트 호스팅 \d+건/ });
  await expect(selectedIslandTitle.locator('text')).toHaveAttribute('fill', '#2cbfaf');
  await expect(selectedIslandTitle.locator('text')).toHaveAttribute('font-weight', '700');
  const codeTitle = page.getByRole('button', { name: /코드 호스팅 \d+건/ });
  await codeTitle.dispatchEvent('pointerover');
  await expect(codeIsland.locator('..')).toHaveAttribute('opacity', '1');
  await expect(codeTitle.locator('text')).toHaveAttribute('fill', '#ffffff');
  await codeTitle.dispatchEvent('pointerout');
  await expect(codeIsland.locator('..')).toHaveAttribute('opacity', '1');
  expect(await codeIsland.locator('[data-map-layer="sides"] polygon').count()).toBeGreaterThan(0);
  expect(await textIsland.locator('[data-map-layer="sides"] polygon').count()).toBeGreaterThan(0);
  await expect(page.getByRole('complementary', { name: 'Pastebin 상세 패널' })).toBeVisible();
});

test('platform territory is contiguous and only relevant events appear; date filters apply', async ({
  page,
}) => {
  await openMap(page);
  await page.getByRole('button', { name: 'Github Gist 영토 선택', exact: true }).click();
  const island = page.getByRole('button', { name: '코드 호스팅 섬 선택', exact: true });
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
  const detail = page.getByRole('complementary', { name: 'Github Gist 상세 패널' });
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

test('selecting a platform shows its direct connections between territory centers', async ({ page }) => {
  await openMap(page);
  await expect(page.locator('[data-relation-id]')).toHaveCount(0);
  await page.getByRole('switch', { name: '전체 관계 보기' }).click();
  await expect(page.locator('[data-relation-id]')).toHaveCount(0);
  await page.getByRole('button', { name: 'Github Gist 영토 선택', exact: true }).click();

  await expect(page.locator('[data-relation-id="gist-pastebin"]')).toBeVisible();
  await expect(page.locator('[data-relation-id="gist-mega"]')).toBeVisible();
  await expect(page.locator('[data-relation-id="gist-rentry"]')).toBeVisible();
  await expect(page.locator('[data-relation-id="code-text"]')).toHaveCount(0);
  await expect(page.locator('[data-island-id="code"]')).toHaveAttribute('opacity', '1');
  await expect(page.locator('[data-island-id="text"]')).toHaveAttribute('opacity', '1');
  await expect(page.locator('[data-island-id="files"]')).toHaveAttribute('opacity', '1');
  await expect(page.locator('[data-island-id="community"]')).toHaveAttribute('opacity', '0.18');
  await expect(
    page.locator('[data-map-layer="tops"] polygon[data-owner-id="pastebin"]').first(),
  ).toHaveAttribute('data-elevation', '7');
  await expect(
    page.locator('[data-map-layer="tops"] polygon[data-owner-id="mega"]').first(),
  ).toHaveAttribute('data-elevation', '7');

  const averageCenter = async (platformId: string) =>
    page
      .locator(`[data-map-layer="tops"] polygon[data-owner-id="${platformId}"]`)
      .evaluateAll((nodes) => {
        const centers = nodes.map((node) =>
          node.getAttribute('transform')!.match(/-?\d+(?:\.\d+)?/g)!.map(Number),
        );
        return {
          x: centers.reduce((sum, point) => sum + point[0], 0) / centers.length,
          y: centers.reduce((sum, point) => sum + point[1], 0) / centers.length,
        };
      });
  const gistCenter = await averageCenter('github-gist');
  const pastebinCenter = await averageCenter('pastebin');
  const relation = page.locator('[data-relation-id="gist-pastebin"]');
  expect(
    await page.locator('[data-island-id="official"]').evaluate((island, line) => {
      return Boolean(island.compareDocumentPosition(line as Node) & Node.DOCUMENT_POSITION_FOLLOWING);
    }, await relation.elementHandle()),
  ).toBe(true);
  expect(Number(await relation.getAttribute('data-source-x'))).toBeCloseTo(gistCenter.x);
  expect(Number(await relation.getAttribute('data-source-y'))).toBeCloseTo(gistCenter.y);
  expect(Number(await relation.getAttribute('data-target-x'))).toBeCloseTo(pastebinCenter.x);
  expect(Number(await relation.getAttribute('data-target-y'))).toBeCloseTo(pastebinCenter.y);
});

test('candidate relations remain unverified when selected, and search handles no results', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await openMap(page);
  await page.getByRole('button', { name: 'Github Gist 영토 선택', exact: true }).click();
  const relation = page.locator('[data-relation-id="gist-mega"]');
  await relation.focus();
  await page.keyboard.press('Enter');
  const detail = page.getByRole('complementary', { name: 'Github Gist 상세 패널' });
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

test('open marketplace shows Xianyu and Taobao without inventing incidents', async ({ page }) => {
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
  await expect(details.getByText('오픈마켓 > 시엔위 · 사건 0건')).toBeVisible();
  await details.getByRole('tab', { name: '사건 0', exact: true }).click();
  await expect(details.getByText('이 기간에 등록된 사건이 없습니다.')).toBeVisible();

  await page.getByRole('combobox').fill('Taobao');
  await page.getByRole('option', { name: /타오바오/ }).click();
  const taobaoDetails = page.getByRole('complementary', { name: '타오바오 상세 패널' });
  await expect(taobaoDetails).toBeVisible();
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

test('full viewport starts flat with boxed island titles and platform labels', async ({
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
  expect(await label.locator('rect').evaluate((node) => getComputedStyle(node).fill)).toBe(
    'rgb(255, 255, 255)',
  );
  await expect(label.locator('rect')).toHaveAttribute('rx', '8');
  expect(await label.locator('text').evaluate((node) => getComputedStyle(node).paintOrder)).toBe(
    'stroke',
  );
  const title = page.getByRole('button', { name: /파일 호스팅 \d+건/, exact: true });
  expect(await title.locator('rect').evaluate((node) => getComputedStyle(node).fill)).toBe(
    'rgb(255, 255, 255)',
  );
  expect((await title.locator('rect').boundingBox())!.width).toBeGreaterThan(
    (await title.locator('text').boundingBox())!.width,
  );
  await page.getByRole('button', { name: /파일 호스팅 \d+건/, exact: true }).click();
  await expect(page.getByRole('complementary', { name: '파일 호스팅 상세 패널' })).toBeVisible();
});

test('AWS S3 stays blue with gray surroundings and keeps depth through repeated clicks', async ({
  page,
}) => {
  await openMap(page);
  await page.getByRole('button', { name: 'AWS S3 영토 선택', exact: true }).click();
  const island = page.getByRole('button', { name: '파일 호스팅 섬 선택', exact: true });
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
  // The label box covers some central faces; both targets preserve selection.
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

test('fixture platforms do not expose database incident writes', async ({ page }) => {
  await openMap(page);
  const adminButton = page.getByRole('button', { name: '관리자 로그인' });
  // 관리자 버튼은 지도 왼쪽 가장자리에 마우스를 올리면 나타난다.
  await page.locator('[class*="admin-button-edge"]').hover();
  await expect(adminButton).toBeVisible();
  await adminButton.click();
  await expect(page.getByRole('dialog', { name: '관리자 로그인' })).toBeVisible();
  await page.getByRole('button', { name: '취소' }).click();
  await page.getByRole('button', { name: 'AWS S3 영토 선택', exact: true }).click();
  await expect(page.getByRole('button', { name: '데이터 추가', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: '데이터 수정', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: '데이터 삭제', exact: true })).toBeDisabled();
});
