export type SupabaseConfig = { url: string; publishableKey: string };
export type MapTable =
  | 'island'
  | 'platforms'
  | 'incidents'
  | 'incidents_data_types'
  | 'platform_connections';

export async function queryTableRows(
  config: SupabaseConfig,
  table: MapTable,
  columns: string,
  fetcher: typeof fetch = fetch,
): Promise<unknown[]> {
  const rows: unknown[] = [];
  const pageSize = 500;
  while (true) {
    const url = new URL(`/rest/v1/${table}`, config.url);
    url.searchParams.set('select', columns);
    url.searchParams.set('order', 'id.asc');
    url.searchParams.set('limit', String(pageSize));
    url.searchParams.set('offset', String(rows.length));
    let response: Response;
    try {
      response = await fetcher(url, {
        method: 'GET',
        headers: {
          apikey: config.publishableKey,
          'Accept-Profile': 'public',
          Prefer: 'count=exact',
        },
        cache: 'no-store',
        signal: AbortSignal.timeout(10_000),
        redirect: 'error',
      });
    } catch {
      throw new Error(`Supabase ${table} 조회 서버에 연결하지 못했습니다.`);
    }
    if (!response.ok) throw new Error(`Supabase ${table} 조회 실패 (HTTP ${response.status}).`);

    let page: unknown;
    try {
      page = await response.json();
    } catch {
      throw new Error(`Supabase ${table} 조회 응답이 올바른 JSON이 아닙니다.`);
    }
    if (!Array.isArray(page)) throw new Error(`Supabase ${table} 조회 응답은 목록이어야 합니다.`);
    const totalText = response.headers.get('content-range')?.split('/')[1];
    const total = totalText && /^\d+$/.test(totalText) ? Number(totalText) : null;
    rows.push(...page);
    if (total !== null && rows.length >= total) return rows;
    if (!page.length) {
      if (total !== null) throw new Error(`Supabase ${table} 조회 결과가 일부 누락됐습니다.`);
      return rows;
    }
    if (total === null && page.length < pageSize) return rows;
  }
}
