import { NextRequest, NextResponse } from 'next/server';
import {
  consumeLoginAttempt,
  createAdminSession,
  revokeAdminSession,
  verifyAdminCredentials,
  verifyAdminSession,
} from '@/lib/admin-session';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace(/^Bearer /, '') ?? null;
  try {
    return NextResponse.json({ authenticated: await verifyAdminSession(token) });
  } catch {
    return NextResponse.json({ authenticated: false });
  }
}

export async function POST(request: NextRequest) {
  const failed = () => NextResponse.json({ error: '로그인에 실패했습니다.' }, { status: 401 });
  try {
    if (!(await consumeLoginAttempt(request.headers.get('x-vercel-forwarded-for'))))
      return NextResponse.json({ error: '로그인에 실패했습니다.' }, { status: 429 });
  } catch {
    return NextResponse.json({ error: '로그인에 실패했습니다.' }, { status: 503 });
  }
  let id: unknown;
  let password: unknown;
  try {
    ({ id, password } = await request.json());
  } catch {
    return failed();
  }
  if (typeof id !== 'string' || typeof password !== 'string' || !id || !password) return failed();
  try {
    if (!verifyAdminCredentials(id, password)) return failed();
    return NextResponse.json({ token: createAdminSession() });
  } catch {
    return failed();
  }
}

export async function DELETE(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace(/^Bearer /, '') ?? null;
  try {
    if (!(await revokeAdminSession(token)))
      return NextResponse.json({ error: '요청을 처리하지 못했습니다.' }, { status: 401 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: '요청을 처리하지 못했습니다.' }, { status: 503 });
  }
}
