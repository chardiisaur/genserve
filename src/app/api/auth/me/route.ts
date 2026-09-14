import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse?.json({ user: null }, { status: 200 });
    }

    // Refresh from DB to get latest name/role
    const user = await prisma?.user?.findUnique({ where: { id: session?.user?.id } });
    if (!user || user?.status !== 'ACTIVE') {
      session?.destroy();
      return NextResponse?.json({ user: null }, { status: 200 });
    }

    return NextResponse?.json({
      user: {
        id: user?.id,
        name: user?.name,
        email: user?.email,
        role: user?.role,
      },
    });
  } catch (err) {
    console.error('[AUTH ME ERROR]', err);
    return NextResponse?.json({ user: null }, { status: 200 });
  }
}
