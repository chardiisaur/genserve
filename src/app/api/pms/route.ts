import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const records = await prisma.pmsRecord.findMany({ orderBy: { pmsDate: 'desc' } });
    return NextResponse.json(records);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch PMS records' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const record = await prisma.pmsRecord.create({
      data: { pmsRecordId: `pms-${Date.now()}`, ...body },
    });
    return NextResponse.json(record, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create PMS record' }, { status: 500 });
  }
}
