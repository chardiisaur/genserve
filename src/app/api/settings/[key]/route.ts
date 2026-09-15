import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireAdmin, isNextResponse } from '@/lib/rbac';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  const auth = await requireAuth();
  if (isNextResponse(auth)) return auth;
  try {
    const { key } = await params;
    const setting = await prisma.setting.findUnique({ where: { key } });
    if (!setting) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(setting);
  } catch (err: unknown) {
    console.error('[SETTING GET BY KEY ERROR]', err);
    return NextResponse.json({ error: 'Failed to fetch setting' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  const auth = await requireAdmin();
  if (isNextResponse(auth)) return auth;
  try {
    const { key } = await params;
    const body = await req.json();

    if (body.value === undefined) {
      return NextResponse.json({ error: 'value is required' }, { status: 400 });
    }

    const setting = await prisma.setting.upsert({
      where: { key },
      update: { value: String(body.value), notes: body.notes ?? '' },
      create: { key, value: String(body.value), notes: body.notes ?? '' },
    });
    return NextResponse.json(setting);
  } catch (err: unknown) {
    console.error('[SETTING UPDATE ERROR]', err);
    return NextResponse.json({ error: 'Failed to update setting' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  const auth = await requireAdmin();
  if (isNextResponse(auth)) return auth;
  try {
    const { key } = await params;
    await prisma.setting.delete({ where: { key } });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('[SETTING DELETE ERROR]', err);
    const code = (err as any)?.code;
    if (code === 'P2025') return NextResponse.json({ error: 'Setting not found.' }, { status: 404 });
    return NextResponse.json({ error: 'Failed to delete setting' }, { status: 500 });
  }
}
