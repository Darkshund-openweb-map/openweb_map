import { createContext } from 'react';

export type AdminContextValue = {
  isAdmin: boolean;
  token: string | null;
  login: (id: string, password: string) => Promise<void>;
  logout: () => void;
};

export const AdminContext = createContext<AdminContextValue | null>(null);
