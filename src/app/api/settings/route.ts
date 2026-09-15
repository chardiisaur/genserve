import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireAdmin, isNextResponse } from '@/lib/rbac';

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (isNextResponse(auth)) return auth;
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');
    if (key) {
      const setting = await prisma.setting.findUnique({ where: { key } });
      if (!setting) return NextResponse.json({ error: 'Setting not found' }, { status: 404 });
      return NextResponse.json(setting);
    }
    const settings = await prisma.setting.findMany({ orderBy: { key: 'asc' } });
    return NextResponse.json(settings);
  } catch (err: unknown) {
    console.error('[SETTINGS GET ERROR]', err);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (isNextResponse(auth)) return auth;
  try {
    const body = await req.json();
    if (!body.key?.trim() || body.value === undefined) {
      return NextResponse.json({ error: 'key and value are required' }, { status: 400 });
    }

    const setting = await prisma.setting.upsert({
      where: { key: body.key },
      update: { value: String(body.value), notes: body.notes ?? '' },
      create: { key: body.key, value: String(body.value), notes: body.notes ?? '' },
    });
    return NextResponse.json(setting, { status: 201 });
  } catch (err: unknown) {
    console.error('[SETTINGS CREATE/UPDATE ERROR]', err);
    return NextResponse.json({ error: 'Failed to save setting' }, { status: 500 });
  }
}
