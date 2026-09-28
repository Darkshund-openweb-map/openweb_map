// 플랫폼 데이터의 추가·수정·삭제 폼을 제공하는 대화상자 컴포넌트
'use client';

import { useEffect, useId, useRef } from 'react';
import type { CategoryId, Platform } from '@/lib/ecosystem-types';
import { Button } from '@/components/button/button';
import { usePlatformEditor, type EditorMode } from '@/hooks/use-platform-editor';
import styles from '@/styles/platform-editor.module.css';

export function PlatformDialog({
  platform,
  mode,
  onClose,
  onSaved,
  onDeleted,
}: {
  platform: Platform;
  mode: EditorMode;
  onClose: () => void;
  onSaved: (id: string) => void;
  onDeleted: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const hintId = useId();
  const editor = usePlatformEditor(platform, mode, onSaved, onDeleted);
  const title = mode === 'add' ? '플랫폼 추가' : mode === 'edit' ? '플랫폼 수정' : '플랫폼 삭제';
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);
  return (
    <dialog
      ref={dialog}
      className={styles.dialog}
      aria-labelledby={titleId}
      aria-describedby={hintId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <form onSubmit={editor.submit}>
        <header className={styles.heading}>
          <h2 id={titleId}>{title}</h2>
          <button type="button" onClick={onClose} aria-label="닫기">
            ×
          </button>
        </header>
        <p id={hintId} className={styles.hint}>
          현재 탭에만 반영됩니다. 새로고침하면 초기화되며 DB에는 저장되지 않습니다.
        </p>
        {mode === 'delete' ? (
          <div className={styles['delete-summary']}>
            <p>
              <strong>{platform.name}</strong>을 이 화면에서 삭제할까요?
            </p>
            <p>
              연결된 사건 {editor.eventCount}개와 관계 {editor.relationCount}개도 함께 제거됩니다.
            </p>
          </div>
        ) : (
          <div className={styles.fields}>
            <label>
              플랫폼 이름
              <input
                name="name"
                value={editor.fields.name}
                maxLength={40}
                required
                onChange={(event) => editor.setField('name', event.target.value)}
              />
            </label>
            <label>
              도메인
              <input
                name="domain"
                value={editor.fields.domain}
                maxLength={200}
                required
                placeholder="example.com"
                onChange={(event) => editor.setField('domain', event.target.value)}
              />
            </label>
            <label>
              플랫폼 유형
              <select
                value={editor.fields.category}
                onChange={(event) => editor.setCategory(event.target.value as CategoryId)}
              >
                {editor.categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              설명
              <textarea
                name="description"
                rows={4}
                maxLength={500}
                value={editor.fields.description}
                onChange={(event) => editor.setField('description', event.target.value)}
              />
            </label>
          </div>
        )}
        {editor.error && (
          <p className={styles.error} role="alert">
            {editor.error}
          </p>
        )}
        <footer className={styles['dialog-actions']}>
          <Button variant="secondary" onClick={onClose}>
            취소
          </Button>
          <Button type="submit" className={mode === 'delete' ? styles.danger : ''}>
            {mode === 'delete' ? '삭제 확인' : mode === 'add' ? '추가' : '저장'}
          </Button>
        </footer>
      </form>
    </dialog>
  );
}
