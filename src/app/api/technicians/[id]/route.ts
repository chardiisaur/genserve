import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
  try {
    const { id } = await params;
    const body = await req.json();
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
  try {
    const { id } = await params;
    // Check for active deployments — cannot delete a deployed technician
    const activeDeployments = await prisma.deployment.count({
      where: { technicianId: id, status: { in: ['Planned', 'Deployed'] } },
    });
    if (activeDeployments > 0) {
      return NextResponse.json({ error: `Cannot delete technician — ${activeDeployments} active deployment(s) exist. Complete or cancel them first.` }, { status: 409 });
    }
    // Service history (ServiceJob, PmsRecord, PartUsed, Expense) will have their
    // technicianId set to NULL via SetNull referential action — history is preserved.
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
