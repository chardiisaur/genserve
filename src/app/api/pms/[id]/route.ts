import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, isNextResponse } from '@/lib/rbac';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (isNextResponse(auth)) return auth;
  try {
    const { id } = await params;
    const record = await prisma.pmsRecord.findFirst({
      where: { OR: [{ id }, { pmsRecordId: id }] },
    });
    if (!record) return NextResponse.json({ error: 'PMS record not found' }, { status: 404 });
    return NextResponse.json(record);
  } catch (err: unknown) {
    console.error('[PMS GET BY ID ERROR]', err);
    return NextResponse.json({ error: 'Failed to fetch PMS record' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (isNextResponse(auth)) return auth;
  try {
    const { id } = await params;
    const body = await req.json();
    const existing = await prisma.pmsRecord.findFirst({
      where: { OR: [{ id }, { pmsRecordId: id }] },
    });
    if (!existing) return NextResponse.json({ error: 'PMS record not found' }, { status: 404 });
    const record = await prisma.pmsRecord.update({ where: { id: existing.id }, data: body });
    return NextResponse.json(record);
  } catch (err: unknown) {
    console.error('[PMS UPDATE ERROR]', err);
    return NextResponse.json({ error: 'Failed to update PMS record' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (isNextResponse(auth)) return auth;
  try {
    const { id } = await params;
    const existing = await prisma.pmsRecord.findFirst({
      where: { OR: [{ id }, { pmsRecordId: id }] },
    });
    if (!existing) return NextResponse.json({ error: 'PMS record not found' }, { status: 404 });

    await prisma.$transaction(async (tx) => {
      await tx.pmsRecord.delete({ where: { id: existing.id } });
    });

    return NextResponse.json({ success: true, deletedId: existing.id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message.includes('Foreign key constraint') || message.includes('foreign key')) {
      return NextResponse.json(
        { error: 'Cannot delete this PMS record because it is referenced by another record.' },
        { status: 409 }
      );
    }
    console.error('[PMS DELETE]', message);
    return NextResponse.json({ error: 'Failed to delete PMS record' }, { status: 500 });
  }
}
