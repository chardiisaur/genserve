import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireManagerOrAbove, isNextResponse } from '@/lib/rbac';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (isNextResponse(auth)) return auth;
  try {
    const { id } = await params;
    const tech = await prisma.technician.findUnique({ where: { technicianId: id } });
    if (!tech) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(tech);
  } catch (err: unknown) {
    console.error('[TECHNICIAN GET BY ID ERROR]', err);
    return NextResponse.json({ error: 'Failed to fetch technician' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireManagerOrAbove();
  if (isNextResponse(auth)) return auth;
  try {
    const { id } = await params;
    const body = await req.json();
    if (body.technicianName !== undefined && !body.technicianName?.trim()) {
      return NextResponse.json({ error: 'technicianName cannot be empty' }, { status: 400 });
    }
    const tech = await prisma.technician.update({ where: { technicianId: id }, data: body });
    return NextResponse.json(tech);
  } catch (err: unknown) {
    console.error('[TECHNICIAN UPDATE ERROR]', err);
    const code = (err as any)?.code;
    if (code === 'P2025') return NextResponse.json({ error: 'Technician not found.' }, { status: 404 });
    return NextResponse.json({ error: 'Failed to update technician' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireManagerOrAbove();
  if (isNextResponse(auth)) return auth;
  try {
    const { id } = await params;
    const activeDeployments = await prisma.deployment.count({
      where: { technicianId: id, status: { in: ['Planned', 'Deployed'] } },
    });
    if (activeDeployments > 0) {
      return NextResponse.json({ error: `Cannot delete technician — ${activeDeployments} active deployment(s) exist. Complete or cancel them first.` }, { status: 409 });
    }
    await prisma.technician.delete({ where: { technicianId: id } });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('[TECHNICIAN DELETE ERROR]', err);
    const code = (err as any)?.code;
    if (code === 'P2025') return NextResponse.json({ error: 'Technician not found.' }, { status: 404 });
    if (code === 'P2003') return NextResponse.json({ error: 'Cannot delete — referenced by other records.' }, { status: 409 });
    return NextResponse.json({ error: 'Failed to delete technician' }, { status: 500 });
  }
}
