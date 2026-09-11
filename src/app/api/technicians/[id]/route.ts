import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const tech = await prisma.technician.findUnique({ where: { technicianId: id } });
    if (!tech) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(tech);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch technician' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const tech = await prisma.technician.update({ where: { technicianId: id }, data: body });
    return NextResponse.json(tech);
  } catch {
    return NextResponse.json({ error: 'Failed to update technician' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.technician.delete({ where: { technicianId: id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete technician' }, { status: 500 });
  }
}
