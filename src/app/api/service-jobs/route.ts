import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, isNextResponse } from '@/lib/rbac';

/**
 * Generates a collision-safe Job Order number in the format JO-YYYY-0001.
 * Uses a dedicated JobOrderSequence table with an atomic increment to prevent
 * duplicate JO numbers even under concurrent requests.
 */
async function generateJobOrderNo(): Promise<string> {
  const year = new Date().getFullYear();
  const seq = await prisma.$transaction(async (tx) => {
    const record = await tx.jobOrderSequence.upsert({
      where: { year },
      update: { lastSeq: { increment: 1 } },
      create: { year, lastSeq: 1 },
    });
    return record.lastSeq;
  });
  return `JO-${year}-${String(seq).padStart(4, '0')}`;
}

const VALID_STATUSES = ['Open', 'In Progress', 'Completed', 'Closed', 'Cancelled'];
const VALID_PRIORITIES = ['Normal', 'High', 'Critical'];
const VALID_BILLING_STATUSES = ['Pending', 'Quoted', 'Approved', 'Invoiced', 'Paid', 'Cancelled'];

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (isNextResponse(auth)) return auth;
  try {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId');
    const where = clientId ? { clientId } : {};
    const jobs = await prisma.serviceJob.findMany({
      where,
      orderBy: { requestDate: 'desc' },
      include: {
        client: { select: { clientName: true } },
        site: { select: { siteName: true } },
        generator: { select: { assetNo: true, brand: true, model: true } },
        leadTechnician: { select: { technicianName: true } },
        additionalTechnician: { select: { technicianName: true } },
      },
    });

    // Flatten related names into the response
    const result = jobs.map((j) => ({
      ...j,
      clientName: j.client?.clientName ?? j.clientId,
      siteName: j.site?.siteName ?? j.siteId,
      generatorName: j.generator
        ? `${j.generator.assetNo} / ${j.generator.brand} ${j.generator.model}`.trim()
        : j.generatorId,
      leadTechnicianName: j.leadTechnician?.technicianName ?? (j.leadTechnicianId || ''),
      additionalTechnicianName: j.additionalTechnician?.technicianName ?? undefined,
    }));

    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error('[SERVICE JOB GET ERROR]', err);
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (isNextResponse(auth)) return auth;
  try {
    const body = await req.json();
    const { requestDate, clientId, siteId, generatorId, serviceType } = body;

    // Required field validation
    if (!requestDate || !clientId || !siteId || !generatorId || !serviceType) {
      return NextResponse.json(
        { error: 'Missing required fields: requestDate, clientId, siteId, generatorId, serviceType' },
        { status: 400 }
      );
    }

    // Validate status/priority/billingStatus values
    if (body.status && !VALID_STATUSES.includes(body.status)) {
      return NextResponse.json({ error: `Invalid status: ${body.status}` }, { status: 400 });
    }
    if (body.priority && !VALID_PRIORITIES.includes(body.priority)) {
      return NextResponse.json({ error: `Invalid priority: ${body.priority}` }, { status: 400 });
    }
    if (body.billingStatus && !VALID_BILLING_STATUSES.includes(body.billingStatus)) {
      return NextResponse.json({ error: `Invalid billingStatus: ${body.billingStatus}` }, { status: 400 });
    }

    // Server-side relationship validation
    const [client, site, generator] = await Promise.all([
      prisma.client.findUnique({ where: { clientId } }),
      prisma.site.findUnique({ where: { siteId } }),
      prisma.generator.findUnique({ where: { generatorId } }),
    ]);

    if (!client) {
      return NextResponse.json({ error: 'Invalid client — client not found.' }, { status: 400 });
    }
    if (!site) {
      return NextResponse.json({ error: 'Invalid site — site not found.' }, { status: 400 });
    }
    if (site.clientId !== clientId) {
      return NextResponse.json({ error: 'Invalid site — site does not belong to the selected client.' }, { status: 400 });
    }
    if (!generator) {
      return NextResponse.json({ error: 'Invalid generator — generator not found.' }, { status: 400 });
    }
    if (generator.siteId !== siteId) {
      return NextResponse.json({ error: 'Invalid generator — generator does not belong to the selected site.' }, { status: 400 });
    }

    // Validate technicians if provided
    const leadTechId = body.leadTechnicianId || null;
    const addlTechId = body.additionalTechnicianId || null;

    if (leadTechId) {
      const tech = await prisma.technician.findUnique({ where: { technicianId: leadTechId } });
      if (!tech) return NextResponse.json({ error: 'Invalid lead technician — technician not found.' }, { status: 400 });
    }
    if (addlTechId) {
      const tech = await prisma.technician.findUnique({ where: { technicianId: addlTechId } });
      if (!tech) return NextResponse.json({ error: 'Invalid additional technician — technician not found.' }, { status: 400 });
    }

    // Validate service type
    const st = await prisma.serviceType.findFirst({ where: { serviceType } });
    if (!st) {
      return NextResponse.json({ error: `Invalid service type: ${serviceType}` }, { status: 400 });
    }

    const jobOrderNo = await generateJobOrderNo();

    // Strip frontend-only fields and build clean data object
    const {
      id: _id,
      jobOrderNo: _jo,
      clientName: _cn,
      siteName: _sn,
      generatorName: _gn,
      leadTechnicianName: _ltn,
      additionalTechnicianName: _atn,
      createdAt: _ca,
      updatedAt: _ua,
      client: _c,
      site: _s,
      generator: _g,
      leadTechnician: _lt,
      additionalTechnician: _at,
      ...cleanBody
    } = body;

    const data = {
      ...cleanBody,
      jobOrderNo,
      requestDate,
      clientId,
      siteId,
      generatorId,
      serviceType,
      leadTechnicianId: leadTechId,
      additionalTechnicianId: addlTechId,
    };

    const job = await prisma.serviceJob.create({ data });
    return NextResponse.json(job, { status: 201 });
  } catch (err: unknown) {
    console.error('[SERVICE JOB CREATE ERROR]', err);
    const code = (err as any)?.code;
    if (code === 'P2002') return NextResponse.json({ error: 'Duplicate record.' }, { status: 409 });
    if (code === 'P2003') return NextResponse.json({ error: 'Referenced record not found.' }, { status: 400 });
    return NextResponse.json({ error: 'Failed to create job' }, { status: 500 });
  }
}
