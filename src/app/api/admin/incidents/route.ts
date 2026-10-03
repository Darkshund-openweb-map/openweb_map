import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/admin-session';
import {
  deleteIncident,
  loadIncidentEditorData,
  parseIncidentMutation,
  saveIncident,
} from '@/lib/supabase/admin-incidents';

export const runtime = 'nodejs';

function authorized(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace(/^Bearer /, '') ?? null;
  try {
    return verifyAdminSession(token);
  } catch {
    return false;
  }
}

function positiveId(value: unknown) {
  const number = typeof value === 'string' ? Number(value) : value;
  return typeof number === 'number' && Number.isSafeInteger(number) && number > 0 ? number : null;
}

export async function GET(request: NextRequest) {
  if (!authorized(request))
    return NextResponse.json({ error: '관리자 로그인이 필요합니다.' }, { status: 401 });
  const platformId = positiveId(request.nextUrl.searchParams.get('platformId'));
  if (!platformId)
    return NextResponse.json({ error: '플랫폼 ID가 올바르지 않습니다.' }, { status: 400 });
  try {
    return NextResponse.json(await loadIncidentEditorData(platformId));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '데이터를 읽지 못했습니다.' },
      { status: 502 },
    );
  }
}

async function save(request: NextRequest, mode: 'add' | 'edit') {
  if (!authorized(request))
    return NextResponse.json({ error: '관리자 로그인이 필요합니다.' }, { status: 401 });
  let input: ReturnType<typeof parseIncidentMutation>;
  try {
    input = parseIncidentMutation(await request.json());
    if ((mode === 'add' && input.incidentId) || (mode === 'edit' && !input.incidentId))
      throw new Error('사건 ID가 올바르지 않습니다.');
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '입력값이 올바르지 않습니다.' },
      { status: 400 },
    );
  }
  try {
    return NextResponse.json(
      { id: await saveIncident(input) },
      { status: mode === 'add' ? 201 : 200 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '저장하지 못했습니다.' },
      { status: 502 },
    );
  }
}

export const POST = (request: NextRequest) => save(request, 'add');
export const PATCH = (request: NextRequest) => save(request, 'edit');

export async function DELETE(request: NextRequest) {
  if (!authorized(request))
    return NextResponse.json({ error: '관리자 로그인이 필요합니다.' }, { status: 401 });
  let platformId: number | null;
  let incidentId: number | null;
  try {
    const body = await request.json();
    platformId = positiveId(body.platformId);
    incidentId = positiveId(body.incidentId);
  } catch {
    return NextResponse.json({ error: '입력값이 올바르지 않습니다.' }, { status: 400 });
  }
  if (!platformId || !incidentId)
    return NextResponse.json({ error: '사건 ID가 올바르지 않습니다.' }, { status: 400 });
  try {
    await deleteIncident(platformId, incidentId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '삭제하지 못했습니다.' },
      { status: 502 },
    );
  }
}
