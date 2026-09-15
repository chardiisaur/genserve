import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/** Collision-safe deployment ID */
function newDeploymentId(): string {
  return `dep-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export async function GET() {
  try {
    const deployments = await prisma.deployment.findMany({ orderBy: { departureDate: 'desc' } });
    return NextResponse.json(deployments);
  } catch (err: unknown) {
    console.error('[DEPLOYMENT GET ERROR]', err);
    return NextResponse.json({ error: 'Failed to fetch deployments' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.jobOrderNo || !body.technicianId || !body.departureDate) {
      return NextResponse.json({ error: 'jobOrderNo, technicianId, and departureDate are required' }, { status: 400 });
    }
    const deployment = await prisma.deployment.create({
      data: { deploymentId: newDeploymentId(), ...body },
    });
    return NextResponse.json(deployment, { status: 201 });
  } catch (err: unknown) {
    console.error('[DEPLOYMENT CREATE ERROR]', err);
    const code = (err as any)?.code;
    if (code === 'P2002') return NextResponse.json({ error: 'Duplicate record.' }, { status: 409 });
    if (code === 'P2003') return NextResponse.json({ error: 'Referenced record not found.' }, { status: 400 });
    return NextResponse.json({ error: 'Failed to create deployment' }, { status: 500 });
  }
}
