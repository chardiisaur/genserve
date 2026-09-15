import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

export async function GET() {
  try {
    const jobs = await prisma.serviceJob.findMany({ orderBy: { requestDate: 'desc' } });
    return NextResponse.json(jobs);
  } catch (err: unknown) {
    console.error('[SERVICE JOB GET ERROR]', err);
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { requestDate, clientId, siteId, generatorId, serviceType } = body;
    if (!requestDate || !clientId || !siteId || !generatorId || !serviceType) {
      return NextResponse.json({ error: 'Missing required fields: requestDate, clientId, siteId, generatorId, serviceType' }, { status: 400 });
    }
    const jobOrderNo = await generateJobOrderNo();
    // Ensure optional technician fields are null (not empty string) to avoid FK errors
    const data = {
      ...body,
      jobOrderNo,
      leadTechnicianId: body.leadTechnicianId || null,
      additionalTechnicianId: body.additionalTechnicianId || null,
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
