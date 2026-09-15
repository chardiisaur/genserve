import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireManagerOrAbove, isNextResponse } from '@/lib/rbac';

function newSiteId(): string {
  return `site-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (isNextResponse(auth)) return auth;
  try {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId');
    const where = clientId ? { clientId } : {};
    const sites = await prisma.site.findMany({ where, orderBy: { siteName: 'asc' } });
    return NextResponse.json(sites);
  } catch (err: unknown) {
    console.error('[SITES GET ERROR]', err);
    return NextResponse.json({ error: 'Failed to fetch sites' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireManagerOrAbove();
  if (isNextResponse(auth)) return auth;
  try {
    const body = await req.json();
    if (!body.clientId?.trim() || !body.siteName?.trim()) {
      return NextResponse.json({ error: 'clientId and siteName are required' }, { status: 400 });
    }
    // Verify client exists
    const client = await prisma.client.findUnique({ where: { clientId: body.clientId } });
    if (!client) return NextResponse.json({ error: 'Client not found.' }, { status: 400 });

    const site = await prisma.site.create({
      data: { siteId: newSiteId(), ...body },
    });
    return NextResponse.json(site, { status: 201 });
  } catch (err: unknown) {
    console.error('[SITE CREATE ERROR]', err);
    const code = (err as any)?.code;
    if (code === 'P2002') return NextResponse.json({ error: 'Duplicate record.' }, { status: 409 });
    if (code === 'P2003') return NextResponse.json({ error: 'Referenced client not found.' }, { status: 400 });
    return NextResponse.json({ error: 'Failed to create site' }, { status: 500 });
  }
}
