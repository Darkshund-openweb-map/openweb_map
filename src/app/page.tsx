// 초기 생태계 데이터를 불러와 탐색 화면을 렌더링하는 홈 페이지 컴포넌트
import { Explorer } from '@/components/layout/explorer';
import { fixtureEcosystemSource } from '@/lib/fixture-source';

export default async function Home() {
  const initialData = await fixtureEcosystemSource.load();
  return <Explorer initialData={initialData} />;
}
