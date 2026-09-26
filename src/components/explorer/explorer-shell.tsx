import styles from '@/components/explorer/explorer.module.css';
import type { ReactNode } from 'react';

export function ExplorerShell({ children }: { children: ReactNode }) {
  return (
    <main className={styles['reference-page']}>
      <div className={styles['workspace']}>
        <div className={styles['app-shell']} data-web-scope-shell>
          {children}
        </div>
      </div>
    </main>
  );
}
