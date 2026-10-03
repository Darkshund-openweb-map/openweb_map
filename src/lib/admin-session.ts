import 'server-only';

import { createHmac, timingSafeEqual } from 'node:crypto';

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

export function verifyAdminPin(input: string) {
  const configured = process.env.ADMIN_PIN;
  if (!configured || !/^\d+$/.test(configured))
    throw new Error('ADMIN_PIN을 숫자로 설정해 주세요.');
  const actual = Buffer.from(configured);
  const supplied = Buffer.from(input);
  return actual.length === supplied.length && timingSafeEqual(actual, supplied);
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
