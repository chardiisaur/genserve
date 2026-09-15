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
      include: {
        generator: { select: { generatorId: true, brand: true, model: true, assetNo: true } },
        client: { select: { clientId: true, clientName: true } },
        site: { select: { siteId: true, siteName: true } },
        technician: { select: { technicianId: true, technicianName: true } },
      },
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

    // If changing generator/client/site, validate relationships
    const newGeneratorId = body.generatorId ?? existing.generatorId;
    const newClientId = body.clientId ?? existing.clientId;
    const newSiteId = body.siteId ?? existing.siteId;

    if (body.generatorId || body.clientId || body.siteId) {
      const generator = await prisma.generator.findUnique({ where: { generatorId: newGeneratorId } });
      if (!generator) return NextResponse.json({ error: 'Generator not found.' }, { status: 400 });
      if (generator.clientId !== newClientId) return NextResponse.json({ error: 'Generator does not belong to the selected client.' }, { status: 400 });
      if (generator.siteId !== newSiteId) return NextResponse.json({ error: 'Generator does not belong to the selected site.' }, { status: 400 });
    }

    // Validate technician if provided
    if (body.technicianId) {
      const tech = await prisma.technician.findUnique({ where: { technicianId: body.technicianId } });
      if (!tech) return NextResponse.json({ error: 'Technician not found.' }, { status: 400 });
    }

    // Strip frontend-only / computed fields
    const {
      id: _id, pmsRecordId: _pmsId, createdAt: _ca, updatedAt: _ua,
      clientName, siteName, generatorLabel, technicianName, daysUntilNextPms, isUpcoming,
      generator: _gen, client: _cli, site: _sit, technician: _tech,
      ...updateData
    } = body;

    // Ensure technicianId is null not empty string
    if ('technicianId' in updateData) {
      updateData.technicianId = updateData.technicianId || null;
    }
    if ('runningHours' in updateData) updateData.runningHours = Number(updateData.runningHours) || 0;
    if ('nextPmsHours' in updateData) updateData.nextPmsHours = Number(updateData.nextPmsHours) || 0;

    const record = await prisma.pmsRecord.update({ where: { id: existing.id }, data: updateData });
    return NextResponse.json(record);
  } catch (err: unknown) {
    console.error('[PMS UPDATE ERROR]', err);
    const code = (err as any)?.code;
    if (code === 'P2003') return NextResponse.json({ error: 'Referenced record not found.' }, { status: 400 });
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

    // Delete the record — no child tables reference PmsRecord in the current schema
    await prisma.pmsRecord.delete({ where: { id: existing.id } });

    return NextResponse.json({ success: true, deletedId: existing.id, deletedPmsRecordId: existing.pmsRecordId });
  } catch (err: unknown) {
    console.error('[PMS DELETE ERROR]', err);
    const message = err instanceof Error ? err.message : String(err);
    const code = (err as any)?.code;
    if (code === 'P2003' || message.toLowerCase().includes('foreign key')) {
      return NextResponse.json(
        { error: 'Cannot delete this PMS record because it is referenced by another record.' },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: `Failed to delete PMS record: ${message}` }, { status: 500 });
  }
}
