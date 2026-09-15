import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse?.json({ user: null }, { status: 200 });
    }

    // Always re-fetch from DB — never trust the role stored in the session cookie
    const user = await prisma?.user?.findUnique({
      where: { id: session?.user?.id },
      select: { id: true, name: true, email: true, role: true, status: true },
    });

    if (!user || user?.status !== 'ACTIVE') {
      await session?.destroy();
      return NextResponse?.json({ user: null }, { status: 200 });
    }

    return NextResponse?.json({
      user: {
        id: user?.id,
        name: user?.name,
        email: user?.email,
        role: user?.role,
        // passwordHash is intentionally excluded
      },
    });
  } catch (err) {
    console.error('[AUTH ME ERROR]', err);
    return NextResponse?.json({ user: null }, { status: 200 });
  }
}
