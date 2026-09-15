import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/** Collision-safe part ID */
function newPartId(): string {
  return `pt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export async function GET() {
  try {
    const parts = await prisma.partInventory.findMany({ orderBy: { partDescription: 'asc' } });
    return NextResponse.json(parts);
  } catch (err: unknown) {
    console.error('[PARTS GET ERROR]', err);
    return NextResponse.json({ error: 'Failed to fetch parts' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.partDescription || !body.partNo) {
      return NextResponse.json({ error: 'partNo and partDescription are required' }, { status: 400 });
    }
    const part = await prisma.partInventory.create({
      data: { partId: newPartId(), ...body },
    });
    return NextResponse.json(part, { status: 201 });
  } catch (err: unknown) {
    console.error('[PARTS CREATE ERROR]', err);
    const code = (err as any)?.code;
    if (code === 'P2002') return NextResponse.json({ error: 'Duplicate record.' }, { status: 409 });
    return NextResponse.json({ error: 'Failed to create part' }, { status: 500 });
  }
}
