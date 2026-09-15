import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireManagerOrAbove, isNextResponse } from '@/lib/rbac';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (isNextResponse(auth)) return auth;
  try {
    const { id } = await params;
    const model = await prisma.engineModel.findUnique({ where: { modelId: id } });
    if (!model) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(model);
  } catch (err: unknown) {
    console.error('[ENGINE MODEL GET BY ID ERROR]', err);
    return NextResponse.json({ error: 'Failed to fetch engine model' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireManagerOrAbove();
  if (isNextResponse(auth)) return auth;
  try {
    const { id } = await params;
    const body = await req.json();

    if (body.brand !== undefined && !body.brand?.trim()) {
      return NextResponse.json({ error: 'brand cannot be empty' }, { status: 400 });
    }
    if (body.engineModel !== undefined && !body.engineModel?.trim()) {
      return NextResponse.json({ error: 'engineModel cannot be empty' }, { status: 400 });
    }
    if (body.recommendedPmsInterval !== undefined && (isNaN(Number(body.recommendedPmsInterval)) || Number(body.recommendedPmsInterval) < 1)) {
      return NextResponse.json({ error: 'recommendedPmsInterval must be a positive number' }, { status: 400 });
    }

    const { id: _id, modelId: _mid, createdAt: _ca, ...cleanBody } = body;
    const model = await prisma.engineModel.update({
      where: { modelId: id },
      data: {
        ...cleanBody,
        ...(body.recommendedPmsInterval !== undefined ? { recommendedPmsInterval: Number(body.recommendedPmsInterval) } : {}),
      },
    });
    return NextResponse.json(model);
  } catch (err: unknown) {
    console.error('[ENGINE MODEL UPDATE ERROR]', err);
    const code = (err as any)?.code;
    if (code === 'P2025') return NextResponse.json({ error: 'Engine model not found.' }, { status: 404 });
    return NextResponse.json({ error: 'Failed to update engine model' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireManagerOrAbove();
  if (isNextResponse(auth)) return auth;
  try {
    const { id } = await params;
    await prisma.engineModel.delete({ where: { modelId: id } });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('[ENGINE MODEL DELETE ERROR]', err);
    const code = (err as any)?.code;
    if (code === 'P2025') return NextResponse.json({ error: 'Engine model not found.' }, { status: 404 });
    return NextResponse.json({ error: 'Failed to delete engine model' }, { status: 500 });
  }
}
