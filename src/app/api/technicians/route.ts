import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, isNextResponse } from '@/lib/rbac';

/** Collision-safe technician ID */
function newTechnicianId(): string {
  return `tech-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (isNextResponse(auth)) return auth;
  try {
    const technicians = await prisma.technician.findMany({ orderBy: { technicianName: 'asc' } });
    return NextResponse.json(technicians);
  } catch (err: unknown) {
    console.error('[TECHNICIAN GET ERROR]', err);
    return NextResponse.json({ error: 'Failed to fetch technicians' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (isNextResponse(auth)) return auth;
  try {
    const body = await req.json();
    if (!body.technicianName) {
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
