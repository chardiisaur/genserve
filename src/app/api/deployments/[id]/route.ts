import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireManagerOrAbove, isNextResponse } from '@/lib/rbac';

const VALID_DEPLOYMENT_STATUSES = ['Planned', 'Deployed', 'Returned', 'Cancelled'];

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (isNextResponse(auth)) return auth;
  try {
    const { id } = await params;
    const dep = await prisma.deployment.findUnique({ where: { deploymentId: id } });
    if (!dep) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(dep);
  } catch (err: unknown) {
    console.error('[DEPLOYMENT GET BY ID ERROR]', err);
    return NextResponse.json({ error: 'Failed to fetch deployment' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireManagerOrAbove();
  if (isNextResponse(auth)) return auth;
  try {
    const { id } = await params;
    const body = await req.json();
    if (body.status && !VALID_DEPLOYMENT_STATUSES.includes(body.status)) {
      return NextResponse.json({ error: `Invalid status: ${body.status}` }, { status: 400 });
    }
    const dep = await prisma.deployment.update({ where: { deploymentId: id }, data: body });
    return NextResponse.json(dep);
  } catch (err: unknown) {
    console.error('[DEPLOYMENT UPDATE ERROR]', err);
    const code = (err as any)?.code;
    if (code === 'P2025') return NextResponse.json({ error: 'Deployment not found.' }, { status: 404 });
    return NextResponse.json({ error: 'Failed to update deployment' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireManagerOrAbove();
  if (isNextResponse(auth)) return auth;
  try {
    const { id } = await params;
    await prisma.deployment.delete({ where: { deploymentId: id } });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('[DEPLOYMENT DELETE ERROR]', err);
    const code = (err as any)?.code;
    if (code === 'P2025') return NextResponse.json({ error: 'Deployment not found.' }, { status: 404 });
    return NextResponse.json({ error: 'Failed to delete deployment' }, { status: 500 });
  }
}
