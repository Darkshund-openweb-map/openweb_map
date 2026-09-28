// 전체 탐색 애플리케이션의 화면 크기와 기본 레이아웃을 감싸는 컴포넌트
import styles from '@/styles/explorer.module.css';
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
