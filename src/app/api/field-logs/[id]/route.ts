import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireManagerOrAbove, isNextResponse, ROLES } from '@/lib/rbac';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (isNextResponse(auth)) return auth;
  try {
    const { id } = await params;
    const log = await prisma.fieldLog.findUnique({
      where: { id },
      include: {
        serviceJob: {
          select: {
            jobOrderNo: true,
            client: { select: { clientName: true } },
            site: { select: { siteName: true } },
            generator: { select: { assetNo: true, brand: true, model: true } },
          },
        },
      },
    });
    if (!log) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // FIELD_TECHNICIAN: only view logs for their assigned jobs
    if (auth.role === ROLES.FIELD_TECHNICIAN) {
      const job = await prisma.serviceJob.findUnique({ where: { jobOrderNo: log.jobOrderNo } });
      if (!job || (job.leadTechnicianId !== auth.id && job.additionalTechnicianId !== auth.id)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    return NextResponse.json({
      ...log,
      clientName: log.serviceJob?.client?.clientName ?? '',
      siteName: log.serviceJob?.site?.siteName ?? '',
      generatorLabel: log.serviceJob?.generator
        ? `${log.serviceJob.generator.assetNo} / ${log.serviceJob.generator.brand} ${log.serviceJob.generator.model}`.trim()
        : '',
    });
  } catch (err: unknown) {
    console.error('[FIELD LOG GET BY ID ERROR]', err);
    return NextResponse.json({ error: 'Failed to fetch field log' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (isNextResponse(auth)) return auth;
  try {
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.fieldLog.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Field log not found.' }, { status: 404 });

    // FIELD_TECHNICIAN: only update logs for their assigned jobs
    if (auth.role === ROLES.FIELD_TECHNICIAN) {
      const job = await prisma.serviceJob.findUnique({ where: { jobOrderNo: existing.jobOrderNo } });
      if (!job || (job.leadTechnicianId !== auth.id && job.additionalTechnicianId !== auth.id)) {
        return NextResponse.json({ error: 'Forbidden — you are not assigned to this job' }, { status: 403 });
      }
    }

    const { id: _id, createdAt: _ca, jobOrderNo: _jo, serviceJob: _sj, ...cleanBody } = body;
    const log = await prisma.fieldLog.update({ where: { id }, data: cleanBody });
    return NextResponse.json(log);
  } catch (err: unknown) {
    console.error('[FIELD LOG UPDATE ERROR]', err);
    const code = (err as any)?.code;
    if (code === 'P2025') return NextResponse.json({ error: 'Field log not found.' }, { status: 404 });
    return NextResponse.json({ error: 'Failed to update field log' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireManagerOrAbove();
  if (isNextResponse(auth)) return auth;
  try {
    const { id } = await params;
    await prisma.fieldLog.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('[FIELD LOG DELETE ERROR]', err);
    const code = (err as any)?.code;
    if (code === 'P2025') return NextResponse.json({ error: 'Field log not found.' }, { status: 404 });
    return NextResponse.json({ error: 'Failed to delete field log' }, { status: 500 });
  }
}
