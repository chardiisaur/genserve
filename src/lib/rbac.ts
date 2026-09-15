import { NextResponse } from 'next/server';
import { getSession, SessionUser } from './session';
import { prisma } from './prisma';

export const ROLES = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  FIELD_TECHNICIAN: 'FIELD_TECHNICIAN',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

/**
 * Verify the session server-side and return the live user from the database.
 * NEVER trust role information from the browser — always read from the session
 * and re-validate against the database.
 */
async function getVerifiedSessionUser(): Promise<SessionUser | null> {
  const session = await getSession();
  if (!session.user) return null;

  // Re-fetch from DB to get the authoritative role and status.
  // This prevents privilege escalation if a user's role was changed after login.
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, role: true, status: true },
  });

  if (!dbUser || dbUser.status !== 'ACTIVE') {
    // User was deactivated or deleted — destroy the stale session
    await session.destroy();
    return null;
  }

  // Return the authoritative DB role, not the one stored in the session cookie
  return {
    id: dbUser.id,
    name: dbUser.name,
    email: dbUser.email,
    role: dbUser.role,
  };
}

/**
 * Require any authenticated, active user.
 * Returns the verified SessionUser or a 401 NextResponse.
 */
export async function requireAuth(): Promise<SessionUser | NextResponse> {
  const user = await getVerifiedSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return user;
}

/**
 * Require ADMIN role.
 * Returns the verified SessionUser or a 401/403 NextResponse.
 */
export async function requireAdmin(): Promise<SessionUser | NextResponse> {
  const user = await getVerifiedSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (user.role !== ROLES.ADMIN) {
    return NextResponse.json({ error: 'Forbidden — Admin access required' }, { status: 403 });
  }
  return user;
}

/**
 * Require ADMIN or MANAGER role.
 * FIELD_TECHNICIAN cannot perform operational management mutations.
 * Returns the verified SessionUser or a 401/403 NextResponse.
 */
export async function requireManagerOrAbove(): Promise<SessionUser | NextResponse> {
  const user = await getVerifiedSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (user.role !== ROLES.ADMIN && user.role !== ROLES.MANAGER) {
    return NextResponse.json(
      { error: 'Forbidden — Manager or Admin access required' },
      { status: 403 }
    );
  }
  return user;
}

/**
 * Type guard: check if a value is a NextResponse (auth failure).
 */
export function isNextResponse(val: unknown): val is NextResponse {
  return val instanceof NextResponse;
}
