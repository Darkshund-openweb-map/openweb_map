import { NextRequest, NextResponse } from 'next/server';
import { createAdminSession, verifyAdminCredentials, verifyAdminSession } from '@/lib/admin-session';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace(/^Bearer /, '') ?? null;
  try {
    return NextResponse.json({ authenticated: verifyAdminSession(token) });
  } catch {
    return NextResponse.json({ authenticated: false });
  }
}

export async function POST(request: NextRequest) {
  let id: unknown;
  let password: unknown;
  try {
    ({ id, password } = await request.json());
  } catch {
    return NextResponse.json({ error: '아이디와 비밀번호를 입력해 주세요.' }, { status: 400 });
  }
  if (typeof id !== 'string' || typeof password !== 'string' || !id || !password)
    return NextResponse.json({ error: '아이디와 비밀번호를 입력해 주세요.' }, { status: 400 });
  try {
    if (!verifyAdminCredentials(id, password))
      return NextResponse.json({ error: '아이디 또는 비밀번호가 올바르지 않습니다.' }, { status: 401 });
    return NextResponse.json({ token: createAdminSession() });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '관리자 설정을 확인해 주세요.' },
      { status: 503 },
    );
  }
}
