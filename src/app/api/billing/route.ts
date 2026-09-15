import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireManagerOrAbove, isNextResponse } from '@/lib/rbac';

const VALID_BILLING_STATUSES = ['Pending', 'Quoted', 'Approved', 'Invoiced', 'Paid', 'Unpaid', 'Cancelled'];

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (isNextResponse(auth)) return auth;
  try {
    const { searchParams } = new URL(req.url);
    const jobOrderNo = searchParams.get('jobOrderNo');
    const clientId = searchParams.get('clientId');

    const where: Record<string, unknown> = {};
    if (jobOrderNo) where.jobOrderNo = jobOrderNo;
    if (clientId) where.clientId = clientId;

    const quotations = await prisma.quotationBilling.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        serviceJob: {
          select: {
            jobOrderNo: true,
            site: { select: { siteName: true } },
            generator: { select: { assetNo: true, brand: true, model: true } },
          },
        },
        client: { select: { clientName: true } },
      },
    });

    const result = quotations.map((q) => ({
      ...q,
      clientName: q.client?.clientName ?? q.clientId,
      siteName: q.serviceJob?.site?.siteName ?? '',
      generatorLabel: q.serviceJob?.generator
        ? `${q.serviceJob.generator.assetNo} / ${q.serviceJob.generator.brand} ${q.serviceJob.generator.model}`.trim()
        : '',
    }));

    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error('[BILLING GET ERROR]', err);
    return NextResponse.json({ error: 'Failed to fetch billing records' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireManagerOrAbove();
  if (isNextResponse(auth)) return auth;
  try {
    const body = await req.json();
    if (!body.jobOrderNo?.trim()) {
      return NextResponse.json({ error: 'jobOrderNo is required' }, { status: 400 });
    }
    if (body.billingStatus && !VALID_BILLING_STATUSES.includes(body.billingStatus)) {
      return NextResponse.json({ error: `Invalid billingStatus: ${body.billingStatus}` }, { status: 400 });
    }
    // Validate job exists
    const job = await prisma.serviceJob.findUnique({ where: { jobOrderNo: body.jobOrderNo } });
    if (!job) return NextResponse.json({ error: 'Service job not found.' }, { status: 400 });

    const labor = Number(body.labor) || 0;
    const parts = Number(body.parts) || 0;
    const transportation = Number(body.transportation) || 0;
    const accommodation = Number(body.accommodation) || 0;
    const otherCharges = Number(body.otherCharges) || 0;
    const discount = Number(body.discount) || 0;
    const totalAmount = labor + parts + transportation + accommodation + otherCharges - discount;

    const record = await prisma.quotationBilling.create({
      data: {
        transactionId: `txn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        ...body,
        labor, parts, transportation, accommodation, otherCharges, discount,
        totalAmount,
      },
    });
    return NextResponse.json(record, { status: 201 });
  } catch (err: unknown) {
    console.error('[BILLING CREATE ERROR]', err);
    const code = (err as any)?.code;
    if (code === 'P2002') return NextResponse.json({ error: 'Duplicate record.' }, { status: 409 });
    if (code === 'P2003') return NextResponse.json({ error: 'Referenced record not found.' }, { status: 400 });
    return NextResponse.json({ error: 'Failed to create billing record' }, { status: 500 });
  }
}
