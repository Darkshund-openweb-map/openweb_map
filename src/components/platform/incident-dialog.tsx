'use client';

import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import type { Platform } from '@/lib/ecosystem-types';
import type {
  IncidentDataType,
  IncidentEditorData,
  IncidentEditorRecord,
  IncidentFields,
  PlatformConnectionInput,
} from '@/lib/incident-editor-types';
import { useAdmin } from '@/hooks/use-admin';
import { Button } from '@/components/button/button';
import { ExposureCategorySelect } from './exposure-category-select';
import styles from '@/styles/platform-editor.module.css';

export type IncidentMode = 'add' | 'edit' | 'delete';
type Step = 'select' | 'incident' | 'types' | 'connections' | 'connection-details' | 'confirm';

const emptyIncident: IncidentFields = {
  title: '',
  sourceUrl: '',
  summary: '',
  riskLevel: '',
  status: '검토중',
  publishedAt: '',
};

const emptyType = (): IncidentDataType => ({ name: '', category: '', description: '' });
const emptyConnection = (): PlatformConnectionInput => ({
  targetPlatformId: 0,
  connectionType: '',
  description: '',
  verificationStatus: 'candidate',
  confidence: '미평가',
  evidenceCount: 0,
  firstSeen: '',
  lastSeen: '',
});

export function IncidentDialog({
  platform,
  mode,
  onClose,
}: {
  platform: Platform;
  mode: IncidentMode;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const router = useRouter();
  const { token } = useAdmin();
  const platformId = Number(platform.id.replace(/^platform-/, ''));
  const [step, setStep] = useState<Step>(mode === 'add' ? 'incident' : 'select');
  const [data, setData] = useState<IncidentEditorData | null>(null);
  const [selected, setSelected] = useState<IncidentEditorRecord | null>(null);
  const [incident, setIncident] = useState<IncidentFields>(emptyIncident);
  const [dataTypes, setDataTypes] = useState<IncidentDataType[]>([]);
  const [connections, setConnections] = useState<PlatformConnectionInput[]>([]);
  const [hasConnections, setHasConnections] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);

  useEffect(() => {
    if (!token || !Number.isSafeInteger(platformId)) return;
    let active = true;
    fetch(`/api/admin/incidents?platformId=${platformId}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error ?? '사건 목록을 불러오지 못했습니다.');
        return result as IncidentEditorData;
      })
      .then((result) => {
        if (!active) return;
        setData(result);
      })
      .catch((cause) => {
        if (active)
          setError(cause instanceof Error ? cause.message : '사건 목록을 불러오지 못했습니다.');
      });
    return () => {
      active = false;
    };
  }, [platformId, token]);

  const choose = (record: IncidentEditorRecord) => {
    setSelected(record);
    setIncident({
      title: record.title,
      sourceUrl: record.sourceUrl,
      summary: record.summary,
      riskLevel: record.riskLevel,
      status: record.status,
      publishedAt: record.publishedAt,
    });
    setDataTypes(record.dataTypes);
    setConnections(record.connections);
    setHasConnections(record.connections.length > 0);
    setStep(mode === 'delete' ? 'confirm' : 'incident');
    setError('');
  };

  const request = async (method: 'POST' | 'PATCH' | 'DELETE', payload: object) => {
    if (!token) throw new Error('관리자 로그인이 필요합니다.');
    const response = await fetch('/api/admin/incidents', {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error ?? '요청을 처리하지 못했습니다.');
    router.refresh();
    onClose();
  };

  const save = async (includeConnections: boolean) => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await request(mode === 'add' ? 'POST' : 'PATCH', {
        platformId,
        incidentId: selected?.id ?? null,
        incident,
        dataTypes,
        connections: includeConnections ? connections : null,
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '저장하지 못했습니다.');
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!selected || busy) return;
    setBusy(true);
    setError('');
    try {
      await request('DELETE', { platformId, incidentId: selected.id });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '삭제하지 못했습니다.');
    } finally {
      setBusy(false);
    }
  };

  const next = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    if (step === 'incident') setStep('types');
    else if (step === 'types') setStep('connections');
    else if (step === 'connection-details') void save(true);
  };

  const title = mode === 'add' ? '사건 추가' : mode === 'edit' ? '사건 수정' : '사건 삭제';

  return (
    <dialog
      ref={dialog}
      className={[styles.dialog, styles['incident-dialog']].join(' ')}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <header className={styles.heading}>
        <h2 id={titleId}>
          {platform.name} · {title}
        </h2>
        <button type="button" onClick={onClose} aria-label="닫기">
          ×
        </button>
      </header>
      <p className={styles.hint}>
        {step === 'select'
          ? '이 플랫폼의 사건을 선택해 주세요.'
          : step === 'incident'
            ? '1 / 3 · incidents'
            : step === 'types'
              ? '2 / 3 · incidents_data_types'
              : step === 'connections' || step === 'connection-details'
                ? '3 / 3 · platform_connections'
                : '선택한 사건을 삭제합니다.'}
      </p>

      {!data && !error && <p className={styles.hint}>데이터를 불러오는 중입니다…</p>}

      {step === 'select' && data && (
        <div className={styles['record-list']}>
          {data.incidents.map((record) => (
            <button key={record.id} type="button" onClick={() => choose(record)}>
              <strong>{record.title}</strong>
              <span>
                {record.publishedAt || '날짜 없음'} · {record.status} · 노출 유형{' '}
                {record.dataTypes.length}개
              </span>
            </button>
          ))}
          {!data.incidents.length && <p>이 플랫폼에 등록된 사건이 없습니다.</p>}
        </div>
      )}

      {step === 'confirm' && selected && (
        <div className={styles['delete-summary']}>
          <p>
            <strong>{selected.title}</strong> 사건을 정말 삭제할까요?
          </p>
          <p>
            사건과 연결된 노출 유형 {selected.dataTypes.length}개를 함께 삭제합니다. 플랫폼 연결은
            유지됩니다.
          </p>
          <footer className={styles['dialog-actions']}>
            <Button variant="secondary" onClick={() => setStep('select')}>
              목록으로
            </Button>
            <Button className={styles.danger} disabled={busy} onClick={() => void remove()}>
              삭제 확인
            </Button>
          </footer>
        </div>
      )}

      {data && (step === 'incident' || step === 'types' || step === 'connection-details') && (
        <form onSubmit={next}>
          {step === 'incident' && (
            <div className={styles.fields}>
              <label>
                사건 제목
                <input
                  required
                  maxLength={200}
                  value={incident.title}
                  onChange={(event) => setIncident({ ...incident, title: event.target.value })}
                />
              </label>
              <label>
                출처 URL
                <input
                  type="url"
                  maxLength={2000}
                  value={incident.sourceUrl}
                  placeholder="https://example.com/article"
                  onChange={(event) => setIncident({ ...incident, sourceUrl: event.target.value })}
                />
              </label>
              <label>
                요약
                <textarea
                  rows={4}
                  maxLength={10000}
                  value={incident.summary}
                  onChange={(event) => setIncident({ ...incident, summary: event.target.value })}
                />
              </label>
              <label>
                위험도
                <select
                  value={incident.riskLevel}
                  onChange={(event) =>
                    setIncident({
                      ...incident,
                      riskLevel: event.target.value as IncidentFields['riskLevel'],
                    })
                  }
                >
                  <option value="">미지정</option>
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="CRITICAL">CRITICAL</option>
                </select>
              </label>
              <label>
                상태
                <select
                  value={incident.status}
                  onChange={(event) =>
                    setIncident({
                      ...incident,
                      status: event.target.value as IncidentFields['status'],
                    })
                  }
                >
                  <option value="검토중">검토중</option>
                  <option value="검토완료">검토완료</option>
                  <option value="보류">보류</option>
                  <option value="삭제">삭제</option>
                </select>
              </label>
              <label>
                게시일
                <input
                  type="date"
                  value={incident.publishedAt}
                  onChange={(event) =>
                    setIncident({ ...incident, publishedAt: event.target.value })
                  }
                />
              </label>
            </div>
          )}

          {step === 'types' && (
            <div className={styles['repeat-section']}>
              <p>
                노출 정보 유형은 플랫폼 개요와 통계에 표시됩니다. 기업·제품명은 상세 이름에
                입력하세요. 연결할 유형이 없으면 다음으로 진행하세요.
              </p>
              {dataTypes.map((row, index) => (
                <div key={row.id ?? `new-${index}`} className={styles['repeat-card']}>
                  <div className={styles['repeat-heading']}>
                    <strong>노출 유형 {index + 1}</strong>
                    <button
                      type="button"
                      onClick={() => setDataTypes(dataTypes.filter((_, i) => i !== index))}
                    >
                      제거
                    </button>
                  </div>
                  <div className={styles.fields}>
                    <label>
                      상세 이름
                      <input
                        required
                        maxLength={200}
                        value={row.name}
                        onChange={(event) =>
                          setDataTypes(
                            dataTypes.map((item, i) =>
                              i === index ? { ...item, name: event.target.value } : item,
                            ),
                          )
                        }
                      />
                    </label>
                    <ExposureCategorySelect
                      value={row.category}
                      onChange={(category) =>
                        setDataTypes(
                          dataTypes.map((item, i) => (i === index ? { ...item, category } : item)),
                        )
                      }
                    />
                    <label>
                      설명
                      <textarea
                        rows={2}
                        maxLength={2000}
                        value={row.description}
                        onChange={(event) =>
                          setDataTypes(
                            dataTypes.map((item, i) =>
                              i === index ? { ...item, description: event.target.value } : item,
                            ),
                          )
                        }
                      />
                    </label>
                  </div>
                </div>
              ))}
              <Button variant="secondary" onClick={() => setDataTypes([...dataTypes, emptyType()])}>
                + 노출 유형 추가
              </Button>
            </div>
          )}

          {step === 'connection-details' && (
            <div className={styles['repeat-section']}>
              <p>
                연결은 현재 편집 중인 <strong>이 사건</strong>에 적용됩니다.
              </p>
              {connections.map((row, index) => (
                <div key={row.id ?? `new-${index}`} className={styles['repeat-card']}>
                  <div className={styles['repeat-heading']}>
                    <strong>플랫폼 연결 {index + 1}</strong>
                    <button
                      type="button"
                      onClick={() => setConnections(connections.filter((_, i) => i !== index))}
                    >
                      제거
                    </button>
                  </div>
                  <div className={styles.fields}>
                    <label>
                      연결 대상
                      <select
                        required
                        value={row.targetPlatformId || ''}
                        onChange={(event) =>
                          setConnections(
                            connections.map((item, i) =>
                              i === index
                                ? { ...item, targetPlatformId: Number(event.target.value) }
                                : item,
                            ),
                          )
                        }
                      >
                        <option value="">플랫폼 선택</option>
                        {data.platforms
                          .filter((item) => item.id !== platformId)
                          .map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name}
                            </option>
                          ))}
                      </select>
                    </label>
                    <label>
                      연결 유형
                      <input
                        required
                        maxLength={200}
                        value={row.connectionType}
                        onChange={(event) =>
                          setConnections(
                            connections.map((item, i) =>
                              i === index ? { ...item, connectionType: event.target.value } : item,
                            ),
                          )
                        }
                      />
                    </label>
                    <label>
                      검증 상태
                      <select
                        value={row.verificationStatus}
                        onChange={(event) =>
                          setConnections(
                            connections.map((item, i) =>
                              i === index
                                ? {
                                    ...item,
                                    verificationStatus: event.target
                                      .value as PlatformConnectionInput['verificationStatus'],
                                  }
                                : item,
                            ),
                          )
                        }
                      >
                        <option value="candidate">검증 대기</option>
                        <option value="verified">검증 완료</option>
                        <option value="excluded">제외</option>
                      </select>
                    </label>
                    <label>
                      신뢰도
                      <select
                        value={row.confidence}
                        onChange={(event) =>
                          setConnections(
                            connections.map((item, i) =>
                              i === index
                                ? {
                                    ...item,
                                    confidence: event.target
                                      .value as PlatformConnectionInput['confidence'],
                                  }
                                : item,
                            ),
                          )
                        }
                      >
                        <option value="미평가">미평가</option>
                        <option value="높음">높음</option>
                        <option value="중간">중간</option>
                        <option value="낮음">낮음</option>
                      </select>
                    </label>
                    <label>
                      관계 레코드 수
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={row.evidenceCount}
                        onChange={(event) =>
                          setConnections(
                            connections.map((item, i) =>
                              i === index
                                ? { ...item, evidenceCount: Number(event.target.value) }
                                : item,
                            ),
                          )
                        }
                      />
                    </label>
                    <label>
                      최초 관측일
                      <input
                        type="date"
                        value={row.firstSeen}
                        onChange={(event) =>
                          setConnections(
                            connections.map((item, i) =>
                              i === index ? { ...item, firstSeen: event.target.value } : item,
                            ),
                          )
                        }
                      />
                    </label>
                    <label>
                      최근 관측일
                      <input
                        type="date"
                        min={row.firstSeen || undefined}
                        value={row.lastSeen}
                        onChange={(event) =>
                          setConnections(
                            connections.map((item, i) =>
                              i === index ? { ...item, lastSeen: event.target.value } : item,
                            ),
                          )
                        }
                      />
                    </label>
                    <label>
                      근거 설명
                      <textarea
                        rows={2}
                        maxLength={2000}
                        value={row.description}
                        onChange={(event) =>
                          setConnections(
                            connections.map((item, i) =>
                              i === index ? { ...item, description: event.target.value } : item,
                            ),
                          )
                        }
                      />
                    </label>
                  </div>
                </div>
              ))}
              <Button
                variant="secondary"
                onClick={() => setConnections([...connections, emptyConnection()])}
              >
                + 연결 추가
              </Button>
            </div>
          )}

          <footer className={styles['dialog-actions']}>
            {step !== 'incident' && (
              <Button
                variant="secondary"
                onClick={() => setStep(step === 'types' ? 'incident' : 'connections')}
              >
                이전
              </Button>
            )}
            <Button type="submit" disabled={busy}>
              {step === 'connection-details' ? '저장' : '다음'}
            </Button>
          </footer>
        </form>
      )}

      {step === 'connections' && data && (
        <div>
          <p className={styles.hint}>
            이 사건의 연결 사항을 함께 작성하거나 수정할까요? 기존 연결 {connections.length}개
          </p>
          <div className={styles['choice-buttons']}>
            <Button
              variant={!hasConnections ? 'primary' : 'secondary'}
              onClick={() => setHasConnections(false)}
            >
              {connections.length ? '연결 변경 없이 저장' : '연결 없음 · 바로 저장'}
            </Button>
            <Button
              variant={hasConnections ? 'primary' : 'secondary'}
              onClick={() => {
                setHasConnections(true);
                if (!connections.length) setConnections([emptyConnection()]);
                setStep('connection-details');
              }}
            >
              있음 · 연결 작성
            </Button>
          </div>
          <footer className={styles['dialog-actions']}>
            <Button variant="secondary" onClick={() => setStep('types')}>
              이전
            </Button>
            {!hasConnections && (
              <Button disabled={busy} onClick={() => void save(false)}>
                저장
              </Button>
            )}
          </footer>
        </div>
      )}

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </dialog>
  );
}
