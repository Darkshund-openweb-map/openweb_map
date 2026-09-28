// 생태계 데이터와 로컬 플랫폼 변경 기능을 하위 화면에 공급하는 컴포넌트
'use client';

import { useMemo, useState, type ReactNode } from 'react';
import type { EcosystemSnapshot } from '@/lib/ecosystem-types';
import { EcosystemDataContext, type EcosystemData } from '@/contexts/ecosystem-data-context';
import {
  removePlatformData,
  replacePlatformData,
  validatePlatform,
} from '@/lib/platform-mutations';

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
