// 생태계 데이터 공급자가 공유하는 컨텍스트와 데이터 계약
import { createContext } from 'react';
import type { CategoryId, EcosystemSnapshot, Platform } from '@/lib/ecosystem-types';

export type EcosystemData = EcosystemSnapshot & {
  getCategory: (id: CategoryId) => EcosystemSnapshot['categories'][number];
  getPlatform: (id: string) => EcosystemSnapshot['platforms'][number] | undefined;
  addPlatform: (platform: Platform) => void;
  updatePlatform: (platform: Platform) => void;
  deletePlatform: (id: string) => void;
};

export const EcosystemDataContext = createContext<EcosystemData | null>(null);
