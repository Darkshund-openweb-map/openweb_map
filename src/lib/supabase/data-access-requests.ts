import 'server-only';

import type { DataAccessRequest } from '../data-access-request';
import { adminRequest } from './admin-rest';

export class RequestLimitError extends Error {}

export async function saveDataAccessRequest(input: DataAccessRequest) {
  const filters = new URLSearchParams({
    select: 'id',
    reply_email: `eq.${input.reply_email}`,
    created_at: `gte.${new Date(Date.now() - 15 * 60 * 1000).toISOString()}`,
    id: `neq.${input.id}`,
    limit: '3',
  });
  const recent = await adminRequest(`openweb_requests?${filters}`, { method: 'GET' });
  if (!Array.isArray(recent)) throw new Error('Invalid request limit response');
  if (recent.length >= 3) throw new RequestLimitError();

  // Reusing the UUID on a retry cannot overwrite or duplicate an accepted request.
  const inserted = await adminRequest('openweb_requests?on_conflict=id&select=id', {
    method: 'POST',
    headers: { Prefer: 'resolution=ignore-duplicates,return=representation' },
    body: JSON.stringify(input),
  });
  if (!Array.isArray(inserted)) throw new Error('Invalid request insert response');
}
