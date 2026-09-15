import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const job = await prisma.serviceJob.findUnique({ where: { jobOrderNo: id } });
    if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(job);
  } catch (err: unknown) {
    console.error('[SERVICE JOB GET BY ID ERROR]', err);
    return NextResponse.json({ error: 'Failed to fetch job' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    // Ensure optional technician fields are null (not empty string) to avoid FK errors
    const data = {
      ...body,
      leadTechnicianId: body.leadTechnicianId || null,
      additionalTechnicianId: body.additionalTechnicianId || null,
    };
    const job = await prisma.serviceJob.update({ where: { jobOrderNo: id }, data });
    return NextResponse.json(job);
  } catch (err: unknown) {
    console.error('[SERVICE JOB UPDATE ERROR]', err);
    const code = (err as any)?.code;
    if (code === 'P2025') return NextResponse.json({ error: 'Job not found.' }, { status: 404 });
    return NextResponse.json({ error: 'Failed to update job' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    // Find the job first (id param is jobOrderNo)
    const job = await prisma.serviceJob.findUnique({ where: { jobOrderNo: id } });
    if (!job) return NextResponse.json({ error: 'Job not found.' }, { status: 404 });

    // Check for child records that must be deleted first or block deletion
    const [deploymentCount, quotationCount] = await Promise.all([
      prisma.deployment.count({ where: { jobOrderNo: id } }),
      prisma.quotationBilling.count({ where: { jobOrderNo: id } }),
    ]);
    if (deploymentCount > 0) {
      return NextResponse.json({ error: `Cannot delete job — ${deploymentCount} deployment record(s) exist. Remove them first.` }, { status: 409 });
    }
    if (quotationCount > 0) {
      return NextResponse.json({ error: `Cannot delete job — ${quotationCount} billing/quotation record(s) exist. Remove them first.` }, { status: 409 });
    }

    // Delete child records in a transaction, then delete the job
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
