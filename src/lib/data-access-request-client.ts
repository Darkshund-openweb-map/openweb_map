import type { DataAccessRequest } from './data-access-request';

export async function submitDataAccessRequest(input: DataAccessRequest) {
  const response = await fetch('/api/data-access-requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
    cache: 'no-store',
    signal: AbortSignal.timeout(20_000),
  });
  const result = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 429)
      throw new Error('신청이 여러 번 접수되었습니다. 잠시 후 다시 시도해 주세요.');
    throw new Error('신청을 보내지 못했습니다. 입력 내용을 확인한 뒤 다시 시도해 주세요.');
  }
  if (result?.id !== input.id)
    throw new Error('접수 결과를 확인하지 못했습니다. 다시 시도해 주세요.');
}
