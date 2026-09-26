'use client';

import { useState } from 'react';
import type { Platform } from '@/lib/ecosystem-types';
import { Button } from '../ui/button';
import { PlatformDialog } from './platform-dialog';
import type { EditorMode } from './use-platform-editor';
import styles from './platform-editor.module.css';

export function PlatformActions({
  platform,
  onSelectPlatform,
  onDeleted,
}: {
  platform: Platform;
  onSelectPlatform: (id: string) => void;
  onDeleted: () => void;
}) {
  const [mode, setMode] = useState<EditorMode | null>(null);
  return (
    <div className={styles.actions}>
      <div className={styles.buttons} role="group" aria-label="플랫폼 데이터 관리">
        <Button onClick={() => setMode('add')}>데이터 추가</Button>
        <Button variant="secondary" onClick={() => setMode('edit')}>
          데이터 수정
        </Button>
        <Button
          variant="secondary"
          className={styles['delete-button']}
          onClick={() => setMode('delete')}
        >
          데이터 삭제
        </Button>
      </div>
      <p>로컬 임시 데이터 · 새로고침 시 초기화</p>
      {mode && (
        <PlatformDialog
          platform={platform}
          mode={mode}
          onClose={() => setMode(null)}
          onSaved={(id) => {
            setMode(null);
            onSelectPlatform(id);
          }}
          onDeleted={() => {
            setMode(null);
            onDeleted();
          }}
        />
      )}
    </div>
  );
}
