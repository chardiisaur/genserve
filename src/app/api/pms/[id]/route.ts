import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const record = await prisma.pmsRecord.findUnique({ where: { pmsRecordId: id } });
    if (!record) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(record);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch PMS record' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const record = await prisma.pmsRecord.update({ where: { pmsRecordId: id }, data: body });
    return NextResponse.json(record);
  } catch {
    return NextResponse.json({ error: 'Failed to update PMS record' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.pmsRecord.delete({ where: { pmsRecordId: id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete PMS record' }, { status: 500 });
  }
}
