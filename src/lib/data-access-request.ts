export const requestFieldLimits = {
  full_name: 100,
  organization: 200,
  reply_email: 320,
  requested_data: 2000,
  usage_purpose: 2000,
} as const;

// public.openweb_requests insert fields; created_at is assigned by the database.
export type DataAccessRequest = {
  id: string;
  full_name: string;
  organization: string | null;
  reply_email: string;
  requested_data: string;
  usage_purpose: string;
  contact_consent: true;
};

export class RequestValidationError extends Error {}

export function parseDataAccessRequest(value: unknown): DataAccessRequest {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new RequestValidationError('요청 내용을 확인해 주세요.');
  const row = value as Record<string, unknown>;
  if (
    typeof row.id !== 'string' ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(row.id)
  )
    throw new RequestValidationError('요청을 새로 작성해 주세요.');

  function field(key: keyof typeof requestFieldLimits, label: string, optional = false) {
    const raw = row[key];
    if (optional && (raw === undefined || raw === null)) return '';
    if (typeof raw !== 'string') throw new RequestValidationError(`${label} 항목을 확인해 주세요.`);
    const text = raw.trim();
    if ((!optional && !text) || text.length > requestFieldLimits[key] || text.includes('\0'))
      throw new RequestValidationError(`${label} 항목을 확인해 주세요.`);
    return text;
  }

  const full_name = field('full_name', '이름');
  const organization = field('organization', '소속', true) || null;
  const reply_email = field('reply_email', '회신 이메일');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(reply_email))
    throw new RequestValidationError('회신 이메일을 확인해 주세요.');
  const requested_data = field('requested_data', '필요한 자료');
  const usage_purpose = field('usage_purpose', '이용 목적');
  if (row.contact_consent !== true)
    throw new RequestValidationError('연락처와 요청 내용 전달에 동의해 주세요.');

  return {
    id: row.id,
    full_name,
    organization,
    reply_email,
    requested_data,
    usage_purpose,
    contact_consent: true,
  };
}
