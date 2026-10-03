import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/admin-session';
import {
  createPlatform,
  deletePlatform,
  parsePlatformInput,
  updatePlatform,
} from '@/lib/supabase/admin-rest';

export const runtime = 'nodejs';

function platformId(value: unknown) {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0 ? value : null;
}

async function mutate(request: NextRequest, mode: 'add' | 'edit' | 'delete') {
  if (process.env.ECOSYSTEM_DATA_SOURCE === 'fixture')
    return NextResponse.json(
      { error: '테스트 데이터는 DB에 저장할 수 없습니다.' },
      { status: 403 },
    );
  const token = request.headers.get('authorization')?.replace(/^Bearer /, '') ?? null;
  try {
    if (!verifyAdminSession(token))
      return NextResponse.json({ error: '관리자 로그인이 필요합니다.' }, { status: 401 });
    const body = await request.json();
    const id = platformId(body?.id);
    if (mode !== 'add' && !id)
      return NextResponse.json({ error: '플랫폼 ID가 올바르지 않습니다.' }, { status: 400 });
    if (mode === 'delete') {
      await deletePlatform(id!);
      return NextResponse.json({ ok: true });
    }
    const input = await parsePlatformInput(body);
    if (mode === 'add')
      return NextResponse.json({ id: await createPlatform(input) }, { status: 201 });
    await updatePlatform(id!, input);
    return NextResponse.json({ id });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '요청을 처리하지 못했습니다.' },
      { status: 400 },
    );
  }
}

export const POST = (request: NextRequest) => mutate(request, 'add');
export const PATCH = (request: NextRequest) => mutate(request, 'edit');
export const DELETE = (request: NextRequest) => mutate(request, 'delete');
