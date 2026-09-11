import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const gen = await prisma.generator.findUnique({ where: { generatorId: id } });
    if (!gen) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(gen);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch generator' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const gen = await prisma.generator.update({ where: { generatorId: id }, data: body });
    return NextResponse.json(gen);
  } catch {
    return NextResponse.json({ error: 'Failed to update generator' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.generator.delete({ where: { generatorId: id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete generator' }, { status: 500 });
  }
}
