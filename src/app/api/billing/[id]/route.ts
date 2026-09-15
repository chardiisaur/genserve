import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, isNextResponse } from '@/lib/rbac';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (isNextResponse(auth)) return auth;
  try {
    const { id } = await params;
    const record = await prisma.quotationBilling.findUnique({ where: { transactionId: id } });
    if (!record) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(record);
  } catch (err: unknown) {
    console.error('[BILLING GET BY ID ERROR]', err);
    return NextResponse.json({ error: 'Failed to fetch billing record' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (isNextResponse(auth)) return auth;
  try {
    const { id } = await params;
    const body = await req.json();
    const { labor = 0, parts = 0, transportation = 0, accommodation = 0, otherCharges = 0, discount = 0 } = body;
    const totalAmount = labor + parts + transportation + accommodation + otherCharges - discount;
    const record = await prisma.quotationBilling.update({
      where: { transactionId: id },
      data: { ...body, totalAmount },
    });
    return NextResponse.json(record);
  } catch (err: unknown) {
    console.error('[BILLING UPDATE ERROR]', err);
    const code = (err as any)?.code;
    if (code === 'P2025') return NextResponse.json({ error: 'Billing record not found.' }, { status: 404 });
    return NextResponse.json({ error: 'Failed to update billing record' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (isNextResponse(auth)) return auth;
  try {
    const { id } = await params;
    await prisma.quotationBilling.delete({ where: { transactionId: id } });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('[BILLING DELETE ERROR]', err);
    const code = (err as any)?.code;
    if (code === 'P2025') return NextResponse.json({ error: 'Billing record not found.' }, { status: 404 });
    return NextResponse.json({ error: 'Failed to delete billing record' }, { status: 500 });
  }
}
