import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireManagerOrAbove, isNextResponse } from '@/lib/rbac';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (isNextResponse(auth)) return auth;
  try {
    const { id } = await params;
    const gen = await prisma.generator.findUnique({
      where: { generatorId: id },
      include: {
        client: { select: { clientName: true } },
        site: { select: { siteName: true } },
        serviceJobs: {
          orderBy: { requestDate: 'desc' },
          take: 10,
          include: {
            leadTechnician: { select: { technicianName: true } },
          },
        },
        pmsRecords: {
          orderBy: { pmsDate: 'desc' },
          take: 10,
          include: {
            technician: { select: { technicianName: true } },
          },
        },
        partsUsed: {
          orderBy: { dateUsed: 'desc' },
          take: 10,
          include: {
            part: { select: { partDescription: true, partNo: true } },
          },
        },
      },
    });
    if (!gen) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({
      ...gen,
      clientName: gen.client?.clientName ?? gen.clientId,
      siteName: gen.site?.siteName ?? gen.siteId,
    });
  } catch (err: unknown) {
    console.error('[GENERATOR GET BY ID ERROR]', err);
    return NextResponse.json({ error: 'Failed to fetch generator' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireManagerOrAbove();
  if (isNextResponse(auth)) return auth;
  try {
    const { id } = await params;
    const body = await req.json();
    const gen = await prisma.generator.update({ where: { generatorId: id }, data: body });
    return NextResponse.json(gen);
  } catch (err: unknown) {
    console.error('[GENERATOR UPDATE ERROR]', err);
    const code = (err as any)?.code;
    if (code === 'P2025') return NextResponse.json({ error: 'Generator not found.' }, { status: 404 });
    return NextResponse.json({ error: 'Failed to update generator' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireManagerOrAbove();
  if (isNextResponse(auth)) return auth;
  try {
    const { id } = await params;
    const [jobCount, pmsCount, partsUsedCount] = await Promise.all([
      prisma.serviceJob.count({ where: { generatorId: id } }),
      prisma.pmsRecord.count({ where: { generatorId: id } }),
      prisma.partUsed.count({ where: { generatorId: id } }),
    ]);
    if (jobCount > 0) return NextResponse.json({ error: `Cannot delete generator — ${jobCount} service job(s) exist. Service history must be preserved.` }, { status: 409 });
    if (pmsCount > 0) return NextResponse.json({ error: `Cannot delete generator — ${pmsCount} PMS record(s) exist. Service history must be preserved.` }, { status: 409 });
    if (partsUsedCount > 0) return NextResponse.json({ error: `Cannot delete generator — ${partsUsedCount} parts-used record(s) exist. Service history must be preserved.` }, { status: 409 });

    await prisma.generator.delete({ where: { generatorId: id } });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('[GENERATOR DELETE ERROR]', err);
    const code = (err as any)?.code;
    if (code === 'P2025') return NextResponse.json({ error: 'Generator not found.' }, { status: 404 });
    if (code === 'P2003') return NextResponse.json({ error: 'Cannot delete — referenced by other records.' }, { status: 409 });
    return NextResponse.json({ error: 'Failed to delete generator' }, { status: 500 });
  }
}
