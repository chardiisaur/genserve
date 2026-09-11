import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const generators = await prisma.generator.findMany({ orderBy: { generatorId: 'asc' } });
    return NextResponse.json(generators);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch generators' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const generator = await prisma.generator.create({
      data: { generatorId: `gen-${Date.now()}`, ...body },
    });
    return NextResponse.json(generator, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create generator' }, { status: 500 });
  }
}
