import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, isNextResponse } from '@/lib/rbac';

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (isNextResponse(auth)) return auth;
  try {
    const quotations = await prisma.quotationBilling.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json(quotations);
  } catch (err: unknown) {
    console.error('[BILLING GET ERROR]', err);
    return NextResponse.json({ error: 'Failed to fetch billing records' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (isNextResponse(auth)) return auth;
  try {
    const body = await req.json();
    const { labor = 0, parts = 0, transportation = 0, accommodation = 0, otherCharges = 0, discount = 0 } = body;
    const totalAmount = labor + parts + transportation + accommodation + otherCharges - discount;
    const record = await prisma.quotationBilling.create({
      data: {
        transactionId: `txn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        ...body,
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
