'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { CategoryId } from '@/lib/ecosystem-types';
import type { EcosystemSnapshot } from '@/lib/ecosystem-types';

type EcosystemData = EcosystemSnapshot & {
  getCategory: (id: CategoryId) => EcosystemSnapshot['categories'][number];
  getPlatform: (id: string) => EcosystemSnapshot['platforms'][number] | undefined;
};

const EcosystemDataContext = createContext<EcosystemData | null>(null);

export function EcosystemDataProvider({
  data,
  children,
}: {
  data: EcosystemSnapshot;
  children: ReactNode;
}) {
  const value = useMemo<EcosystemData>(
    () => ({
      ...data,
      getCategory: (id) => data.categories.find((item) => item.id === id)!,
      getPlatform: (id) => data.platforms.find((item) => item.id === id),
    }),
    [data],
  );

  return <EcosystemDataContext.Provider value={value}>{children}</EcosystemDataContext.Provider>;
}

export function useEcosystemData() {
  const value = useContext(EcosystemDataContext);
  if (!value) throw new Error('EcosystemDataProvider가 필요합니다.');
  return value;
}
