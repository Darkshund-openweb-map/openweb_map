'use client';

import { useContext } from 'react';
import { AdminContext } from '@/contexts/admin-context';

export function useAdmin() {
  const value = useContext(AdminContext);
  if (!value) throw new Error('AdminProvider가 필요합니다.');
  return value;
}
