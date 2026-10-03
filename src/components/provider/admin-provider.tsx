'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { AdminContext } from '@/contexts/admin-context';

const SESSION_KEY = 'openweb-admin-session';

export function AdminProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (!stored) return;
    fetch('/api/admin/session', {
      headers: { Authorization: `Bearer ${stored}` },
      cache: 'no-store',
    })
      .then((response) => response.json())
      .then((result) => {
        if (result.authenticated) setToken(stored);
        else sessionStorage.removeItem(SESSION_KEY);
      })
      .catch(() => sessionStorage.removeItem(SESSION_KEY));
  }, []);

  const value = useMemo(
    () => ({
      isAdmin: Boolean(token),
      token,
      async login(pin: string) {
        const response = await fetch('/api/admin/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pin }),
          cache: 'no-store',
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error ?? '관리자 로그인에 실패했습니다.');
        sessionStorage.setItem(SESSION_KEY, result.token);
        setToken(result.token);
      },
      logout() {
        sessionStorage.removeItem(SESSION_KEY);
        setToken(null);
      },
    }),
    [token],
  );

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}
