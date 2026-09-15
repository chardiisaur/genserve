import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/** Collision-safe generator ID */
function newGeneratorId(): string {
  return `gen-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export async function GET() {
  try {
    const generators = await prisma.generator.findMany({ orderBy: { generatorId: 'asc' } });
    return NextResponse.json(generators);
  } catch (err: unknown) {
    console.error('[GENERATOR GET ERROR]', err);
    return NextResponse.json({ error: 'Failed to fetch generators' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.clientId || !body.siteId) {
      return NextResponse.json({ error: 'clientId and siteId are required' }, { status: 400 });
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
