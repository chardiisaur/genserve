import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireManagerOrAbove, isNextResponse } from '@/lib/rbac';

export function computeReorderStatus(qty: number, min: number): string {
  if (qty <= 0) return 'Out of Stock';
  if (min > 0 && qty < min * 0.5) return 'Critical';
  if (min > 0 && qty < min) return 'Low Stock';
  return 'OK';
}

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (isNextResponse(auth)) return auth;
  try {
    const { searchParams } = new URL(req.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const where = includeInactive ? {} : { status: 'Active' };
    const parts = await prisma.partInventory.findMany({
      where,
      orderBy: { partDescription: 'asc' },
    });
    return NextResponse.json(parts);
  } catch (err: unknown) {
    console.error('[PARTS GET ERROR]', err);
    return NextResponse.json({ error: 'Failed to fetch parts' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireManagerOrAbove();
  if (isNextResponse(auth)) return auth;
  try {
    const body = await req.json();
    if (!body.partDescription?.trim() || !body.partNo?.trim()) {
      return NextResponse.json({ error: 'partNo and partDescription are required' }, { status: 400 });
    }
    const stockQty = Number(body.stockQty ?? 0);
    const minimumStock = Number(body.minimumStock ?? 0);
    if (isNaN(stockQty) || stockQty < 0) {
      return NextResponse.json({ error: 'stockQty must be a non-negative number' }, { status: 400 });
    }
    if (isNaN(minimumStock) || minimumStock < 0) {
      return NextResponse.json({ error: 'minimumStock must be a non-negative number' }, { status: 400 });
    }
    const partId = `pt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    // Always compute reorder status server-side — never trust client
    const reorderStatus = computeReorderStatus(stockQty, minimumStock);
    const {
      id: _id, partId: _pid, reorderStatus: _rs, createdAt: _ca, updatedAt: _ua,
      ...cleanBody
    } = body;
    const part = await prisma.partInventory.create({
      data: {
        partId,
        ...cleanBody,
        stockQty,
        minimumStock,
        unitCost: Number(body.unitCost ?? 0),
        sellingPrice: Number(body.sellingPrice ?? 0),
        reorderStatus,
        status: body.status ?? 'Active',
      },
    });
    return NextResponse.json(part, { status: 201 });
  } catch (err: unknown) {
    console.error('[PARTS CREATE ERROR]', err);
    const code = (err as any)?.code;
    if (code === 'P2002') return NextResponse.json({ error: 'Duplicate record.' }, { status: 409 });
    return NextResponse.json({ error: 'Failed to create part' }, { status: 500 });
  }
}
