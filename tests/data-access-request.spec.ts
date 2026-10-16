import { expect, test, type Page } from '@playwright/test';
import { parseDataAccessRequest, requestFieldLimits } from '../src/lib/data-access-request';

const input = {
  id: '710eeefd-ab78-47cd-b09f-9f66feea4372',
  full_name: '테스트 신청자',
  organization: '테스트 팀',
  reply_email: 'request-test@example.com',
  requested_data: '플랫폼별 사건 통계',
  usage_purpose: '학술 연구',
  contact_consent: true,
};

async function openForm(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: '요청서 작성' }).click();
  return page.getByRole('dialog', { name: '조회 요청', exact: true });
}

async function fillForm(page: Page) {
  const dialog = await openForm(page);
  await dialog.getByLabel('이름').fill(input.full_name);
  await dialog.getByLabel('소속').fill(input.organization);
  await dialog.getByLabel('회신 이메일').fill(input.reply_email);
  await dialog.getByLabel('필요한 자료').fill(input.requested_data);
  await dialog.getByLabel('이용 목적').fill(input.usage_purpose);
  await dialog.getByRole('checkbox').check();
  return dialog;
}

test('request fields match the database and never accept server-managed or extra fields', () => {
  const parsed = parseDataAccessRequest({
    ...input,
    full_name: '  테스트 신청자  ',
    organization: '  ',
    created_at: '2000-01-01',
    status: 'approved',
  });
  expect(parsed).toEqual({ ...input, organization: null });
  expect(requestFieldLimits).toMatchObject({ full_name: 100, organization: 200, reply_email: 320 });
});

test('request validation rejects missing consent, whitespace, invalid email, UUID and oversized fields', () => {
  for (const change of [
    { contact_consent: false },
    { contact_consent: 'true' },
    { full_name: '  ' },
    { reply_email: 'invalid-email' },
    { id: 'not-a-uuid' },
    { requested_data: '' },
    { usage_purpose: 'a'.repeat(2001) },
    { organization: 'a'.repeat(201) },
    { full_name: 'bad\0name' },
  ])
    expect(() => parseDataAccessRequest({ ...input, ...change })).toThrow();
  for (const value of [null, [], 'request']) expect(() => parseDataAccessRequest(value)).toThrow();
});

test('request form sends the table fields once and shows success only after the response', async ({
  page,
}) => {
  const sent: Record<string, unknown>[] = [];
  let finish!: () => void;
  const pending = new Promise<void>((resolve) => {
    finish = resolve;
  });
  await page.route('**/api/data-access-requests', async (route) => {
    const data = route.request().postDataJSON();
    sent.push(data);
    await pending;
    await route.fulfill({ status: 201, json: { id: data.id } });
  });
  const dialog = await fillForm(page);
  await dialog.getByRole('button', { name: '신청 보내기' }).click();
  await expect(dialog.getByRole('button', { name: '보내는 중…' })).toBeDisabled();
  await dialog.locator('form').dispatchEvent('submit');
  await expect.poll(() => sent.length).toBe(1);
  expect(sent[0]).toEqual({ ...input, id: expect.any(String) });
  await expect(dialog.getByText('신청을 보냈습니다.')).toHaveCount(0);
  finish();
  await expect(dialog.getByRole('heading', { name: '신청을 보냈습니다.' })).toBeVisible();
  await expect(dialog.locator('form')).toHaveCount(0);
  await dialog.getByRole('button', { name: '확인', exact: true }).click();
  await expect(dialog).toHaveCount(0);
});

test('failed request preserves the form and retries with the same UUID without exposing DB errors', async ({
  page,
}) => {
  const sent: Record<string, unknown>[] = [];
  await page.route('**/api/data-access-requests', async (route) => {
    const data = route.request().postDataJSON();
    sent.push(data);
    await route.fulfill(
      sent.length === 1
        ? { status: 503, json: { error: 'private database error' } }
        : { status: 201, json: { id: data.id } },
    );
  });
  const dialog = await fillForm(page);
  await dialog.getByRole('button', { name: '신청 보내기' }).click();
  await expect(dialog.getByRole('alert')).toContainText('신청을 보내지 못했습니다.');
  await expect(dialog).not.toContainText('private database error');
  await expect(dialog.getByLabel('필요한 자료')).toHaveValue(input.requested_data);
  await dialog.getByRole('button', { name: '신청 보내기' }).click();
  await expect(dialog.getByText('신청을 보냈습니다.')).toBeVisible();
  expect(sent).toHaveLength(2);
  expect(sent[0].id).toBe(sent[1].id);
});

test('empty required fields and missing consent do not send a request', async ({ page }) => {
  let requests = 0;
  await page.route('**/api/data-access-requests', async (route) => {
    requests++;
    await route.abort();
  });
  const dialog = await openForm(page);
  await dialog.getByRole('button', { name: '신청 보내기' }).click();
  expect(
    await dialog.locator('form').evaluate((form) => (form as HTMLFormElement).checkValidity()),
  ).toBe(false);
  await dialog.getByLabel('이름').fill(input.full_name);
  await dialog.getByLabel('회신 이메일').fill(input.reply_email);
  await dialog.getByLabel('필요한 자료').fill(input.requested_data);
  await dialog.getByLabel('이용 목적').fill(input.usage_purpose);
  await dialog.getByRole('button', { name: '신청 보내기' }).click();
  expect(
    await dialog
      .getByRole('checkbox')
      .evaluate((box) => (box as HTMLInputElement).validity.valueMissing),
  ).toBe(true);
  expect(requests).toBe(0);
});

test('request dialog fits mobile and exposes the send button', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: '조회 요청', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: '조회 요청', exact: true });
  const box = await dialog.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(390);
  await dialog.getByRole('button', { name: '신청 보내기' }).scrollIntoViewIfNeeded();
  await expect(dialog.getByRole('button', { name: '신청 보내기' })).toBeVisible();
});

test('request API rejects cross-origin, malformed and unconsented submissions without writing', async ({
  request,
  baseURL,
}) => {
  const path = '/api/data-access-requests';
  const headers = { Origin: new URL(baseURL!).origin };
  expect((await request.get(path)).status()).toBe(405);
  expect((await request.post(path, { data: input })).status()).toBe(403);
  expect(
    (
      await request.post(path, { data: input, headers: { Origin: 'https://example.com' } })
    ).status(),
  ).toBe(403);
  expect((await request.post(path, { data: 'not-json', headers })).status()).toBe(415);
  const invalid = await request.post(path, { headers, data: { ...input, contact_consent: false } });
  expect(invalid.status()).toBe(400);
  expect(invalid.headers()['cache-control']).toBe('no-store');
  expect(
    (
      await request.post(path, { headers, data: { ...input, usage_purpose: 'a'.repeat(25_000) } })
    ).status(),
  ).toBe(413);
});
