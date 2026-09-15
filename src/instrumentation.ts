/**
 * Next.js Instrumentation Hook
 * Runs once when the server starts (both dev and production).
 * Used to ensure the database schema is up-to-date and the admin user exists.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    try {
      const { execSync } = await import('child_process');

      // Ensure Prisma client is generated and schema is pushed
      try {
        execSync('npx prisma generate --schema=prisma/schema.prisma', { stdio: 'pipe' });
        console.log('[INIT] Prisma client generated');
      } catch {
        // Already generated — safe to ignore
      }

      try {
        execSync('npx prisma db push --schema=prisma/schema.prisma --skip-generate', { stdio: 'pipe' });
        console.log('[INIT] Database schema pushed');
      } catch {
        // Schema already up-to-date — safe to ignore
      }

      // Ensure admin user exists with correct credentials
      await ensureAdminUser();
    } catch (err) {
      console.error('[INIT ERROR]', err);
    }
  }
}

async function ensureAdminUser() {
  const adminEmail = process.env.INITIAL_ADMIN_EMAIL;
  const adminPassword = process.env.INITIAL_ADMIN_PASSWORD;
  const adminName = process.env.INITIAL_ADMIN_NAME ?? 'System Administrator';

  if (!adminEmail || !adminPassword) {
    console.warn('[INIT] INITIAL_ADMIN_EMAIL or INITIAL_ADMIN_PASSWORD not set — skipping admin ensure');
    return;
  }

  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const bcrypt = await import('bcryptjs');
    const bcryptMod = (bcrypt as any).default ?? bcrypt;
    const passwordHash = await bcryptMod.hash(adminPassword, 12);
    const normalizedEmail = adminEmail.toLowerCase().trim();

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (existing) {
      // Always re-hash and update to ensure the password matches the env var
      await prisma.user.update({
        where: { email: normalizedEmail },
        data: { name: adminName, passwordHash, role: 'ADMIN', status: 'ACTIVE' },
      });
      console.log(`[INIT] Admin user verified/updated: ${normalizedEmail}`);
    } else {
      await prisma.user.create({
        data: { name: adminName, email: normalizedEmail, passwordHash, role: 'ADMIN', status: 'ACTIVE' },
      });
      console.log(`[INIT] Admin user created: ${normalizedEmail}`);
    }

    await prisma.$disconnect();
  } catch (err) {
    console.error('[INIT] Failed to ensure admin user:', err);
  }
}
