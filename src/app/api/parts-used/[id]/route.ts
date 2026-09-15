import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireManagerOrAbove, isNextResponse } from '@/lib/rbac';
import { computeReorderStatus } from '../../parts/route';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (isNextResponse(auth)) return auth;
  try {
    const { id } = await params;
    const partUsed = await prisma.partUsed.findUnique({
      where: { usageId: id },
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
    if (!partUsed) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json({
      ...partUsed,
      clientName: partUsed.serviceJob?.client?.clientName ?? '',
      siteName: partUsed.serviceJob?.site?.siteName ?? '',
      generatorLabel: partUsed.generator
        ? `${partUsed.generator.assetNo} / ${partUsed.generator.brand} ${partUsed.generator.model}`.trim()
        : '',
      technicianName: partUsed.technician?.technicianName ?? '',
    });
  } catch (err: unknown) {
    console.error('[PARTS USED GET BY ID ERROR]', err);
    return NextResponse.json({ error: 'Failed to fetch parts used record' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireManagerOrAbove();
  if (isNextResponse(auth)) return auth;
  try {
    const { id } = await params;
    const body = await req.json();

    if (body.qty !== undefined && (isNaN(Number(body.qty)) || Number(body.qty) < 1)) {
      return NextResponse.json({ error: 'qty must be a positive integer' }, { status: 400 });
    }

    // Transactional update: adjust stock for qty change
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.partUsed.findUnique({ where: { usageId: id } });
      if (!existing) throw new Error('Parts used record not found.');

      const newQty = body.qty !== undefined ? Number(body.qty) : existing.qty;
      const qtyDiff = newQty - existing.qty; // positive = need more stock, negative = return stock

      if (qtyDiff !== 0) {
        const part = await tx.partInventory.findUnique({ where: { partId: existing.partId } });
        if (!part) throw new Error('Associated part not found.');

        const newStockQty = part.stockQty - qtyDiff;
        if (newStockQty < 0) {
          throw new Error(`Insufficient stock. Available: ${part.stockQty} ${part.unit}, Additional needed: ${qtyDiff}`);
        }

        const newReorderStatus = computeReorderStatus(newStockQty, part.minimumStock);
        await tx.partInventory.update({
          where: { partId: existing.partId },
          data: { stockQty: newStockQty, reorderStatus: newReorderStatus },
        });
      }

      const unitCost = body.unitCost !== undefined ? Number(body.unitCost) : existing.unitCost;
      const sellingPrice = body.sellingPrice !== undefined ? Number(body.sellingPrice) : existing.sellingPrice;

      const { id: _id, usageId: _uid, createdAt: _ca, serviceJob: _sj, generator: _g, part: _p, technician: _t, ...cleanBody } = body;

      return tx.partUsed.update({
        where: { usageId: id },
        data: {
          ...cleanBody,
          qty: newQty,
          unitCost,
          sellingPrice,
          totalCost: newQty * unitCost,
          totalSelling: newQty * sellingPrice,
        },
      });
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error('[PARTS USED UPDATE ERROR]', err);
    const message = (err as Error).message || '';
    if (message.includes('Insufficient stock') || message.includes('not found')) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    const code = (err as any)?.code;
    if (code === 'P2025') return NextResponse.json({ error: 'Parts used record not found.' }, { status: 404 });
    return NextResponse.json({ error: 'Failed to update parts used record' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireManagerOrAbove();
  if (isNextResponse(auth)) return auth;
  try {
    const { id } = await params;

    // Transactional delete: restore stock when reversing a PartUsed record
    await prisma.$transaction(async (tx) => {
      const existing = await tx.partUsed.findUnique({ where: { usageId: id } });
      if (!existing) throw new Error('Parts used record not found.');

      // Restore stock
      const part = await tx.partInventory.findUnique({ where: { partId: existing.partId } });
      if (part) {
        const restoredQty = part.stockQty + existing.qty;
        const newReorderStatus = computeReorderStatus(restoredQty, part.minimumStock);
        await tx.partInventory.update({
          where: { partId: existing.partId },
          data: { stockQty: restoredQty, reorderStatus: newReorderStatus },
        });
      }

      await tx.partUsed.delete({ where: { usageId: id } });
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('[PARTS USED DELETE ERROR]', err);
    const message = (err as Error).message || '';
    if (message.includes('not found')) {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    const code = (err as any)?.code;
    if (code === 'P2025') return NextResponse.json({ error: 'Parts used record not found.' }, { status: 404 });
    return NextResponse.json({ error: 'Failed to delete parts used record' }, { status: 500 });
  }
}
