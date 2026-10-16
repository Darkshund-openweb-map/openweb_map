import 'server-only';

import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000;

function secret() {
  const value = process.env.ADMIN_SESSION_SECRET;
  if (!value || value.length < 32)
    throw new Error('ADMIN_SESSION_SECRET을 32자 이상으로 설정해 주세요.');
  return value;
}

function signature(payload: string) {
  return createHmac('sha256', secret()).update(payload).digest('base64url');
}

export function verifyAdminCredentials(id: string, password: string) {
  const configuredId = process.env.ADMIN_ID;
  const configuredPassword = process.env.ADMIN_PASSWORD;
  if (!configuredId || !configuredPassword)
    throw new Error('ADMIN_ID와 ADMIN_PASSWORD를 설정해 주세요.');

  const matches = (actual: string, supplied: string) =>
    timingSafeEqual(
      createHash('sha256').update(actual).digest(),
      createHash('sha256').update(supplied).digest(),
    );
  const idMatches = matches(configuredId, id);
  const passwordMatches = matches(configuredPassword, password);
  return idMatches && passwordMatches;
}

export function createAdminSession() {
  const payload = Buffer.from(`${Date.now()}:${crypto.randomUUID()}`).toString('base64url');
  return `${payload}.${signature(payload)}`;
}

export function verifyAdminSession(token: string | null) {
  if (!token) return false;
  const [payload, supplied, extra] = token.split('.');
  if (!payload || !supplied || extra) return false;
  const expected = Buffer.from(signature(payload));
  const actual = Buffer.from(supplied);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return false;
  const issuedAt = Number(Buffer.from(payload, 'base64url').toString().split(':')[0]);
  return (
    Number.isSafeInteger(issuedAt) &&
    issuedAt <= Date.now() &&
    Date.now() - issuedAt < SESSION_MAX_AGE_MS
  );
}
