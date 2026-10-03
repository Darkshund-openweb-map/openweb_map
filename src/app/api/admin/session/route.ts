import { NextRequest, NextResponse } from 'next/server';
import { createAdminSession, verifyAdminPin, verifyAdminSession } from '@/lib/admin-session';

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
  let pin: unknown;
  try {
    pin = (await request.json()).pin;
  } catch {
    return NextResponse.json({ error: 'PIN을 입력해 주세요.' }, { status: 400 });
  }
  if (typeof pin !== 'string')
    return NextResponse.json({ error: 'PIN을 확인해 주세요.' }, { status: 400 });
  try {
    if (!verifyAdminPin(pin))
      return NextResponse.json({ error: 'PIN이 올바르지 않습니다.' }, { status: 401 });
    return NextResponse.json({ token: createAdminSession() });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '관리자 설정을 확인해 주세요.' },
      { status: 503 },
    );
  }
}
