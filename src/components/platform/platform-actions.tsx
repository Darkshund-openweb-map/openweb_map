// 플랫폼 추가·수정·삭제 대화상자를 여는 상세 패널 액션 컴포넌트
'use client';

import { useState } from 'react';
import type { Category, Platform } from '@/lib/ecosystem-types';
import { Button } from '@/components/button/button';
import { PlatformDialog } from './platform-dialog';
import { IncidentDialog, type IncidentMode } from './incident-dialog';
import styles from '@/styles/platform-editor.module.css';
import { useEcosystemData } from '@/hooks/use-ecosystem-data';
import { useAdmin } from '@/hooks/use-admin';

export function PlatformActions({ platform }: { platform: Platform }) {
  const [mode, setMode] = useState<IncidentMode | null>(null);
  const { readOnly } = useEcosystemData();
  const { isAdmin } = useAdmin();
  const canEditIncidents = !readOnly && platform.id.startsWith('platform-');
  if (!isAdmin) return null;
  return (
    <div className={styles.actions}>
      <div className={styles.buttons} role="group" aria-label="플랫폼 데이터 관리">
        <Button disabled={!canEditIncidents} onClick={() => setMode('add')}>
          데이터 추가
        </Button>
        <Button disabled={!canEditIncidents} variant="secondary" onClick={() => setMode('edit')}>
          데이터 수정
        </Button>
        <Button
          variant="secondary"
          disabled={!canEditIncidents}
          className={styles['delete-button']}
          onClick={() => setMode('delete')}
        >
          데이터 삭제
        </Button>
      </div>
      <p>
        {readOnly
          ? '관리자 로그인 후 편집할 수 있습니다.'
          : canEditIncidents
            ? '사건 변경 사항은 Supabase에 저장됩니다.'
            : '테스트 데이터에서는 사건 편집을 사용할 수 없습니다.'}
      </p>
      {canEditIncidents && mode && (
        <IncidentDialog platform={platform} mode={mode} onClose={() => setMode(null)} />
      )}
    </div>
  );
}

export function CategoryPlatformAdd({
  category,
  onSelectPlatform,
}: {
  category: Category;
  onSelectPlatform: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const { readOnly } = useEcosystemData();
  const { isAdmin } = useAdmin();
  const placeholder: Platform = {
    id: 'local-new',
    name: '',
    domain: '',
    description: '',
    category: category.id,
    x: category.center[0],
    y: category.center[1],
  };
  if (!isAdmin) return null;
  return (
    <div className={styles.actions}>
      <Button disabled={readOnly} onClick={() => setOpen(true)}>
        데이터 추가
      </Button>
      {readOnly && <p>관리자 로그인 후 편집할 수 있습니다.</p>}
      {open && (
        <PlatformDialog
          platform={placeholder}
          mode="add"
          onClose={() => setOpen(false)}
          onSaved={(id) => {
            setOpen(false);
            onSelectPlatform(id);
          }}
          onDeleted={() => setOpen(false)}
        />
      )}
    </div>
  );
}
