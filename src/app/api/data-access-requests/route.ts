import { NextRequest, NextResponse } from 'next/server';
import { parseDataAccessRequest, RequestValidationError } from '@/lib/data-access-request';
import { RequestLimitError, saveDataAccessRequest } from '@/lib/supabase/data-access-requests';

export const runtime = 'nodejs';
const MAX_BODY_BYTES = 24_000;

function reply(body: object, status: number) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

async function readBody(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) throw new RequestValidationError('요청 내용이 없습니다.');
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY_BYTES) {
        await reader.cancel();
        throw new RequestValidationError('요청 내용이 너무 깁니다.');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown;
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  // NextURL normalizes loopback IPs to localhost; use the actual HTTP Host for CSRF checks.
  const expectedOrigin = new URL(request.url);
  const host = request.headers.get('host');
  if (host) expectedOrigin.host = host;
  if (
    !origin ||
    origin !== expectedOrigin.origin ||
    request.headers.get('sec-fetch-site') === 'cross-site'
  )
    return reply({ error: '이 페이지에서 요청서를 작성해 주세요.' }, 403);
  if (request.headers.get('content-type')?.split(';')[0].trim() !== 'application/json')
    return reply({ error: '요청 형식이 올바르지 않습니다.' }, 415);
  if (Number(request.headers.get('content-length')) > MAX_BODY_BYTES)
    return reply({ error: '요청 내용이 너무 깁니다.' }, 413);

  let input;
  try {
    input = parseDataAccessRequest(await readBody(request));
  } catch (error) {
    return reply(
      {
        error:
          error instanceof RequestValidationError ? error.message : '요청 내용을 확인해 주세요.',
      },
      400,
    );
  }

  try {
    await saveDataAccessRequest(input);
    return reply({ id: input.id }, 201);
  } catch (error) {
    if (error instanceof RequestLimitError)
      return reply({ error: '잠시 후 다시 신청해 주세요.' }, 429);
    // Never include database errors, submitted contact details, or credentials in the response.
    return reply({ error: '신청을 보내지 못했습니다. 잠시 후 다시 시도해 주세요.' }, 503);
  }
}
