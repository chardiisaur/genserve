import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireManagerOrAbove, isNextResponse } from '@/lib/rbac';

/** Collision-safe deployment ID */
function newDeploymentId(): string {
  return `dep-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

const VALID_DEPLOYMENT_STATUSES = ['Planned', 'Deployed', 'Returned', 'Cancelled'];

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (isNextResponse(auth)) return auth;
  try {
    const { searchParams } = new URL(req.url);
    const jobOrderNo = searchParams.get('jobOrderNo');
    const technicianId = searchParams.get('technicianId');
    const clientId = searchParams.get('clientId');

    const where: Record<string, unknown> = {};
    if (jobOrderNo) where.jobOrderNo = jobOrderNo;
    if (technicianId) where.technicianId = technicianId;
    if (clientId) where.clientId = clientId;

    const deployments = await prisma.deployment.findMany({
      where,
      orderBy: { departureDate: 'desc' },
      include: {
        serviceJob: {
          select: {
            jobOrderNo: true,
            client: { select: { clientName: true } },
            site: { select: { siteName: true } },
          },
        },
        technician: { select: { technicianName: true } },
      },
    });

    const result = deployments.map((d) => ({
      ...d,
      clientName: d.serviceJob?.client?.clientName ?? d.clientId,
      siteName: d.serviceJob?.site?.siteName ?? d.siteId,
      technicianName: d.technician?.technicianName ?? d.technicianId,
    }));

    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error('[DEPLOYMENT GET ERROR]', err);
    return NextResponse.json({ error: 'Failed to fetch deployments' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireManagerOrAbove();
  if (isNextResponse(auth)) return auth;
  try {
    const body = await req.json();
    if (!body.jobOrderNo?.trim() || !body.technicianId?.trim() || !body.departureDate?.trim()) {
      return NextResponse.json({ error: 'jobOrderNo, technicianId, and departureDate are required' }, { status: 400 });
    }
    if (body.status && !VALID_DEPLOYMENT_STATUSES.includes(body.status)) {
      return NextResponse.json({ error: `Invalid status: ${body.status}` }, { status: 400 });
    }
    // Validate job and technician exist
    const [job, tech] = await Promise.all([
      prisma.serviceJob.findUnique({ where: { jobOrderNo: body.jobOrderNo } }),
      prisma.technician.findUnique({ where: { technicianId: body.technicianId } }),
    ]);
    if (!job) return NextResponse.json({ error: 'Service job not found.' }, { status: 400 });
    if (!tech) return NextResponse.json({ error: 'Technician not found.' }, { status: 400 });

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
