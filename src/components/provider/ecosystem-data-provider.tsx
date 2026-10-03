// 생태계 데이터와 로컬 플랫폼 변경 기능을 하위 화면에 공급하는 컴포넌트
'use client';

import { useMemo, useState, type ReactNode } from 'react';
import type { EcosystemSnapshot } from '@/lib/ecosystem-types';
import { useSnapshotTimeline } from '@/hooks/use-snapshot-timeline';
import { snapshotAtDate } from '@/lib/snapshot-timeline';
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
  const timeline = useSnapshotTimeline(snapshot);
  const cutoff = timeline.current.date;
  const visible = useMemo(() => snapshotAtDate(snapshot, cutoff), [snapshot, cutoff]);
  const value = useMemo<EcosystemData>(
    () => ({
      ...visible,
      timeline,
      getCategory: (id) => visible.categories.find((item) => item.id === id)!,
      getPlatform: (id) => visible.platforms.find((item) => item.id === id),
      addPlatform: (platform) => {
        if (visible.readOnly) throw new Error('현재 데이터는 조회 전용입니다.');
        const validated = validatePlatform(platform, snapshot);
        setSnapshot((current) => ({ ...current, platforms: [...current.platforms, validated] }));
      },
      updatePlatform: (platform) => {
        if (visible.readOnly) throw new Error('현재 데이터는 조회 전용입니다.');
        const validated = validatePlatform(platform, snapshot);
        setSnapshot((current) => replacePlatformData(current, validated));
      },
      deletePlatform: (id) => {
        if (visible.readOnly) throw new Error('현재 데이터는 조회 전용입니다.');
        setSnapshot((current) => removePlatformData(current, id));
      },
    }),
    [snapshot, visible, timeline],
  );

  return <EcosystemDataContext.Provider value={value}>{children}</EcosystemDataContext.Provider>;
}
