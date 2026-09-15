import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireManagerOrAbove, isNextResponse } from '@/lib/rbac';

/** Collision-safe technician ID */
function newTechnicianId(): string {
  return `tech-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (isNextResponse(auth)) return auth;
  try {
    const { searchParams } = new URL(req.url);
    const availability = searchParams.get('availability');
    const where = availability ? { availability } : {};
    const technicians = await prisma.technician.findMany({
      where,
      orderBy: { technicianName: 'asc' },
      include: {
        _count: {
          select: {
            serviceJobsLead: true,
            pmsRecords: true,
            deployments: true,
            expenses: true,
            partsUsed: true,
          },
        },
      },
    });
    const result = technicians.map((t) => ({
      ...t,
      leadJobCount: t._count.serviceJobsLead,
      pmsCount: t._count.pmsRecords,
      deploymentCount: t._count.deployments,
    }));
    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error('[TECHNICIAN GET ERROR]', err);
    return NextResponse.json({ error: 'Failed to fetch technicians' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireManagerOrAbove();
  if (isNextResponse(auth)) return auth;
  try {
    const body = await req.json();
    if (!body.technicianName?.trim()) {
      return NextResponse.json({ error: 'technicianName is required' }, { status: 400 });
    }
    const tech = await prisma.technician.create({
      data: { technicianId: newTechnicianId(), ...body },
    });
    return NextResponse.json(tech, { status: 201 });
  } catch (err: unknown) {
    console.error('[TECHNICIAN CREATE ERROR]', err);
    const code = (err as any)?.code;
    if (code === 'P2002') return NextResponse.json({ error: 'Duplicate record.' }, { status: 409 });
    return NextResponse.json({ error: 'Failed to create technician' }, { status: 500 });
  }
}
