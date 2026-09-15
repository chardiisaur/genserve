import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, isNextResponse } from '@/lib/rbac';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (isNextResponse(auth)) return auth;
  try {
    const { id } = await params;
    const client = await prisma.client.findUnique({ where: { clientId: id } });
    if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(client);
  } catch (err: unknown) {
    console.error('[CLIENT GET BY ID ERROR]', err);
    return NextResponse.json({ error: 'Failed to fetch client' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (isNextResponse(auth)) return auth;
  try {
    const { id } = await params;
    const body = await req.json();
    const client = await prisma.client.update({ where: { clientId: id }, data: body });
    return NextResponse.json(client);
  } catch (err: unknown) {
    console.error('[CLIENT UPDATE ERROR]', err);
    const code = (err as any)?.code;
    if (code === 'P2025') return NextResponse.json({ error: 'Client not found.' }, { status: 404 });
    return NextResponse.json({ error: 'Failed to update client' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (isNextResponse(auth)) return auth;
  try {
    const { id } = await params;
    const [siteCount, generatorCount, jobCount, pmsCount] = await Promise.all([
      prisma.site.count({ where: { clientId: id } }),
      prisma.generator.count({ where: { clientId: id } }),
      prisma.serviceJob.count({ where: { clientId: id } }),
      prisma.pmsRecord.count({ where: { clientId: id } }),
    ]);
    if (siteCount > 0) return NextResponse.json({ error: `Cannot delete client — ${siteCount} site(s) exist. Remove them first.` }, { status: 409 });
    if (generatorCount > 0) return NextResponse.json({ error: `Cannot delete client — ${generatorCount} generator(s) exist. Remove them first.` }, { status: 409 });
    if (jobCount > 0) return NextResponse.json({ error: `Cannot delete client — ${jobCount} service job(s) exist. Service history must be preserved.` }, { status: 409 });
    if (pmsCount > 0) return NextResponse.json({ error: `Cannot delete client — ${pmsCount} PMS record(s) exist. Service history must be preserved.` }, { status: 409 });

    await prisma.client.delete({ where: { clientId: id } });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('[CLIENT DELETE ERROR]', err);
    const code = (err as any)?.code;
    if (code === 'P2025') return NextResponse.json({ error: 'Client not found.' }, { status: 404 });
    if (code === 'P2003') return NextResponse.json({ error: 'Cannot delete — referenced by other records.' }, { status: 409 });
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 });
  }
}
