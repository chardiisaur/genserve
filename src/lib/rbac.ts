import { NextResponse } from 'next/server';
import { getSession, SessionUser } from './session';

export const ROLES = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  FIELD_TECHNICIAN: 'FIELD_TECHNICIAN',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export async function requireAuth(): Promise<SessionUser | NextResponse> {
  const session = await getSession();
  if (!session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return session.user;
}

export async function requireAdmin(): Promise<SessionUser | NextResponse> {
  const session = await getSession();
  if (!session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (session.user.role !== ROLES.ADMIN) {
    return NextResponse.json({ error: 'Forbidden — Admin access required' }, { status: 403 });
  }
  return session.user;
}

export function isNextResponse(val: unknown): val is NextResponse {
  return val instanceof NextResponse;
}
