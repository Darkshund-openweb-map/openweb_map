import 'server-only';

import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { isIP } from 'node:net';
import { adminRequest } from './supabase/admin-rest';

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
  if (!configuredId || !configuredPassword || configuredPassword.length < 15)
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

function sessionIssuedAt(token: string | null) {
  if (!token || token.length > 256) return null;
  const [payload, supplied, extra] = token.split('.');
  if (!payload || !supplied || extra) return null;
  const expected = Buffer.from(signature(payload));
  const actual = Buffer.from(supplied);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  const issuedAt = Number(Buffer.from(payload, 'base64url').toString().split(':')[0]);
  return Number.isSafeInteger(issuedAt) &&
    issuedAt <= Date.now() &&
    Date.now() - issuedAt < SESSION_MAX_AGE_MS
    ? issuedAt
    : null;
}

function tokenHash(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export async function consumeLoginAttempt(clientAddress: string | null) {
  const address = clientAddress?.split(',')[0]?.trim() ?? '';
  const clientKey = `client:${createHmac('sha256', secret())
    .update(isIP(address) ? address : 'unknown')
    .digest('hex')}`;
  const result = await adminRequest('rpc/admin_consume_login_attempt', {
    method: 'POST',
    body: JSON.stringify({ p_client_key: clientKey }),
  });
  if (typeof result !== 'boolean') throw new Error('Invalid login limit response');
  return result;
}

export async function verifyAdminSession(token: string | null) {
  if (sessionIssuedAt(token) === null || !token) return false;
  const rows = await adminRequest(
    `admin_revoked_sessions?token_hash=eq.${tokenHash(token)}&select=token_hash&limit=1`,
    { method: 'GET' },
  );
  if (!Array.isArray(rows)) throw new Error('Invalid session lookup response');
  return rows.length === 0;
}

export async function revokeAdminSession(token: string | null) {
  const issuedAt = sessionIssuedAt(token);
  if (issuedAt === null || !token) return false;
  await adminRequest('admin_revoked_sessions', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify({
      token_hash: tokenHash(token),
      expires_at: new Date(issuedAt + SESSION_MAX_AGE_MS).toISOString(),
    }),
  });
  return true;
}
