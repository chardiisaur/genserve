import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, isNextResponse } from '@/lib/rbac';

/** Collision-safe PMS record ID */
function newPmsRecordId(): string {
  return `pms-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (isNextResponse(auth)) return auth;
  try {
    const records = await prisma.pmsRecord.findMany({ orderBy: { pmsDate: 'desc' } });
    return NextResponse.json(records);
  } catch (err: unknown) {
    console.error('[PMS GET ERROR]', err);
    return NextResponse.json({ error: 'Failed to fetch PMS records' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (isNextResponse(auth)) return auth;
  try {
    const body = await req.json();
    if (!body.generatorId || !body.clientId || !body.siteId || !body.pmsDate) {
      return NextResponse.json({ error: 'generatorId, clientId, siteId, and pmsDate are required' }, { status: 400 });
    }
    // Ensure optional technicianId is null (not empty string) to avoid FK errors
    const data = {
      ...body,
      technicianId: body.technicianId || null,
      pmsRecordId: newPmsRecordId(),
    };
    const record = await prisma.pmsRecord.create({ data });
    return NextResponse.json(record, { status: 201 });
  } catch (err: unknown) {
    console.error('[PMS CREATE ERROR]', err);
    const code = (err as any)?.code;
    if (code === 'P2002') return NextResponse.json({ error: 'Duplicate record.' }, { status: 409 });
    if (code === 'P2003') return NextResponse.json({ error: 'Referenced record not found.' }, { status: 400 });
    return NextResponse.json({ error: 'Failed to create PMS record' }, { status: 500 });
  }
}
