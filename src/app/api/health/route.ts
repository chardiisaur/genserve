import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// This endpoint checks if the DB is initialized and returns basic stats
export async function GET() {
  try {
    const [clients, jobs, parts, technicians] = await Promise.all([
      prisma.client.count(),
      prisma.serviceJob.count(),
      prisma.partInventory.count(),
      prisma.technician.count(),
    ]);
    return NextResponse.json({
      status: 'ok',
      database: 'SQLite (local)',
      counts: { clients, jobs, parts, technicians },
    });
  } catch {
    return NextResponse.json({ status: 'error', message: 'Database not initialized. Run: npm run db:setup' }, { status: 503 });
  }
}
