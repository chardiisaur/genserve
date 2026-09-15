import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireManagerOrAbove, isNextResponse } from '@/lib/rbac';

/** Collision-safe generator ID */
function newGeneratorId(): string {
  return `gen-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (isNextResponse(auth)) return auth;
  try {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId');
    const siteId = searchParams.get('siteId');
    const where: Record<string, string> = {};
    if (clientId) where.clientId = clientId;
    if (siteId) where.siteId = siteId;
    const generators = await prisma.generator.findMany({
      where,
      orderBy: { generatorId: 'asc' },
      include: {
        client: { select: { clientName: true } },
        site: { select: { siteName: true } },
      },
    });
    const result = generators.map((g) => ({
      ...g,
      clientName: g.client?.clientName ?? g.clientId,
      siteName: g.site?.siteName ?? g.siteId,
    }));
    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error('[GENERATOR GET ERROR]', err);
    return NextResponse.json({ error: 'Failed to fetch generators' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireManagerOrAbove();
  if (isNextResponse(auth)) return auth;
  try {
    const body = await req.json();
    if (!body.clientId?.trim() || !body.siteId?.trim()) {
      return NextResponse.json({ error: 'clientId and siteId are required' }, { status: 400 });
    }
    // Validate site belongs to client
    const site = await prisma.site.findUnique({ where: { siteId: body.siteId } });
    if (!site) return NextResponse.json({ error: 'Site not found.' }, { status: 400 });
    if (site.clientId !== body.clientId) {
      return NextResponse.json({ error: 'Site does not belong to the selected client.' }, { status: 400 });
    }

    const generator = await prisma.generator.create({
      data: { generatorId: newGeneratorId(), ...body },
    });
    return NextResponse.json(generator, { status: 201 });
  } catch (err: unknown) {
    console.error('[GENERATOR CREATE ERROR]', err);
    const code = (err as any)?.code;
    if (code === 'P2002') return NextResponse.json({ error: 'Duplicate record.' }, { status: 409 });
    if (code === 'P2003') return NextResponse.json({ error: 'Referenced client or site not found.' }, { status: 400 });
    return NextResponse.json({ error: 'Failed to create generator' }, { status: 500 });
  }
}
