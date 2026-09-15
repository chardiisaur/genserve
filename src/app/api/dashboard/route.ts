import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, isNextResponse } from '@/lib/rbac';

export async function GET() {
  const auth = await requireAuth();
  if (isNextResponse(auth)) return auth;

  try {
    const now = new Date();

    // ─── Run all queries in parallel ────────────────────────────────────────
    const [
      totalGenerators,
      serviceJobCounts,
      allServiceJobs,
      pmsRecords,
      technicians,
      allParts,
      outstandingBilling,
      recentJobs,
      serviceTypeDistribution,
    ] = await Promise.all([
      // 1. Total active generators
      prisma.generator.count({ where: { status: 'Active' } }),

      // 2. Service job status counts
      prisma.serviceJob.groupBy({
        by: ['status'],
        _count: { status: true },
      }),

      // 3. All service jobs for monthly chart (last 6 months)
      prisma.serviceJob.findMany({
        select: { status: true, requestDate: true },
        orderBy: { requestDate: 'desc' },
      }),

      // 4. PMS records for due/overdue calculation (non-completed only)
      prisma.pmsRecord.findMany({
        where: { pmsStatus: { not: 'Completed' } },
        select: {
          pmsRecordId: true,
          pmsStatus: true,
          nextPmsDate: true,
          generatorId: true,
          clientId: true,
          siteId: true,
          pmsDate: true,
          pmsType: true,
          generator: { select: { assetNo: true, brand: true, model: true } },
          client: { select: { clientName: true } },
          site: { select: { siteName: true } },
        },
        orderBy: { nextPmsDate: 'asc' },
      }),

      // 5. Technicians
      prisma.technician.findMany({
        select: {
          technicianId: true,
          technicianName: true,
          position: true,
          skillLevel: true,
          availability: true,
        },
        orderBy: { technicianName: 'asc' },
      }),

      // 6. All parts to filter low-stock in JS (Prisma SQLite can't compare two columns)
      prisma.partInventory.findMany({
        select: {
          partId: true,
          partNo: true,
          partDescription: true,
          brand: true,
          stockQty: true,
          minimumStock: true,
          unit: true,
          unitCost: true,
          supplier: true,
          storageLocation: true,
          reorderStatus: true,
        },
      }),

      // 7. Outstanding billing (unpaid/pending invoices)
      prisma.quotationBilling.aggregate({
        where: {
          billingStatus: { in: ['Unpaid', 'Pending', 'Invoiced', 'Quoted', 'Approved'] },
        },
        _sum: { totalAmount: true },
        _count: { id: true },
      }),

      // 8. Recent jobs (latest 8)
      prisma.serviceJob.findMany({
        take: 8,
        orderBy: { requestDate: 'desc' },
        include: {
          client: { select: { clientName: true } },
          site: { select: { siteName: true } },
          generator: { select: { assetNo: true, brand: true, model: true } },
          leadTechnician: { select: { technicianName: true } },
        },
      }),

      // 9. Service type distribution
      prisma.serviceJob.groupBy({
        by: ['serviceType'],
        _count: { serviceType: true },
        orderBy: { _count: { serviceType: 'desc' } },
      }),
    ]);

    // ─── KPI calculations ────────────────────────────────────────────────────
    const statusMap: Record<string, number> = {};
    for (const row of serviceJobCounts) {
      statusMap[row.status] = row._count.status;
    }
    const openJobs = statusMap['Open'] ?? 0;
    const inProgressJobs = statusMap['In Progress'] ?? 0;
    const completedJobs = statusMap['Completed'] ?? 0;

    // PMS due/overdue: include overdue + due within 14 days
    const pmsDueItems = pmsRecords.filter((p) => {
      if (!p.nextPmsDate) return false;
      const nextDate = new Date(p.nextPmsDate);
      if (isNaN(nextDate.getTime())) return false;
      const diffMs = nextDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      return diffDays <= 14;
    });

    const pmsOverdueCount = pmsDueItems.filter((p) => new Date(p.nextPmsDate) < now).length;
    const pmsDueCount = pmsDueItems.length - pmsOverdueCount;

    // Technician availability
    const availableTechs = technicians.filter((t) => t.availability === 'Available').length;

    // Low stock: stockQty <= minimumStock
    const lowStockParts = allParts
      .filter((p) => p.stockQty <= p.minimumStock)
      .sort((a, b) => a.stockQty - b.stockQty);

    // Outstanding billing
    const outstandingAmount = outstandingBilling._sum.totalAmount ?? 0;
    const outstandingCount = outstandingBilling._count.id ?? 0;

    // ─── Monthly chart data (last 6 months) ─────────────────────────────────
    const monthlyChart: { month: string; open: number; inProgress: number; completed: number; closed: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const monthIndex = d.getMonth();
      const monthName = d.toLocaleString('en-US', { month: 'short' });
      const counts = { open: 0, inProgress: 0, completed: 0, closed: 0 };
      for (const job of allServiceJobs) {
        if (!job.requestDate) continue;
        const jd = new Date(job.requestDate);
        if (isNaN(jd.getTime())) continue;
        if (jd.getFullYear() === year && jd.getMonth() === monthIndex) {
          if (job.status === 'Open') counts.open++;
          else if (job.status === 'In Progress') counts.inProgress++;
          else if (job.status === 'Completed') counts.completed++;
          else if (job.status === 'Closed') counts.closed++;
        }
      }
      monthlyChart.push({ month: monthName, ...counts });
    }

    // ─── Service type distribution colors ───────────────────────────────────
    const SERVICE_TYPE_COLORS: Record<string, string> = {
      PMS: '#3b82f6',
      Repair: '#ef4444',
      Troubleshooting: '#f59e0b',
      'Emergency Call': '#dc2626',
      'Load Test': '#10b981',
      Inspection: '#8b5cf6',
      Commissioning: '#06b6d4',
    };
    const fallbackColors = ['#64748b', '#0ea5e9', '#d946ef', '#f97316', '#84cc16'];
    let colorIdx = 0;
    const serviceTypeChartData = serviceTypeDistribution.map((row) => ({
      name: row.serviceType,
      value: row._count.serviceType,
      color:
        SERVICE_TYPE_COLORS[row.serviceType] ??
        fallbackColors[colorIdx++ % fallbackColors.length],
    }));

    // ─── Recent jobs mapping ─────────────────────────────────────────────────
    const recentJobsMapped = recentJobs.map((j) => ({
      id: j.id,
      jobOrderNo: j.jobOrderNo,
      clientName: j.client?.clientName ?? j.clientId,
      siteName: j.site?.siteName ?? j.siteId,
      generatorName: j.generator
        ? `${j.generator.assetNo} / ${j.generator.brand} ${j.generator.model}`.trim()
        : j.generatorId,
      serviceType: j.serviceType,
      priority: j.priority,
      status: j.status,
      leadTechnicianName: j.leadTechnician?.technicianName ?? '',
      scheduledDate: j.scheduledDate,
      billingStatus: j.billingStatus,
      requestDate: j.requestDate,
    }));

    // ─── PMS due list mapping ────────────────────────────────────────────────
    const pmsDueMapped = pmsDueItems.slice(0, 8).map((p) => {
      const nextDate = new Date(p.nextPmsDate);
      const diffMs = nextDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      const isOverdue = nextDate < now;
      return {
        id: p.pmsRecordId,
        generatorId: p.generator?.assetNo ?? p.generatorId,
        generatorName: p.generator
          ? `${p.generator.brand} ${p.generator.model}`.trim()
          : p.generatorId,
        client: p.client?.clientName ?? p.clientId,
        site: p.site?.siteName ?? p.siteId,
        nextPmsDate: p.nextPmsDate,
        daysOverdue: isOverdue ? Math.abs(diffDays) : 0,
        daysUntilDue: isOverdue ? 0 : diffDays,
        status: isOverdue ? 'Overdue' : 'Due',
        lastPmsDate: p.pmsDate,
        pmsType: p.pmsType,
      };
    });

    // ─── Technician list mapping ─────────────────────────────────────────────
    const techniciansMapped = technicians.map((t) => {
      const initials = t.technicianName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((w: string) => w[0].toUpperCase())
        .join('');
      return {
        id: t.technicianId,
        name: t.technicianName,
        position: t.position,
        skillLevel: t.skillLevel,
        availability: t.availability,
        initials,
      };
    });

    // ─── Response ────────────────────────────────────────────────────────────
    return NextResponse.json({
      refreshedAt: now.toISOString(),
      kpis: {
        totalActiveGenerators: totalGenerators,
        openJobs,
        inProgressJobs,
        completedJobs,
        pmsDue: pmsDueCount,
        pmsOverdue: pmsOverdueCount,
        availableTechnicians: availableTechs,
        totalTechnicians: technicians.length,
        lowStockParts: lowStockParts.length,
        outstandingBillingAmount: outstandingAmount,
        outstandingBillingCount: outstandingCount,
      },
      recentJobs: recentJobsMapped,
      pmsDue: pmsDueMapped,
      technicians: techniciansMapped,
      lowStockParts,
      charts: {
        jobsByStatus: monthlyChart,
        serviceTypeDistribution: serviceTypeChartData,
      },
    });
  } catch (err: unknown) {
    console.error('[DASHBOARD GET ERROR]', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to load dashboard data', detail: message },
      { status: 500 }
    );
  }
}
