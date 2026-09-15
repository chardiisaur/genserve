import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireManagerOrAbove, isNextResponse, ROLES } from '@/lib/rbac';

const VALID_STATUSES = ['Open', 'In Progress', 'Completed', 'Closed', 'Cancelled'];
const VALID_PRIORITIES = ['Normal', 'High', 'Critical'];
const VALID_BILLING_STATUSES = ['Pending', 'Quoted', 'Approved', 'Invoiced', 'Paid', 'Cancelled'];

// Fields a FIELD_TECHNICIAN is allowed to update on their assigned jobs
const FIELD_TECH_ALLOWED_FIELDS = new Set([
  'status', 'startDate', 'completionDate', 'runningHours',
  'findings', 'workPerformed', 'testingResults', 'recommendations',
  'partsMaterialsSummary', 'customerRepresentative', 'customerContact',
  'serviceReportNo', 'remarks',
]);

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (isNextResponse(auth)) return auth;
  try {
    const { id } = await params;
    const job = await prisma.serviceJob.findUnique({
      where: { jobOrderNo: id },
      include: {
        client: { select: { clientName: true } },
        site: { select: { siteName: true } },
        generator: { select: { assetNo: true, brand: true, model: true } },
        leadTechnician: { select: { technicianName: true } },
        additionalTechnician: { select: { technicianName: true } },
      },
    });
    if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // FIELD_TECHNICIAN can only view jobs assigned to them
    if (
      auth.role === ROLES.FIELD_TECHNICIAN &&
      job.leadTechnicianId !== auth.id &&
      job.additionalTechnicianId !== auth.id
    ) {
      return NextResponse.json({ error: 'Forbidden — you are not assigned to this job' }, { status: 403 });
    }

    return NextResponse.json({
      ...job,
      clientName: job.client?.clientName ?? job.clientId,
      siteName: job.site?.siteName ?? job.siteId,
      generatorName: job.generator
        ? `${job.generator.assetNo} / ${job.generator.brand} ${job.generator.model}`.trim()
        : job.generatorId,
      leadTechnicianName: job.leadTechnician?.technicianName ?? (job.leadTechnicianId || ''),
      additionalTechnicianName: job.additionalTechnician?.technicianName ?? undefined,
    });
  } catch (err: unknown) {
    console.error('[SERVICE JOB GET BY ID ERROR]', err);
    return NextResponse.json({ error: 'Failed to fetch job' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (isNextResponse(auth)) return auth;
  try {
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.serviceJob.findUnique({ where: { jobOrderNo: id } });
    if (!existing) return NextResponse.json({ error: 'Job not found.' }, { status: 404 });

    // FIELD_TECHNICIAN: can only update their own assigned jobs, and only allowed fields
    if (auth.role === ROLES.FIELD_TECHNICIAN) {
      if (existing.leadTechnicianId !== auth.id && existing.additionalTechnicianId !== auth.id) {
        return NextResponse.json({ error: 'Forbidden — you are not assigned to this job' }, { status: 403 });
      }
      // Strip any fields not in the allowed set
      const disallowedFields = Object.keys(body).filter(
        (k) => !FIELD_TECH_ALLOWED_FIELDS.has(k)
      );
      if (disallowedFields.length > 0) {
        return NextResponse.json(
          { error: `Forbidden — you cannot modify: ${disallowedFields.join(', ')}` },
          { status: 403 }
        );
      }
    }

    if (body.status && !VALID_STATUSES.includes(body.status)) {
      return NextResponse.json({ error: `Invalid status: ${body.status}` }, { status: 400 });
    }
    if (body.priority && !VALID_PRIORITIES.includes(body.priority)) {
      return NextResponse.json({ error: `Invalid priority: ${body.priority}` }, { status: 400 });
    }
    if (body.billingStatus && !VALID_BILLING_STATUSES.includes(body.billingStatus)) {
      return NextResponse.json({ error: `Invalid billingStatus: ${body.billingStatus}` }, { status: 400 });
    }

    // If clientId/siteId/generatorId are being changed, validate relationships
    if (body.clientId || body.siteId || body.generatorId) {
      const clientId = body.clientId || existing.clientId;
      const siteId = body.siteId || existing.siteId;
      const generatorId = body.generatorId || existing.generatorId;

      const [client, site, generator] = await Promise.all([
        prisma.client.findUnique({ where: { clientId } }),
        prisma.site.findUnique({ where: { siteId } }),
        prisma.generator.findUnique({ where: { generatorId } }),
      ]);

      if (!client) return NextResponse.json({ error: 'Invalid client — client not found.' }, { status: 400 });
      if (!site) return NextResponse.json({ error: 'Invalid site — site not found.' }, { status: 400 });
      if (site.clientId !== clientId) {
        return NextResponse.json({ error: 'Invalid site — site does not belong to the selected client.' }, { status: 400 });
      }
      if (!generator) return NextResponse.json({ error: 'Invalid generator — generator not found.' }, { status: 400 });
      if (generator.siteId !== siteId) {
        return NextResponse.json({ error: 'Invalid generator — generator does not belong to the selected site.' }, { status: 400 });
      }
    }

    const leadTechId = body.leadTechnicianId !== undefined ? (body.leadTechnicianId || null) : undefined;
    const addlTechId = body.additionalTechnicianId !== undefined ? (body.additionalTechnicianId || null) : undefined;

    if (leadTechId) {
      const tech = await prisma.technician.findUnique({ where: { technicianId: leadTechId } });
      if (!tech) return NextResponse.json({ error: 'Invalid lead technician — technician not found.' }, { status: 400 });
    }
    if (addlTechId) {
      const tech = await prisma.technician.findUnique({ where: { technicianId: addlTechId } });
      if (!tech) return NextResponse.json({ error: 'Invalid additional technician — technician not found.' }, { status: 400 });
    }

    const {
      id: _id, jobOrderNo: _jo, clientName: _cn, siteName: _sn, generatorName: _gn,
      leadTechnicianName: _ltn, additionalTechnicianName: _atn,
      createdAt: _ca, updatedAt: _ua,
      client: _c, site: _s, generator: _g, leadTechnician: _lt, additionalTechnician: _at,
      ...cleanBody
    } = body;

    const updateData: Record<string, unknown> = { ...cleanBody };
    if (leadTechId !== undefined) updateData.leadTechnicianId = leadTechId;
    if (addlTechId !== undefined) updateData.additionalTechnicianId = addlTechId;

    const job = await prisma.serviceJob.update({ where: { jobOrderNo: id }, data: updateData });
    return NextResponse.json(job);
  } catch (err: unknown) {
    console.error('[SERVICE JOB UPDATE ERROR]', err);
    const code = (err as any)?.code;
    if (code === 'P2025') return NextResponse.json({ error: 'Job not found.' }, { status: 404 });
    if (code === 'P2003') return NextResponse.json({ error: 'Referenced record not found.' }, { status: 400 });
    return NextResponse.json({ error: 'Failed to update job' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // FIELD_TECHNICIAN cannot delete jobs
  const auth = await requireManagerOrAbove();
  if (isNextResponse(auth)) return auth;
  try {
    const { id } = await params;
    const job = await prisma.serviceJob.findUnique({ where: { jobOrderNo: id } });
    if (!job) return NextResponse.json({ error: 'Job not found.' }, { status: 404 });

    const [deploymentCount, quotationCount] = await Promise.all([
      prisma.deployment.count({ where: { jobOrderNo: id } }),
      prisma.quotationBilling.count({ where: { jobOrderNo: id } }),
    ]);
    if (deploymentCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete job — ${deploymentCount} deployment record(s) exist. Remove them first.` },
        { status: 409 }
      );
    }
    if (quotationCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete job — ${quotationCount} billing/quotation record(s) exist. Remove them first.` },
        { status: 409 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.fieldLog.deleteMany({ where: { jobOrderNo: id } });
      await tx.partUsed.deleteMany({ where: { jobOrderNo: id } });
      await tx.expense.deleteMany({ where: { jobOrderNo: id } });
      await tx.serviceJob.delete({ where: { jobOrderNo: id } });
    });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('[SERVICE JOB DELETE ERROR]', err);
    const code = (err as any)?.code;
    if (code === 'P2025') return NextResponse.json({ error: 'Job not found.' }, { status: 404 });
    if (code === 'P2003') return NextResponse.json({ error: 'Cannot delete — referenced by other records.' }, { status: 409 });
    return NextResponse.json({ error: 'Failed to delete job' }, { status: 500 });
  }
}
