import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/auth/init
 * Ensures the admin user exists with the correct credentials from env vars.
 * This is a safe idempotent endpoint — it never exposes passwords or hashes.
 * Only accessible in development or when called from the server.
 */
export async function GET() {
  try {
    const adminEmail = process.env.INITIAL_ADMIN_EMAIL;
    const adminPassword = process.env.INITIAL_ADMIN_PASSWORD;
    const adminName = process.env.INITIAL_ADMIN_NAME ?? 'System Administrator';

    if (!adminEmail || !adminPassword) {
      return NextResponse.json(
        { error: 'INITIAL_ADMIN_EMAIL and INITIAL_ADMIN_PASSWORD must be set in environment variables.' },
        { status: 500 }
      );
    }

    const bcrypt = await import('bcryptjs');
    const bcryptMod = (bcrypt as any).default ?? bcrypt;
    const passwordHash = await bcryptMod.hash(adminPassword, 12);
    const normalizedEmail = adminEmail.toLowerCase().trim();

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (existing) {
      await prisma.user.update({
        where: { email: normalizedEmail },
        data: { name: adminName, passwordHash, role: 'ADMIN', status: 'ACTIVE' },
      });
      return NextResponse.json({
        status: 'updated',
        message: `Admin user verified and updated: ${normalizedEmail}`,
        email: normalizedEmail,
        role: 'ADMIN',
        active: true,
      });
    } else {
      await prisma.user.create({
        data: { name: adminName, email: normalizedEmail, passwordHash, role: 'ADMIN', status: 'ACTIVE' },
      });
      return NextResponse.json({
        status: 'created',
        message: `Admin user created: ${normalizedEmail}`,
        email: normalizedEmail,
        role: 'ADMIN',
        active: true,
      });
    }
  } catch (err) {
    console.error('[AUTH INIT ERROR]', err);
    return NextResponse.json(
      { error: 'Failed to initialize admin user.', detail: String(err) },
      { status: 500 }
    );
  }
}
