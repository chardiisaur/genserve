import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const parts = await prisma.partInventory.findMany({ orderBy: { partDescription: 'asc' } });
    return NextResponse.json(parts);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch parts' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const part = await prisma.partInventory.create({
      data: { partId: `pt-${Date.now()}`, ...body },
    });
    return NextResponse.json(part, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create part' }, { status: 500 });
  }
}
