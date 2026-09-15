import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireManagerOrAbove, isNextResponse, ROLES } from '@/lib/rbac';

const VALID_EXPENSE_TYPES = ['Transport', 'Accommodation', 'Meals', 'Tools', 'Materials', 'Communication', 'Other'];

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (isNextResponse(auth)) return auth;
  try {
    const { id } = await params;
    const expense = await prisma.expense.findUnique({
      where: { expenseId: id },
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
    if (!expense) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // FIELD_TECHNICIAN: only view expenses for their assigned jobs
    if (auth.role === ROLES.FIELD_TECHNICIAN) {
      const job = await prisma.serviceJob.findUnique({ where: { jobOrderNo: expense.jobOrderNo } });
      if (!job || (job.leadTechnicianId !== auth.id && job.additionalTechnicianId !== auth.id)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    return NextResponse.json({
      ...expense,
      clientName: expense.serviceJob?.client?.clientName ?? '',
      siteName: expense.serviceJob?.site?.siteName ?? '',
      technicianName: expense.technician?.technicianName ?? '',
    });
  } catch (err: unknown) {
    console.error('[EXPENSE GET BY ID ERROR]', err);
    return NextResponse.json({ error: 'Failed to fetch expense' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireManagerOrAbove();
  if (isNextResponse(auth)) return auth;
  try {
    const { id } = await params;
    const body = await req.json();

    if (body.expenseType && !VALID_EXPENSE_TYPES.includes(body.expenseType)) {
      return NextResponse.json({ error: `Invalid expenseType: ${body.expenseType}` }, { status: 400 });
    }
    if (body.amount !== undefined && (isNaN(Number(body.amount)) || Number(body.amount) < 0)) {
      return NextResponse.json({ error: 'amount must be a non-negative number' }, { status: 400 });
    }

    const { id: _id, expenseId: _eid, createdAt: _ca, updatedAt: _ua, serviceJob: _sj, technician: _t, ...cleanBody } = body;
    const expense = await prisma.expense.update({
      where: { expenseId: id },
      data: { ...cleanBody, ...(body.amount !== undefined ? { amount: Number(body.amount) } : {}) },
    });
    return NextResponse.json(expense);
  } catch (err: unknown) {
    console.error('[EXPENSE UPDATE ERROR]', err);
    const code = (err as any)?.code;
    if (code === 'P2025') return NextResponse.json({ error: 'Expense not found.' }, { status: 404 });
    return NextResponse.json({ error: 'Failed to update expense' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireManagerOrAbove();
  if (isNextResponse(auth)) return auth;
  try {
    const { id } = await params;
    await prisma.expense.delete({ where: { expenseId: id } });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('[EXPENSE DELETE ERROR]', err);
    const code = (err as any)?.code;
    if (code === 'P2025') return NextResponse.json({ error: 'Expense not found.' }, { status: 404 });
    return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 });
  }
}
