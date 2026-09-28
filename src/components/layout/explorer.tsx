// 생태계 데이터 공급자와 탐색 화면 본문을 결합하는 최상위 탐색 컴포넌트
'use client';

import type { EcosystemSnapshot } from '@/lib/ecosystem-types';
import { EcosystemDataProvider } from '@/components/provider/ecosystem-data-provider';
import { ExplorerContent } from './explorer-content';

export function Explorer({ initialData }: { initialData: EcosystemSnapshot }) {
  return (
    <EcosystemDataProvider data={initialData}>
      <ExplorerContent />
    </EcosystemDataProvider>
  );
}
