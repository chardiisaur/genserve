import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const quotations = await prisma.quotationBilling.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json(quotations);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch billing records' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { labor = 0, parts = 0, transportation = 0, accommodation = 0, otherCharges = 0, discount = 0 } = body;
    const totalAmount = labor + parts + transportation + accommodation + otherCharges - discount;
    const record = await prisma.quotationBilling.create({
      data: {
        transactionId: `txn-${Date.now()}`,
        ...body,
        totalAmount,
      },
    });
    return NextResponse.json(record, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create billing record' }, { status: 500 });
  }
}
