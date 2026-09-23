import { Explorer } from '@/components/explorer/explorer';
import { fixtureEcosystemSource } from '@/lib/fixture-source';

export default async function Home() {
  const initialData = await fixtureEcosystemSource.load();
  return <Explorer initialData={initialData} />;
}
