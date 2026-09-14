import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const dep = await prisma.deployment.findUnique({ where: { deploymentId: id } });
    if (!dep) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(dep);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch deployment' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const dep = await prisma.deployment.update({ where: { deploymentId: id }, data: body });
    return NextResponse.json(dep);
  } catch {
    return NextResponse.json({ error: 'Failed to update deployment' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.deployment.delete({ where: { deploymentId: id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete deployment' }, { status: 500 });
  }
}
