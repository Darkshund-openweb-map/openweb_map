import 'server-only';

import { readSupabaseConfig } from './island-query';

export type PlatformInput = {
  name: string;
  domain: string;
  description: string;
  islandId: number;
};

function adminConfig() {
  const url = readSupabaseConfig(process.env).url;
  const targetRef = process.env.ADMIN_WRITE_PROJECT_REF?.trim();
  if (!targetRef || new URL(url).hostname !== `${targetRef}.supabase.co`)
    throw new Error('관리자 DB 대상 프로젝트가 설정되지 않았습니다.');
  const key = process.env.SUPABASE_SECRET_KEY?.trim();
  if (!key?.startsWith('sb_secret_'))
    throw new Error('SUPABASE_SECRET_KEY를 서버 환경 변수에 설정해 주세요.');
  return { url, key };
}

export async function adminRequest(path: string, init: RequestInit) {
  const { url, key } = adminConfig();
  const response = await fetch(new URL(`/rest/v1/${path}`, url), {
    ...init,
    headers: {
      apikey: key,
      'Content-Type': 'application/json',
      'Accept-Profile': 'public',
      'Content-Profile': 'public',
      Prefer: 'return=representation',
      ...init.headers,
    },
    cache: 'no-store',
    signal: AbortSignal.timeout(10_000),
    redirect: 'error',
  });
  if (!response.ok) {
    const details = await response.json().catch(() => null);
    const message =
      details && typeof details.message === 'string'
        ? details.message.slice(0, 200)
        : '권한과 테이블 설정을 확인해 주세요.';
    throw new Error(`Supabase 요청에 실패했습니다 (HTTP ${response.status}). ${message}`);
  }
  return response.status === 204 ? null : response.json();
}

export async function parsePlatformInput(value: unknown): Promise<PlatformInput> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('플랫폼 입력값이 올바르지 않습니다.');
  const row = value as Record<string, unknown>;
  if (typeof row.name !== 'string' || !row.name.trim() || row.name.trim().length > 40)
    throw new Error('플랫폼 이름은 1~40자로 입력해 주세요.');
  if (typeof row.description !== 'string' || row.description.length > 500)
    throw new Error('설명은 500자 이하로 입력해 주세요.');
  if (typeof row.domain !== 'string') throw new Error('도메인을 입력해 주세요.');
  let domain: string;
  try {
    const raw = row.domain.trim();
    const parsed = new URL(raw.includes('://') ? raw : `https://${raw}`);
    if (
      !['http:', 'https:'].includes(parsed.protocol) ||
      !parsed.hostname.includes('.') ||
      parsed.username ||
      parsed.password ||
      parsed.port ||
      parsed.pathname !== '/' ||
      parsed.search ||
      parsed.hash
    )
      throw new Error();
    domain = parsed.hostname;
  } catch {
    throw new Error('도메인은 example.com 형식으로 입력해 주세요.');
  }
  if (!Number.isSafeInteger(row.islandId) || (row.islandId as number) < 1)
    throw new Error('플랫폼 유형이 올바르지 않습니다.');
  const islands = await adminRequest(`island?id=eq.${row.islandId}&select=id`, { method: 'GET' });
  if (!Array.isArray(islands) || islands.length !== 1)
    throw new Error('플랫폼 유형을 찾을 수 없습니다.');
  return {
    name: row.name.trim(),
    domain,
    description: row.description.trim(),
    islandId: row.islandId as number,
  };
}

export async function createPlatform(input: PlatformInput) {
  const rows = await adminRequest('platforms?select=id', {
    method: 'POST',
    body: JSON.stringify({
      name: input.name,
      domain: input.domain,
      description: input.description,
      island_id: input.islandId,
    }),
  });
  if (!Array.isArray(rows) || !Number.isSafeInteger(rows[0]?.id))
    throw new Error('저장된 플랫폼 ID를 확인할 수 없습니다.');
  return rows[0].id as number;
}

export async function updatePlatform(id: number, input: PlatformInput) {
  const rows = await adminRequest(`platforms?id=eq.${id}&select=id`, {
    method: 'PATCH',
    body: JSON.stringify({
      name: input.name,
      domain: input.domain,
      description: input.description,
      island_id: input.islandId,
    }),
  });
  if (!Array.isArray(rows) || rows.length !== 1)
    throw new Error('수정할 플랫폼을 찾을 수 없습니다.');
}

export async function deletePlatform(id: number) {
  const rows = await adminRequest('rpc/admin_delete_platform', {
    method: 'POST',
    body: JSON.stringify({ p_platform_id: id }),
  });
  if (rows !== true) throw new Error('삭제할 플랫폼을 찾을 수 없습니다.');
}
