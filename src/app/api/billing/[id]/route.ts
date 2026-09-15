import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireManagerOrAbove, isNextResponse } from '@/lib/rbac';

const VALID_BILLING_STATUSES = ['Pending', 'Quoted', 'Approved', 'Invoiced', 'Paid', 'Unpaid', 'Cancelled'];

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
  const auth = await requireManagerOrAbove();
  if (isNextResponse(auth)) return auth;
  try {
    const { id } = await params;
    const body = await req.json();
    if (body.billingStatus && !VALID_BILLING_STATUSES.includes(body.billingStatus)) {
      return NextResponse.json({ error: `Invalid billingStatus: ${body.billingStatus}` }, { status: 400 });
    }
    const labor = Number(body.labor) || 0;
    const parts = Number(body.parts) || 0;
    const transportation = Number(body.transportation) || 0;
    const accommodation = Number(body.accommodation) || 0;
    const otherCharges = Number(body.otherCharges) || 0;
    const discount = Number(body.discount) || 0;
    const totalAmount = labor + parts + transportation + accommodation + otherCharges - discount;
    const record = await prisma.quotationBilling.update({
      where: { transactionId: id },
      data: { ...body, labor, parts, transportation, accommodation, otherCharges, discount, totalAmount },
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
  const auth = await requireManagerOrAbove();
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
