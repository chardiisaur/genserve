import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireManagerOrAbove, isNextResponse } from '@/lib/rbac';

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (isNextResponse(auth)) return auth;
  try {
    const parts = await prisma.partInventory.findMany({ orderBy: { partDescription: 'asc' } });
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
    // Validate numeric fields
    if (body.stockQty !== undefined && (isNaN(Number(body.stockQty)) || Number(body.stockQty) < 0)) {
      return NextResponse.json({ error: 'stockQty must be a non-negative number' }, { status: 400 });
    }
    if (body.minimumStock !== undefined && (isNaN(Number(body.minimumStock)) || Number(body.minimumStock) < 0)) {
      return NextResponse.json({ error: 'minimumStock must be a non-negative number' }, { status: 400 });
    }
    const partId = `pt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const part = await prisma.partInventory.create({
      data: { partId, ...body },
    });
    return NextResponse.json(part, { status: 201 });
  } catch (err: unknown) {
    console.error('[PARTS CREATE ERROR]', err);
    const code = (err as any)?.code;
    if (code === 'P2002') return NextResponse.json({ error: 'Duplicate record.' }, { status: 409 });
    return NextResponse.json({ error: 'Failed to create part' }, { status: 500 });
  }
}
