import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const serviceTypes = await prisma.serviceType.findMany({ orderBy: { serviceType: 'asc' } });
    return NextResponse.json(serviceTypes);
  } catch (err: unknown) {
    console.error('[SERVICE TYPES GET ERROR]', err);
    return NextResponse.json({ error: 'Failed to fetch service types' }, { status: 500 });
  }
}
