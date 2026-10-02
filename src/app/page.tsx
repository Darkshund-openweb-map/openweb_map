// 초기 생태계 데이터를 불러와 탐색 화면을 렌더링하는 홈 페이지 컴포넌트
import { Explorer } from '@/components/layout/explorer';
import { DataStatus } from '@/components/layout/data-status';
import { fixtureEcosystemSource } from '@/lib/fixture-source';
import { supabaseEcosystemSource } from '@/lib/supabase-ecosystem-source';
import { connection } from 'next/server';

export default async function Home() {
  await connection();
  const source =
    process.env.ECOSYSTEM_DATA_SOURCE === 'fixture'
      ? fixtureEcosystemSource
      : supabaseEcosystemSource;
  const initialData = await source.load();
  if (!initialData.categories.length) return <DataStatus kind="empty" />;
  return <Explorer initialData={initialData} />;
}
