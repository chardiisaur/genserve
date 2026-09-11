import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const technicians = await prisma.technician.findMany({ orderBy: { technicianName: 'asc' } });
    return NextResponse.json(technicians);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch technicians' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const tech = await prisma.technician.create({
      data: { technicianId: `tech-${Date.now()}`, ...body },
    });
    return NextResponse.json(tech, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create technician' }, { status: 500 });
  }
}
