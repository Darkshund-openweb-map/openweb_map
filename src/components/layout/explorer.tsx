// 생태계 데이터 공급자와 탐색 화면 본문을 결합하는 최상위 탐색 컴포넌트
'use client';

import type { EcosystemSnapshot } from '@/lib/ecosystem-types';
import { EcosystemDataProvider } from '@/components/provider/ecosystem-data-provider';
import { AdminProvider } from '@/components/provider/admin-provider';
import { ExplorerContent } from './explorer-content';

export function Explorer({
  initialData,
  revision,
}: {
  initialData: EcosystemSnapshot;
  revision: string;
}) {
  return (
    <AdminProvider>
      <EcosystemDataProvider key={revision} data={initialData}>
        <ExplorerContent />
      </EcosystemDataProvider>
    </AdminProvider>
  );
}
