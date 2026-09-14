import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    // Support lookup by either primary `id` (cuid) or `pmsRecordId` (business key)
    const record = await prisma.pmsRecord.findFirst({
      where: { OR: [{ id }, { pmsRecordId: id }] },
    });
    if (!record) return NextResponse.json({ error: 'PMS record not found' }, { status: 404 });
    return NextResponse.json(record);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch PMS record' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    // Find by primary id first, fall back to pmsRecordId
    const existing = await prisma.pmsRecord.findFirst({
      where: { OR: [{ id }, { pmsRecordId: id }] },
    });
    if (!existing) return NextResponse.json({ error: 'PMS record not found' }, { status: 404 });
    const record = await prisma.pmsRecord.update({ where: { id: existing.id }, data: body });
    return NextResponse.json(record);
  } catch {
    return NextResponse.json({ error: 'Failed to update PMS record' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Find the record by primary `id` (cuid) — this is the safe unique identifier
    const existing = await prisma.pmsRecord.findFirst({
      where: { OR: [{ id }, { pmsRecordId: id }] },
    });
    if (!existing) return NextResponse.json({ error: 'PMS record not found' }, { status: 404 });

    // PmsRecord has no child records in the schema — safe to delete directly.
    // Parent records (Generator, Client, Site, Technician) are NOT deleted.
    await prisma.$transaction(async (tx) => {
      await tx.pmsRecord.delete({ where: { id: existing.id } });
    });

    return NextResponse.json({ success: true, deletedId: existing.id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    // Foreign key errors: do not delete parent records — return a clear message
    if (message.includes('Foreign key constraint') || message.includes('foreign key')) {
      return NextResponse.json(
        { error: 'Cannot delete this PMS record because it is referenced by another record. Contact your administrator.' },
        { status: 409 }
      );
    }
    console.error('[PMS DELETE]', message);
    return NextResponse.json({ error: 'Failed to delete PMS record' }, { status: 500 });
  }
}
