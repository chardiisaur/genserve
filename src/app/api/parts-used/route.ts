import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, isNextResponse, ROLES } from '@/lib/rbac';
import { computeReorderStatus } from '../parts/route';

function newUsageId(): string {
  return `pu-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (isNextResponse(auth)) return auth;
  try {
    const { searchParams } = new URL(req.url);
    const jobOrderNo = searchParams.get('jobOrderNo');
    const generatorId = searchParams.get('generatorId');
    const technicianId = searchParams.get('technicianId');

    let where: Record<string, unknown> = {};
    if (jobOrderNo) where.jobOrderNo = jobOrderNo;
    if (generatorId) where.generatorId = generatorId;
    if (technicianId) where.technicianId = technicianId;

    // FIELD_TECHNICIAN: only see parts used on their assigned jobs
    if (auth.role === ROLES.FIELD_TECHNICIAN) {
      const assignedJobs = await prisma.serviceJob.findMany({
        where: {
          OR: [
            { leadTechnicianId: auth.id },
            { additionalTechnicianId: auth.id },
          ],
        },
        select: { jobOrderNo: true },
      });
      const assignedJobNos = assignedJobs.map((j) => j.jobOrderNo);
      where = { ...where, jobOrderNo: { in: assignedJobNos } };
    }

    const partsUsed = await prisma.partUsed.findMany({
      where,
      orderBy: { dateUsed: 'desc' },
      include: {
        serviceJob: {
          select: {
            jobOrderNo: true,
            client: { select: { clientName: true } },
            site: { select: { siteName: true } },
          },
        },
        generator: { select: { assetNo: true, brand: true, model: true } },
        part: { select: { partDescription: true, partNo: true, unit: true } },
        technician: { select: { technicianName: true } },
      },
    });

    const result = partsUsed.map((p) => ({
      ...p,
      clientName: p.serviceJob?.client?.clientName ?? '',
      siteName: p.serviceJob?.site?.siteName ?? '',
      generatorLabel: p.generator
        ? `${p.generator.assetNo} / ${p.generator.brand} ${p.generator.model}`.trim()
        : '',
      technicianName: p.technician?.technicianName ?? '',
      partUnit: p.part?.unit ?? '',
    }));

    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error('[PARTS USED GET ERROR]', err);
    return NextResponse.json({ error: 'Failed to fetch parts used' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (isNextResponse(auth)) return auth;
  try {
    const body = await req.json();
    const { jobOrderNo, generatorId, partId, dateUsed } = body;

    if (!jobOrderNo?.trim() || !generatorId?.trim() || !partId?.trim() || !dateUsed?.trim()) {
      return NextResponse.json(
        { error: 'jobOrderNo, generatorId, partId, and dateUsed are required' },
        { status: 400 }
      );
    }

    const qty = Number(body.qty);
    if (isNaN(qty) || qty < 1 || !Number.isInteger(qty)) {
      return NextResponse.json({ error: 'qty must be a positive integer' }, { status: 400 });
    }

    // Validate job exists
    const job = await prisma.serviceJob.findUnique({ where: { jobOrderNo } });
    if (!job) return NextResponse.json({ error: 'Service job not found.' }, { status: 400 });

    // FIELD_TECHNICIAN: can only add parts to their assigned jobs
    if (auth.role === ROLES.FIELD_TECHNICIAN) {
      if (job.leadTechnicianId !== auth.id && job.additionalTechnicianId !== auth.id) {
        return NextResponse.json({ error: 'Forbidden — you are not assigned to this job' }, { status: 403 });
      }
    }

    // Validate generator
    const generator = await prisma.generator.findUnique({ where: { generatorId } });
    if (!generator) return NextResponse.json({ error: 'Generator not found.' }, { status: 400 });

    // Validate technician if provided
    if (body.technicianId) {
      const tech = await prisma.technician.findUnique({ where: { technicianId: body.technicianId } });
      if (!tech) return NextResponse.json({ error: 'Technician not found.' }, { status: 400 });
    }

    // Perform transactional: validate stock, deduct, create PartUsed record
    const result = await prisma.$transaction(async (tx) => {
      // Lock and fetch part within transaction
      const part = await tx.partInventory.findUnique({ where: { partId } });
      if (!part) throw new Error('Part not found.');
      if (part.status === 'Inactive') throw new Error('Part is inactive and cannot be used.');

      // Validate sufficient stock
      if (part.stockQty < qty) {
        throw new Error(`Insufficient stock. Available: ${part.stockQty} ${part.unit}, Requested: ${qty}`);
      }

      const unitCost = body.unitCost !== undefined ? Number(body.unitCost) : part.unitCost;
      const sellingPrice = body.sellingPrice !== undefined ? Number(body.sellingPrice) : part.sellingPrice;
      const totalCost = qty * unitCost;
      const totalSelling = qty * sellingPrice;

      // Deduct stock
      const newStockQty = part.stockQty - qty;
      const newReorderStatus = computeReorderStatus(newStockQty, part.minimumStock);

      await tx.partInventory.update({
        where: { partId },
        data: {
          stockQty: newStockQty,
          reorderStatus: newReorderStatus,
        },
      });

      // Create PartUsed record
      const partUsed = await tx.partUsed.create({
        data: {
          usageId: newUsageId(),
          jobOrderNo,
          generatorId,
          partId,
          partNo: part.partNo,
          partDescription: part.partDescription,
          qty,
          unitCost,
          sellingPrice,
          totalCost,
          totalSelling,
          dateUsed,
          technicianId: body.technicianId ?? null,
          remarks: body.remarks ?? '',
        },
      });

      return { partUsed, updatedPart: { stockQty: newStockQty, reorderStatus: newReorderStatus } };
    });

    return NextResponse.json(result.partUsed, { status: 201 });
  } catch (err: unknown) {
    console.error('[PARTS USED CREATE ERROR]', err);
    const message = (err as Error).message || '';
    if (message.includes('Insufficient stock') || message.includes('inactive') || message.includes('not found')) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    const code = (err as any)?.code;
    if (code === 'P2002') return NextResponse.json({ error: 'Duplicate record.' }, { status: 409 });
    if (code === 'P2003') return NextResponse.json({ error: 'Referenced record not found.' }, { status: 400 });
    return NextResponse.json({ error: 'Failed to create parts used record' }, { status: 500 });
  }
}
