import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const clients = await prisma.client.findMany({ orderBy: { clientName: 'asc' } });
    return NextResponse.json(clients);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const client = await prisma.client.create({
      data: {
        clientId: `cli-${Date.now()}`,
        ...body,
      },
    });
    return NextResponse.json(client, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 });
  }
}
