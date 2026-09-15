import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireManagerOrAbove, isNextResponse } from '@/lib/rbac';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (isNextResponse(auth)) return auth;
  try {
    const { id } = await params;
    const part = await prisma.partInventory.findUnique({ where: { partId: id } });
    if (!part) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(part);
  } catch (err: unknown) {
    console.error('[PARTS GET BY ID ERROR]', err);
    return NextResponse.json({ error: 'Failed to fetch part' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireManagerOrAbove();
  if (isNextResponse(auth)) return auth;
  try {
    const { id } = await params;
    const body = await req.json();
    if (body.partDescription !== undefined && !body.partDescription?.trim()) {
      return NextResponse.json({ error: 'partDescription cannot be empty' }, { status: 400 });
    }
    if (body.partNo !== undefined && !body.partNo?.trim()) {
      return NextResponse.json({ error: 'partNo cannot be empty' }, { status: 400 });
    }
    if (body.stockQty !== undefined && (isNaN(Number(body.stockQty)) || Number(body.stockQty) < 0)) {
      return NextResponse.json({ error: 'stockQty must be a non-negative number' }, { status: 400 });
    }
    if (body.minimumStock !== undefined && (isNaN(Number(body.minimumStock)) || Number(body.minimumStock) < 0)) {
      return NextResponse.json({ error: 'minimumStock must be a non-negative number' }, { status: 400 });
    }
    const part = await prisma.partInventory.update({ where: { partId: id }, data: body });
    return NextResponse.json(part);
  } catch (err: unknown) {
    console.error('[PARTS UPDATE ERROR]', err);
    const code = (err as any)?.code;
    if (code === 'P2025') return NextResponse.json({ error: 'Part not found.' }, { status: 404 });
    return NextResponse.json({ error: 'Failed to update part' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireManagerOrAbove();
  if (isNextResponse(auth)) return auth;
  try {
    const { id } = await params;
    const usageCount = await prisma.partUsed.count({ where: { partId: id } });
    if (usageCount > 0) return NextResponse.json({ error: `Cannot delete part — ${usageCount} usage record(s) exist. Service history must be preserved.` }, { status: 409 });
    await prisma.partInventory.delete({ where: { partId: id } });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('[PARTS DELETE ERROR]', err);
    const code = (err as any)?.code;
    if (code === 'P2025') return NextResponse.json({ error: 'Part not found.' }, { status: 404 });
    if (code === 'P2003') return NextResponse.json({ error: 'Cannot delete — referenced by other records.' }, { status: 409 });
    return NextResponse.json({ error: 'Failed to delete part' }, { status: 500 });
  }
}
