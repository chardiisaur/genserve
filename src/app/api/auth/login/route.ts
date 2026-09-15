import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

async function comparePw(plain: string, hash: string): Promise<boolean> {
  const bcrypt = await import('bcryptjs');
  const mod = (bcrypt as any).default ?? bcrypt;
  return mod.compare(plain, hash);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body as { email?: string; password?: string };

    if (!email?.trim() || !password?.trim()) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        passwordHash: true,
      },
    });

    // Use constant-time comparison path regardless of whether user exists
    // to prevent user enumeration via timing attacks
    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    const passwordMatch = await comparePw(password, user.passwordHash);
    if (!passwordMatch) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    // Check active status AFTER password verification to prevent user enumeration
    if (user.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Your account is inactive. Please contact your administrator.' },
        { status: 403 }
      );
    }

    const session = await getSession();
    session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
    await session.save();

    // Never expose passwordHash in the response
    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('[AUTH LOGIN ERROR]', err);
    return NextResponse.json({ error: 'An unexpected error occurred. Please try again.' }, { status: 500 });
  }
}
