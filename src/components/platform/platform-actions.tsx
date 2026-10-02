// 플랫폼 추가·수정·삭제 대화상자를 여는 상세 패널 액션 컴포넌트
'use client';

import { useState } from 'react';
import type { Platform } from '@/lib/ecosystem-types';
import { Button } from '@/components/button/button';
import { PlatformDialog } from './platform-dialog';
import type { EditorMode } from '@/hooks/use-platform-editor';
import styles from '@/styles/platform-editor.module.css';
import { useEcosystemData } from '@/hooks/use-ecosystem-data';

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
  const { readOnly } = useEcosystemData();
  return (
    <div className={styles.actions}>
      <div className={styles.buttons} role="group" aria-label="플랫폼 데이터 관리">
        <Button disabled={readOnly} onClick={() => setMode('add')}>
          데이터 추가
        </Button>
        <Button disabled={readOnly} variant="secondary" onClick={() => setMode('edit')}>
          데이터 수정
        </Button>
        <Button
          variant="secondary"
          disabled={readOnly}
          className={styles['delete-button']}
          onClick={() => setMode('delete')}
        >
          데이터 삭제
        </Button>
      </div>
      <p>{readOnly ? '현재 조회 전용입니다.' : '로컬 임시 데이터 · 새로고침 시 초기화'}</p>
      {!readOnly && mode && (
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
