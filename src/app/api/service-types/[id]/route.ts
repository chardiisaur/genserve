import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireAdmin, isNextResponse } from '@/lib/rbac';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (isNextResponse(auth)) return auth;
  try {
    const { id } = await params;
    const st = await prisma.serviceType.findUnique({ where: { serviceTypeId: id } });
    if (!st) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(st);
  } catch (err: unknown) {
    console.error('[SERVICE TYPE GET BY ID ERROR]', err);
    return NextResponse.json({ error: 'Failed to fetch service type' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (isNextResponse(auth)) return auth;
  try {
    const { id } = await params;
    const body = await req.json();

    if (body.serviceType !== undefined && !body.serviceType?.trim()) {
      return NextResponse.json({ error: 'serviceType cannot be empty' }, { status: 400 });
    }

    const { id: _id, serviceTypeId: _stid, createdAt: _ca, ...cleanBody } = body;
    const st = await prisma.serviceType.update({ where: { serviceTypeId: id }, data: cleanBody });
    return NextResponse.json(st);
  } catch (err: unknown) {
    console.error('[SERVICE TYPE UPDATE ERROR]', err);
    const code = (err as any)?.code;
    if (code === 'P2025') return NextResponse.json({ error: 'Service type not found.' }, { status: 404 });
    return NextResponse.json({ error: 'Failed to update service type' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (isNextResponse(auth)) return auth;
  try {
    const { id } = await params;
    // Check if any service jobs use this service type
    const st = await prisma.serviceType.findUnique({ where: { serviceTypeId: id } });
    if (!st) return NextResponse.json({ error: 'Service type not found.' }, { status: 404 });

    const jobCount = await prisma.serviceJob.count({ where: { serviceType: st.serviceType } });
    if (jobCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete service type — ${jobCount} service job(s) reference it.` },
        { status: 409 }
      );
    }

    await prisma.serviceType.delete({ where: { serviceTypeId: id } });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('[SERVICE TYPE DELETE ERROR]', err);
    const code = (err as any)?.code;
    if (code === 'P2025') return NextResponse.json({ error: 'Service type not found.' }, { status: 404 });
    return NextResponse.json({ error: 'Failed to delete service type' }, { status: 500 });
  }
}
