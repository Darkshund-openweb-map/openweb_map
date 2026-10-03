// 생태계 데이터 공급자가 공유하는 컨텍스트와 데이터 계약
import { createContext } from 'react';
import type { CategoryId, EcosystemSnapshot, Platform } from '@/lib/ecosystem-types';
import type { SnapshotTimelineState } from '@/types/snapshot-timeline';

export type EcosystemData = EcosystemSnapshot & {
  timeline: SnapshotTimelineState;
  getCategory: (id: CategoryId) => EcosystemSnapshot['categories'][number];
  getPlatform: (id: string) => EcosystemSnapshot['platforms'][number] | undefined;
  addPlatform: (platform: Platform) => Promise<string>;
  updatePlatform: (platform: Platform) => Promise<void>;
  deletePlatform: (id: string) => Promise<void>;
};

export const EcosystemDataContext = createContext<EcosystemData | null>(null);
