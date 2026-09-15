import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireManagerOrAbove, isNextResponse } from '@/lib/rbac';

function newModelId(): string {
  return `em-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (isNextResponse(auth)) return auth;
  try {
    const { searchParams } = new URL(req.url);
    const brand = searchParams.get('brand');
    const where = brand ? { brand } : {};
    const models = await prisma.engineModel.findMany({ where, orderBy: [{ brand: 'asc' }, { engineModel: 'asc' }] });
    return NextResponse.json(models);
  } catch (err: unknown) {
    console.error('[ENGINE MODELS GET ERROR]', err);
    return NextResponse.json({ error: 'Failed to fetch engine models' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireManagerOrAbove();
  if (isNextResponse(auth)) return auth;
  try {
    const body = await req.json();
    if (!body.brand?.trim() || !body.engineModel?.trim()) {
      return NextResponse.json({ error: 'brand and engineModel are required' }, { status: 400 });
    }
    if (body.recommendedPmsInterval !== undefined && (isNaN(Number(body.recommendedPmsInterval)) || Number(body.recommendedPmsInterval) < 1)) {
      return NextResponse.json({ error: 'recommendedPmsInterval must be a positive number' }, { status: 400 });
    }

    const { id: _id, modelId: _mid, createdAt: _ca, ...cleanBody } = body;

    const model = await prisma.engineModel.create({
      data: {
        modelId: newModelId(),
        ...cleanBody,
        ...(body.recommendedPmsInterval !== undefined ? { recommendedPmsInterval: Number(body.recommendedPmsInterval) } : {}),
      },
    });
    return NextResponse.json(model, { status: 201 });
  } catch (err: unknown) {
    console.error('[ENGINE MODEL CREATE ERROR]', err);
    const code = (err as any)?.code;
    if (code === 'P2002') return NextResponse.json({ error: 'Duplicate record.' }, { status: 409 });
    return NextResponse.json({ error: 'Failed to create engine model' }, { status: 500 });
  }
}
