import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, isNextResponse } from '@/lib/rbac';

async function hashPw(password: string): Promise<string> {
  const bcrypt = await import('bcryptjs');
  const mod = (bcrypt as any).default ?? bcrypt;
  return mod.hash(password, 12);
}

export async function GET() {
  console.log('[GET /api/users] Request received');
  const authResult = await requireAdmin();
  if (isNextResponse(authResult)) {
    console.warn('[GET /api/users] Auth failed — not admin');
    return authResult;
  }
  console.log('[GET /api/users] Auth OK — user:', authResult.id, authResult.role);

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });
    console.log('[GET /api/users] Returning', users.length, 'users');
    return NextResponse.json({ users });
  } catch (err) {
    console.error('[GET /api/users] Database error:', err);
    return NextResponse.json({ error: 'Failed to fetch users.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  console.log('[POST /api/users] Request received');
  const authResult = await requireAdmin();
  if (isNextResponse(authResult)) {
    console.warn('[POST /api/users] Auth failed — not admin');
    return authResult;
  }
  console.log('[POST /api/users] Auth OK — user:', authResult.id);

  let body: unknown;
  try {
    body = await req.json();
  } catch (err) {
    console.error('[POST /api/users] Failed to parse request body:', err);
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const { name, email, password, role, status } = body as {
    name?: string;
    email?: string;
    password?: string;
    role?: string;
    status?: string;
  };

  console.log('[POST /api/users] Body received:', { name, email, role, status, password: password ? '[REDACTED]' : undefined });

  if (!name?.trim()) {
    console.warn('[POST /api/users] Validation failed: name is required');
    return NextResponse.json({ error: 'Name is required.' }, { status: 400 });
  }
  if (!email?.trim()) {
    console.warn('[POST /api/users] Validation failed: email is required');
    return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
  }
  if (!password?.trim()) {
    console.warn('[POST /api/users] Validation failed: password is required');
    return NextResponse.json({ error: 'Password is required.' }, { status: 400 });
  }
  if (password.length < 6) {
    console.warn('[POST /api/users] Validation failed: password too short');
    return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 });
  }

  const validRoles = ['ADMIN', 'MANAGER', 'FIELD_TECHNICIAN'];
  const normalizedRole = role ?? 'FIELD_TECHNICIAN';
  if (!validRoles.includes(normalizedRole)) {
    console.warn('[POST /api/users] Validation failed: invalid role:', normalizedRole);
    return NextResponse.json({ error: 'Invalid role.' }, { status: 400 });
  }

  const normalizedStatus = status ?? 'ACTIVE';
  if (!['ACTIVE', 'INACTIVE'].includes(normalizedStatus)) {
    console.warn('[POST /api/users] Validation failed: invalid status:', normalizedStatus);
    return NextResponse.json({ error: 'Invalid status.' }, { status: 400 });
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (existing) {
      console.warn('[POST /api/users] Email conflict:', email);
      return NextResponse.json({ error: 'Email already exists.' }, { status: 409 });
    }

    console.log('[POST /api/users] Hashing password...');
    const passwordHash = await hashPw(password);

    console.log('[POST /api/users] Creating user in database...');
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
        role: normalizedRole,
        status: normalizedStatus,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    console.log('[POST /api/users] User created successfully:', user.id, user.email);
    return NextResponse.json({ user }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/users] Database error:', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Failed to create user: ${message}` }, { status: 500 });
  }
}
