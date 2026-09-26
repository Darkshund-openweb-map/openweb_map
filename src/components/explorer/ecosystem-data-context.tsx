'use client';

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { CategoryId, Platform } from '@/lib/ecosystem-types';
import type { EcosystemSnapshot } from '@/lib/ecosystem-types';
import {
  removePlatformData,
  replacePlatformData,
  validatePlatform,
} from '@/lib/platform-mutations';

type EcosystemData = EcosystemSnapshot & {
  getCategory: (id: CategoryId) => EcosystemSnapshot['categories'][number];
  getPlatform: (id: string) => EcosystemSnapshot['platforms'][number] | undefined;
  addPlatform: (platform: Platform) => void;
  updatePlatform: (platform: Platform) => void;
  deletePlatform: (id: string) => void;
};

const EcosystemDataContext = createContext<EcosystemData | null>(null);

export function EcosystemDataProvider({
  data,
  children,
}: {
  data: EcosystemSnapshot;
  children: ReactNode;
}) {
  const [snapshot, setSnapshot] = useState(data);
  const value = useMemo<EcosystemData>(
    () => ({
      ...snapshot,
      getCategory: (id) => snapshot.categories.find((item) => item.id === id)!,
      getPlatform: (id) => snapshot.platforms.find((item) => item.id === id),
      addPlatform: (platform) => {
        const validated = validatePlatform(platform, snapshot);
        setSnapshot((current) => ({ ...current, platforms: [...current.platforms, validated] }));
      },
      updatePlatform: (platform) => {
        const validated = validatePlatform(platform, snapshot);
        setSnapshot((current) => replacePlatformData(current, validated));
      },
      deletePlatform: (id) => setSnapshot((current) => removePlatformData(current, id)),
    }),
    [snapshot],
  );

  return <EcosystemDataContext.Provider value={value}>{children}</EcosystemDataContext.Provider>;
}

export function useEcosystemData() {
  const value = useContext(EcosystemDataContext);
  if (!value) throw new Error('EcosystemDataProvider가 필요합니다.');
  return value;
}
