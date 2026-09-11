import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const part = await prisma.partInventory.findUnique({ where: { partId: id } });
    if (!part) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(part);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch part' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const part = await prisma.partInventory.update({ where: { partId: id }, data: body });
    return NextResponse.json(part);
  } catch {
    return NextResponse.json({ error: 'Failed to update part' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.partInventory.delete({ where: { partId: id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete part' }, { status: 500 });
  }
}
