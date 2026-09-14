import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const deployments = await prisma.deployment.findMany({ orderBy: { departureDate: 'desc' } });
    return NextResponse.json(deployments);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch deployments' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const deployment = await prisma.deployment.create({
      data: { deploymentId: `dep-${Date.now()}`, ...body },
    });
    return NextResponse.json(deployment, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create deployment' }, { status: 500 });
  }
}
