import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireManagerOrAbove, isNextResponse } from '@/lib/rbac';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (isNextResponse(auth)) return auth;
  try {
    const { id } = await params;
    const site = await prisma.site.findUnique({ where: { siteId: id } });
    if (!site) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(site);
  } catch (err: unknown) {
    console.error('[SITE GET BY ID ERROR]', err);
    return NextResponse.json({ error: 'Failed to fetch site' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireManagerOrAbove();
  if (isNextResponse(auth)) return auth;
  try {
    const { id } = await params;
    const body = await req.json();
    if (body.siteName !== undefined && !body.siteName?.trim()) {
      return NextResponse.json({ error: 'siteName cannot be empty' }, { status: 400 });
    }
    const site = await prisma.site.update({ where: { siteId: id }, data: body });
    return NextResponse.json(site);
  } catch (err: unknown) {
    console.error('[SITE UPDATE ERROR]', err);
    const code = (err as any)?.code;
    if (code === 'P2025') return NextResponse.json({ error: 'Site not found.' }, { status: 404 });
    return NextResponse.json({ error: 'Failed to update site' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireManagerOrAbove();
  if (isNextResponse(auth)) return auth;
  try {
    const { id } = await params;
    const [generatorCount, jobCount, pmsCount] = await Promise.all([
      prisma.generator.count({ where: { siteId: id } }),
      prisma.serviceJob.count({ where: { siteId: id } }),
      prisma.pmsRecord.count({ where: { siteId: id } }),
    ]);
    if (generatorCount > 0) return NextResponse.json({ error: `Cannot delete site — ${generatorCount} generator(s) exist. Remove them first.` }, { status: 409 });
    if (jobCount > 0) return NextResponse.json({ error: `Cannot delete site — ${jobCount} service job(s) exist. Service history must be preserved.` }, { status: 409 });
    if (pmsCount > 0) return NextResponse.json({ error: `Cannot delete site — ${pmsCount} PMS record(s) exist. Service history must be preserved.` }, { status: 409 });

    await prisma.site.delete({ where: { siteId: id } });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('[SITE DELETE ERROR]', err);
    const code = (err as any)?.code;
    if (code === 'P2025') return NextResponse.json({ error: 'Site not found.' }, { status: 404 });
    if (code === 'P2003') return NextResponse.json({ error: 'Cannot delete — referenced by other records.' }, { status: 409 });
    return NextResponse.json({ error: 'Failed to delete site' }, { status: 500 });
  }
}
