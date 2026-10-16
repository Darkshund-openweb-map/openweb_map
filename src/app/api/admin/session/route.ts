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
  const failed = () =>
    NextResponse.json({ error: '로그인에 실패했습니다.' }, { status: 401 });
  let id: unknown;
  let password: unknown;
  try {
    ({ id, password } = await request.json());
  } catch {
    return failed();
  }
  if (typeof id !== 'string' || typeof password !== 'string' || !id || !password)
    return failed();
  try {
    if (!verifyAdminCredentials(id, password)) return failed();
    return NextResponse.json({ token: createAdminSession() });
  } catch {
    return failed();
  }
}
