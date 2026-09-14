import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, isNextResponse } from '@/lib/rbac';

async function hashPw(password: string): Promise<string> {
  const bcrypt = await import('bcryptjs');
  const mod = (bcrypt as any).default ?? bcrypt;
  return mod.hash(password, 12);
}

export async function GET() {
  const authResult = await requireAdmin();
  if (isNextResponse(authResult)) return authResult;

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
    return NextResponse.json({ users });
  } catch (err) {
    console.error('[GET USERS ERROR]', err);
    return NextResponse.json({ error: 'Failed to fetch users.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authResult = await requireAdmin();
  if (isNextResponse(authResult)) return authResult;

  try {
    const body = await req.json();
    const { name, email, password, role, status } = body as {
      name?: string;
      email?: string;
      password?: string;
      role?: string;
      status?: string;
    };

    if (!name?.trim()) return NextResponse.json({ error: 'Name is required.' }, { status: 400 });
    if (!email?.trim()) return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    if (!password?.trim()) return NextResponse.json({ error: 'Password is required.' }, { status: 400 });
    if (password.length < 6) return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 });

    const validRoles = ['ADMIN', 'MANAGER', 'FIELD_TECHNICIAN'];
    const normalizedRole = role ?? 'FIELD_TECHNICIAN';
    if (!validRoles.includes(normalizedRole)) {
      return NextResponse.json({ error: 'Invalid role.' }, { status: 400 });
    }

    const normalizedStatus = status ?? 'ACTIVE';
    if (!['ACTIVE', 'INACTIVE'].includes(normalizedStatus)) {
      return NextResponse.json({ error: 'Invalid status.' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (existing) {
      return NextResponse.json({ error: 'Email already exists.' }, { status: 409 });
    }

    const passwordHash = await hashPw(password);

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

    return NextResponse.json({ user }, { status: 201 });
  } catch (err) {
    console.error('[CREATE USER ERROR]', err);
    return NextResponse.json({ error: 'Unable to create user.' }, { status: 500 });
  }
}
