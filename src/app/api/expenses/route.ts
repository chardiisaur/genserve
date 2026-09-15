import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, isNextResponse, ROLES } from '@/lib/rbac';

const VALID_EXPENSE_TYPES = ['Transport', 'Accommodation', 'Meals', 'Tools', 'Materials', 'Communication', 'Other'];

function newExpenseId(): string {
  return `exp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (isNextResponse(auth)) return auth;
  try {
    const { searchParams } = new URL(req.url);
    const jobOrderNo = searchParams.get('jobOrderNo');
    const technicianId = searchParams.get('technicianId');

    let where: Record<string, unknown> = {};
    if (jobOrderNo) where.jobOrderNo = jobOrderNo;
    if (technicianId) where.technicianId = technicianId;

    // FIELD_TECHNICIAN: only see expenses for their assigned jobs
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

    const expenses = await prisma.expense.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        serviceJob: {
          select: {
            jobOrderNo: true,
            client: { select: { clientName: true } },
            site: { select: { siteName: true } },
          },
        },
        technician: { select: { technicianName: true } },
      },
    });

    const result = expenses.map((e) => ({
      ...e,
      clientName: e.serviceJob?.client?.clientName ?? '',
      siteName: e.serviceJob?.site?.siteName ?? '',
      technicianName: e.technician?.technicianName ?? '',
    }));

    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error('[EXPENSES GET ERROR]', err);
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (isNextResponse(auth)) return auth;
  try {
    const body = await req.json();
    const { jobOrderNo, date } = body;

    if (!jobOrderNo?.trim() || !date?.trim()) {
      return NextResponse.json({ error: 'jobOrderNo and date are required' }, { status: 400 });
    }

    if (body.expenseType && !VALID_EXPENSE_TYPES.includes(body.expenseType)) {
      return NextResponse.json({ error: `Invalid expenseType: ${body.expenseType}` }, { status: 400 });
    }

    if (body.amount !== undefined && (isNaN(Number(body.amount)) || Number(body.amount) < 0)) {
      return NextResponse.json({ error: 'amount must be a non-negative number' }, { status: 400 });
    }

    // Validate job exists
    const job = await prisma.serviceJob.findUnique({ where: { jobOrderNo } });
    if (!job) return NextResponse.json({ error: 'Service job not found.' }, { status: 400 });

    // FIELD_TECHNICIAN: can only add expenses to their assigned jobs
    if (auth.role === ROLES.FIELD_TECHNICIAN) {
      if (job.leadTechnicianId !== auth.id && job.additionalTechnicianId !== auth.id) {
        return NextResponse.json({ error: 'Forbidden — you are not assigned to this job' }, { status: 403 });
      }
    }

    // Validate technician if provided
    if (body.technicianId) {
      const tech = await prisma.technician.findUnique({ where: { technicianId: body.technicianId } });
      if (!tech) return NextResponse.json({ error: 'Technician not found.' }, { status: 400 });
    }

    const { id: _id, expenseId: _eid, createdAt: _ca, updatedAt: _ua, serviceJob: _sj, technician: _t, ...cleanBody } = body;

    const expense = await prisma.expense.create({
      data: {
        expenseId: newExpenseId(),
        ...cleanBody,
        amount: Number(body.amount) || 0,
      },
    });
    return NextResponse.json(expense, { status: 201 });
  } catch (err: unknown) {
    console.error('[EXPENSE CREATE ERROR]', err);
    const code = (err as any)?.code;
    if (code === 'P2002') return NextResponse.json({ error: 'Duplicate record.' }, { status: 409 });
    if (code === 'P2003') return NextResponse.json({ error: 'Referenced record not found.' }, { status: 400 });
    return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 });
  }
}
