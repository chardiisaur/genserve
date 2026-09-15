import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireAdmin, isNextResponse } from '@/lib/rbac';

export async function GET() {
  const auth = await requireAuth();
  if (isNextResponse(auth)) return auth;
  try {
    const serviceTypes = await prisma.serviceType.findMany({ orderBy: { serviceType: 'asc' } });
    return NextResponse.json(serviceTypes);
  } catch (err: unknown) {
    console.error('[SERVICE TYPES GET ERROR]', err);
    return NextResponse.json({ error: 'Failed to fetch service types' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (isNextResponse(auth)) return auth;
  try {
    const body = await req.json();
    if (!body.serviceType?.trim()) {
      return NextResponse.json({ error: 'serviceType is required' }, { status: 400 });
    }
    const serviceTypeId = `st-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const record = await prisma.serviceType.create({
      data: { serviceTypeId, ...body },
    });
    return NextResponse.json(record, { status: 201 });
  } catch (err: unknown) {
    console.error('[SERVICE TYPE CREATE ERROR]', err);
    const code = (err as any)?.code;
    if (code === 'P2002') return NextResponse.json({ error: 'Duplicate record.' }, { status: 409 });
    return NextResponse.json({ error: 'Failed to create service type' }, { status: 500 });
  }
}
