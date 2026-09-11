import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const jobs = await prisma.serviceJob.findMany({ orderBy: { requestDate: 'desc' } });
    return NextResponse.json(jobs);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const count = await prisma.serviceJob.count();
    const job = await prisma.serviceJob.create({
      data: {
        jobOrderNo: `JO-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`,
        ...body,
      },
    });
    return NextResponse.json(job, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create job' }, { status: 500 });
  }
}
