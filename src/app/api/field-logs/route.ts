import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, isNextResponse, ROLES } from '@/lib/rbac';

const VALID_LOG_TYPES = ['Work Log', 'Finding', 'Parts Used', 'Status Update', 'Safety Note', 'Customer Communication', 'Other'];

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (isNextResponse(auth)) return auth;
  try {
    const { searchParams } = new URL(req.url);
    const jobOrderNo = searchParams.get('jobOrderNo');

    let where: Record<string, unknown> = jobOrderNo ? { jobOrderNo } : {};

    // FIELD_TECHNICIAN: only see logs for jobs assigned to them
    if (auth.role === ROLES.FIELD_TECHNICIAN) {
      const assignedJobs = await prisma.serviceJob.findMany({
        where: {
          OR: [
            { leadTechnicianId: auth.id },
            { additionalTechnicianId: auth.id },
          ],
        },
        select: { jobOrderNo: true },
      });
      const assignedJobNos = assignedJobs.map((j) => j.jobOrderNo);
      where = { ...where, jobOrderNo: { in: assignedJobNos } };
    }

    const logs = await prisma.fieldLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
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

    const result = logs.map((l) => ({
      ...l,
      clientName: l.serviceJob?.client?.clientName ?? '',
      siteName: l.serviceJob?.site?.siteName ?? '',
      generatorLabel: l.serviceJob?.generator
        ? `${l.serviceJob.generator.assetNo} / ${l.serviceJob.generator.brand} ${l.serviceJob.generator.model}`.trim()
        : '',
    }));

    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error('[FIELD LOGS GET ERROR]', err);
    return NextResponse.json({ error: 'Failed to fetch field logs' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (isNextResponse(auth)) return auth;
  try {
    const body = await req.json();
    const { jobOrderNo, loggedBy, description } = body;

    if (!jobOrderNo?.trim() || !loggedBy?.trim() || !description?.trim()) {
      return NextResponse.json(
        { error: 'jobOrderNo, loggedBy, and description are required' },
        { status: 400 }
      );
    }

    if (body.logType && !VALID_LOG_TYPES.includes(body.logType)) {
      return NextResponse.json({ error: `Invalid logType: ${body.logType}` }, { status: 400 });
    }

    // Validate job exists
    const job = await prisma.serviceJob.findUnique({ where: { jobOrderNo } });
    if (!job) return NextResponse.json({ error: 'Service job not found.' }, { status: 400 });

    // FIELD_TECHNICIAN: can only log on their assigned jobs
    if (auth.role === ROLES.FIELD_TECHNICIAN) {
      if (job.leadTechnicianId !== auth.id && job.additionalTechnicianId !== auth.id) {
        return NextResponse.json({ error: 'Forbidden — you are not assigned to this job' }, { status: 403 });
      }
    }

    const { id: _id, createdAt: _ca, serviceJob: _sj, ...cleanBody } = body;

    const log = await prisma.fieldLog.create({
      data: {
        ...cleanBody,
        jobOrderNo,
        loggedBy,
        description,
        timestamp: body.timestamp ? new Date(body.timestamp) : new Date(),
      },
    });
    return NextResponse.json(log, { status: 201 });
  } catch (err: unknown) {
    console.error('[FIELD LOG CREATE ERROR]', err);
    const code = (err as any)?.code;
    if (code === 'P2003') return NextResponse.json({ error: 'Referenced record not found.' }, { status: 400 });
    return NextResponse.json({ error: 'Failed to create field log' }, { status: 500 });
  }
}
