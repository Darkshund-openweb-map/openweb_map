import { parseIslandRows, type IslandRow } from '../island-categories';
import { queryTableRows, type SupabaseConfig } from './rest-query';

export function readSupabaseConfig(env: Record<string, string | undefined>): SupabaseConfig {
  const url = (env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL)?.trim();
  const publishableKey = (
    env.SUPABASE_PUBLISHABLE_KEY ||
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )?.trim();
  if (!url || !publishableKey)
    throw new Error('Supabase URL 또는 Publishable key가 설정되지 않았습니다.');

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error('Supabase 프로젝트 URL이 올바르지 않습니다.');
  }
  if (
    (parsed.protocol !== 'https:' &&
      !(parsed.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(parsed.hostname))) ||
    parsed.username ||
    parsed.password ||
    parsed.pathname !== '/' ||
    parsed.search ||
    parsed.hash
  ) {
    throw new Error('Supabase 프로젝트 URL이 올바르지 않습니다.');
  }

  let isPublicKey = publishableKey.startsWith('sb_publishable_');
  if (!isPublicKey) {
    try {
      const payload = JSON.parse(Buffer.from(publishableKey.split('.')[1], 'base64url').toString());
      isPublicKey = payload.role === 'anon';
    } catch {
      isPublicKey = false;
    }
  }
  if (!isPublicKey)
    throw new Error('데이터 조회에는 Publishable key 또는 anon key를 사용해야 합니다.');

  return { url: parsed.origin, publishableKey };
}

export async function queryIslandRows(
  config: SupabaseConfig,
  fetcher: typeof fetch = fetch,
): Promise<IslandRow[]> {
  return parseIslandRows(await queryTableRows(config, 'island', 'id,name', fetcher));
}
