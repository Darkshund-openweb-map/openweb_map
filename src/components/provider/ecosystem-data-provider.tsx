// 생태계 데이터와 플랫폼 변경 기능을 하위 화면에 공급하는 컴포넌트
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
import { useAdmin } from '@/hooks/use-admin';

async function savePlatform(mode: 'add' | 'edit' | 'delete', token: string, payload: object) {
  const response = await fetch('/api/admin/platforms', {
    method: mode === 'add' ? 'POST' : mode === 'edit' ? 'PATCH' : 'DELETE',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error ?? '데이터를 저장하지 못했습니다.');
  return result as { id?: number };
}

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
  const admin = useAdmin();
  const readOnly = !admin.isAdmin || !timeline.isLatest;
  const value = useMemo<EcosystemData>(
    () => ({
      ...visible,
      timeline,
      readOnly,
      getCategory: (id) => visible.categories.find((item) => item.id === id)!,
      getPlatform: (id) => visible.platforms.find((item) => item.id === id),
      addPlatform: async (platform) => {
        if (!admin.token) throw new Error('관리자 로그인이 필요합니다.');
        if (!timeline.isLatest) throw new Error('과거 시점에서는 편집할 수 없습니다.');
        const validated = validatePlatform(platform, snapshot);
        const islandId = snapshot.categories.find(
          (item) => item.id === validated.category,
        )?.sourceId;
        if (islandId) {
          const result = await savePlatform('add', admin.token, { ...validated, islandId });
          if (!result.id) throw new Error('저장된 플랫폼 ID를 확인할 수 없습니다.');
          const id = `platform-${result.id}`;
          setSnapshot((current) => ({
            ...current,
            platforms: [...current.platforms, { ...validated, id }],
          }));
          return id;
        }
        setSnapshot((current) => ({ ...current, platforms: [...current.platforms, validated] }));
        return validated.id;
      },
      updatePlatform: async (platform) => {
        if (!admin.token) throw new Error('관리자 로그인이 필요합니다.');
        if (!timeline.isLatest) throw new Error('과거 시점에서는 편집할 수 없습니다.');
        const validated = validatePlatform(platform, snapshot);
        const islandId = snapshot.categories.find(
          (item) => item.id === validated.category,
        )?.sourceId;
        if (islandId) {
          const id = Number(validated.id.replace(/^platform-/, ''));
          await savePlatform('edit', admin.token, { ...validated, id, islandId });
        }
        setSnapshot((current) => replacePlatformData(current, validated));
      },
      deletePlatform: async (id) => {
        if (!admin.token) throw new Error('관리자 로그인이 필요합니다.');
        if (!timeline.isLatest) throw new Error('과거 시점에서는 편집할 수 없습니다.');
        if (snapshot.categories.some((item) => item.sourceId))
          await savePlatform('delete', admin.token, { id: Number(id.replace(/^platform-/, '')) });
        setSnapshot((current) => removePlatformData(current, id));
      },
    }),
    [snapshot, visible, timeline, readOnly, admin.token],
  );

  return <EcosystemDataContext.Provider value={value}>{children}</EcosystemDataContext.Provider>;
}
