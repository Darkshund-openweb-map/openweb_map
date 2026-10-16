'use client';

import { useRef, useState, type FormEvent } from 'react';
import { parseDataAccessRequest } from '@/lib/data-access-request';
import { submitDataAccessRequest } from '@/lib/data-access-request-client';

export function useDataAccessRequest() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  const locked = useRef(false);
  const attempt = useRef({ content: '', id: '' });

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (locked.current) return;
    locked.current = true;
    setError('');
    try {
      const form = new FormData(event.currentTarget);
      const value = (key: string) => String(form.get(key) ?? '').trim();
      const fields = {
        full_name: value('full_name'),
        organization: value('organization') || null,
        reply_email: value('reply_email'),
        requested_data: value('requested_data'),
        usage_purpose: value('usage_purpose'),
        contact_consent: form.get('contact_consent') === 'on',
      };
      const content = JSON.stringify(fields);
      if (attempt.current.content !== content)
        attempt.current = { content, id: crypto.randomUUID() };
      const input = parseDataAccessRequest({ ...fields, id: attempt.current.id });
      setStatus('sending');
      await submitDataAccessRequest(input);
      setStatus('success');
    } catch (reason) {
      setStatus('error');
      setError(
        reason instanceof Error && !['TimeoutError', 'TypeError'].includes(reason.name)
          ? reason.message
          : '접수 결과를 확인하지 못했습니다. 연결 상태를 확인한 뒤 다시 시도해 주세요.',
      );
      locked.current = false;
    }
  }

  return { status, error, submit };
}
