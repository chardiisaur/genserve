import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/** Collision-safe client ID: prefix + timestamp ms + 4-char random suffix */
function newClientId(): string {
  return `cli-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export async function GET() {
  try {
    const clients = await prisma.client.findMany({ orderBy: { clientName: 'asc' } });
    return NextResponse.json(clients);
  } catch (err: unknown) {
    console.error('[CLIENT GET ERROR]', err);
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.clientName) {
      return NextResponse.json({ error: 'clientName is required' }, { status: 400 });
    }
    const client = await prisma.client.create({
      data: { clientId: newClientId(), ...body },
    });
    return NextResponse.json(client, { status: 201 });
  } catch (err: unknown) {
    console.error('[CLIENT CREATE ERROR]', err);
    const code = (err as any)?.code;
    if (code === 'P2002') return NextResponse.json({ error: 'Duplicate record.' }, { status: 409 });
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 });
  }
}
