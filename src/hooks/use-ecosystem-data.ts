// 가장 가까운 공급자에서 생태계 데이터와 변경 기능을 읽는 훅
'use client';

import { useContext } from 'react';
import { EcosystemDataContext } from '@/contexts/ecosystem-data-context';

export function useEcosystemData() {
  const value = useContext(EcosystemDataContext);
  if (!value) throw new Error('EcosystemDataProvider가 필요합니다.');
  return value;
}
