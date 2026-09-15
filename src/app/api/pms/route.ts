import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireManagerOrAbove, isNextResponse, ROLES } from '@/lib/rbac';

/** Collision-safe PMS record ID */
function newPmsRecordId(): string {
  return `pms-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (isNextResponse(auth)) return auth;
  try {
    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get('status');
    const generatorFilter = searchParams.get('generatorId');
    const technicianFilter = searchParams.get('technicianId');
    const search = searchParams.get('search');

    const where: Record<string, unknown> = {};
    if (statusFilter) where.pmsStatus = statusFilter;
    if (generatorFilter) where.generatorId = generatorFilter;
    if (technicianFilter) where.technicianId = technicianFilter;

    // FIELD_TECHNICIAN: only see PMS records assigned to them
    if (auth.role === ROLES.FIELD_TECHNICIAN) {
      where.technicianId = auth.id;
    }

    const records = await prisma.pmsRecord.findMany({
      where,
      orderBy: { pmsDate: 'desc' },
      include: {
        generator: { select: { generatorId: true, brand: true, model: true, assetNo: true } },
        client: { select: { clientId: true, clientName: true } },
        site: { select: { siteId: true, siteName: true } },
        technician: { select: { technicianId: true, technicianName: true } },
      },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const enriched = records.map(r => {
      let computedStatus = r.pmsStatus;
      if (r.pmsStatus === 'Scheduled' && r.nextPmsDate) {
        const nextDate = new Date(r.nextPmsDate);
        if (!isNaN(nextDate.getTime()) && nextDate < today) {
          computedStatus = 'Overdue';
        }
      }

      let daysUntilNextPms: number | null = null;
      if (r.nextPmsDate) {
        const nextDate = new Date(r.nextPmsDate);
        if (!isNaN(nextDate.getTime())) {
          daysUntilNextPms = Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        }
      }

      return {
        ...r,
        pmsStatus: computedStatus,
        clientName: r.client?.clientName ?? r.clientId,
        siteName: r.site?.siteName ?? r.siteId,
        generatorLabel: r.generator ? `${r.generator.brand} ${r.generator.model}`.trim() || r.generatorId : r.generatorId,
        technicianName: r.technician?.technicianName ?? null,
        daysUntilNextPms,
        isUpcoming: daysUntilNextPms !== null && daysUntilNextPms >= 0 && daysUntilNextPms <= 30,
      };
    });

    let result = enriched;
    if (search) {
      const q = search.toLowerCase();
      result = enriched.filter(r =>
        r.pmsRecordId.toLowerCase().includes(q) ||
        r.generatorId.toLowerCase().includes(q) ||
        r.clientName.toLowerCase().includes(q) ||
        r.siteName.toLowerCase().includes(q) ||
        (r.technicianName ?? '').toLowerCase().includes(q) ||
        r.generatorLabel.toLowerCase().includes(q) ||
        r.pmsType.toLowerCase().includes(q)
      );
    }

    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error('[PMS GET ERROR]', err);
    return NextResponse.json({ error: 'Failed to fetch PMS records' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireManagerOrAbove();
  if (isNextResponse(auth)) return auth;
  try {
    const body = await req.json();

    if (!body.generatorId || !body.clientId || !body.siteId || !body.pmsDate) {
      return NextResponse.json({ error: 'generatorId, clientId, siteId, and pmsDate are required' }, { status: 400 });
    }

    const generator = await prisma.generator.findUnique({ where: { generatorId: body.generatorId } });
    if (!generator) return NextResponse.json({ error: 'Generator not found.' }, { status: 400 });
    if (generator.clientId !== body.clientId) return NextResponse.json({ error: 'Generator does not belong to the selected client.' }, { status: 400 });
    if (generator.siteId !== body.siteId) return NextResponse.json({ error: 'Generator does not belong to the selected site.' }, { status: 400 });

    if (body.technicianId) {
      const tech = await prisma.technician.findUnique({ where: { technicianId: body.technicianId } });
      if (!tech) return NextResponse.json({ error: 'Technician not found.' }, { status: 400 });
    }

    const {
      clientName, siteName, generatorLabel, technicianName, daysUntilNextPms, isUpcoming,
      generator: _gen, client: _cli, site: _sit, technician: _tech,
      id: _id, createdAt: _ca, updatedAt: _ua,
      ...rest
    } = body;

    const data = {
      ...rest,
      pmsRecordId: newPmsRecordId(),
      technicianId: body.technicianId || null,
      runningHours: Number(body.runningHours) || 0,
      nextPmsHours: Number(body.nextPmsHours) || 0,
    };

    const record = await prisma.pmsRecord.create({ data });
    return NextResponse.json(record, { status: 201 });
  } catch (err: unknown) {
    console.error('[PMS CREATE ERROR]', err);
    const code = (err as any)?.code;
    if (code === 'P2002') return NextResponse.json({ error: 'Duplicate record.' }, { status: 409 });
    if (code === 'P2003') return NextResponse.json({ error: 'Referenced record not found.' }, { status: 400 });
    return NextResponse.json({ error: 'Failed to create PMS record' }, { status: 500 });
  }
}
