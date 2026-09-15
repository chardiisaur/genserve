'use client';

import React from 'react';
import Icon from '@/components/ui/AppIcon';

interface KpiData {
  totalActiveGenerators: number;
  openJobs: number;
  inProgressJobs: number;
  completedJobs: number;
  pmsDue: number;
  pmsOverdue: number;
  availableTechnicians: number;
  totalTechnicians: number;
  lowStockParts: number;
  outstandingBillingAmount: number;
  outstandingBillingCount: number;
}

interface DashboardKpiGridProps {
  kpis: KpiData;
}

function formatCurrency(amount: number): string {
  return 'PHP ' + amount.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export default function DashboardKpiGrid({ kpis }: DashboardKpiGridProps) {
  const cards = [
    {
      id: 'kpi-open-jobs',
      label: 'Open Service Jobs',
      value: kpis.openJobs,
      subtext: `${kpis.inProgressJobs} In Progress · ${kpis.openJobs} Open`,
      icon: 'WrenchScrewdriverIcon' as const,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      trend: { value: `${kpis.inProgressJobs} currently in progress`, positive: kpis.inProgressJobs === 0 },
    },
    {
      id: 'kpi-pms-overdue',
      label: 'PMS Due / Overdue',
      value: `${kpis.pmsDue} / ${kpis.pmsOverdue}`,
      subtext: kpis.pmsOverdue > 0 ? `${kpis.pmsOverdue} overdue — immediate action required` : 'No overdue PMS',
      icon: 'CalendarDaysIcon' as const,
      iconBg: 'bg-red-50',
      iconColor: 'text-red-600',
      alert: kpis.pmsOverdue > 0,
      trend: { value: kpis.pmsOverdue > 0 ? `${kpis.pmsOverdue} overdue` : 'All PMS on schedule', positive: kpis.pmsOverdue === 0 },
    },
    {
      id: 'kpi-low-stock',
      label: 'Low Stock Parts',
      value: kpis.lowStockParts,
      subtext: kpis.lowStockParts > 0 ? `${kpis.lowStockParts} part(s) at or below minimum stock` : 'All parts adequately stocked',
      icon: 'ArchiveBoxIcon' as const,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
      warning: kpis.lowStockParts > 0,
      trend: { value: kpis.lowStockParts > 0 ? 'Reorder needed' : 'Stock levels OK', positive: kpis.lowStockParts === 0 },
    },
    {
      id: 'kpi-pending-billing',
      label: 'Outstanding Billing',
      value: formatCurrency(kpis.outstandingBillingAmount),
      subtext: `${kpis.outstandingBillingCount} job(s) awaiting invoice or payment`,
      icon: 'DocumentCurrencyDollarIcon' as const,
      iconBg: 'bg-violet-50',
      iconColor: 'text-violet-600',
      warning: kpis.outstandingBillingAmount > 0,
      trend: { value: `${kpis.outstandingBillingCount} outstanding`, positive: kpis.outstandingBillingCount === 0 },
    },
    {
      id: 'kpi-technicians',
      label: 'Available Technicians',
      value: `${kpis.availableTechnicians} / ${kpis.totalTechnicians}`,
      subtext: `${kpis.totalTechnicians - kpis.availableTechnicians} on deployment or leave`,
      icon: 'UsersIcon' as const,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      trend: { value: `${kpis.availableTechnicians} available now`, positive: kpis.availableTechnicians > 0 },
    },
    {
      id: 'kpi-generators',
      label: 'Active Generators',
      value: kpis.totalActiveGenerators,
      subtext: `${kpis.totalActiveGenerators} active generator assets`,
      icon: 'BoltIcon' as const,
      iconBg: 'bg-sky-50',
      iconColor: 'text-sky-600',
      trend: { value: `${kpis.totalActiveGenerators} in service`, positive: true },
    },
    {
      id: 'kpi-completed-jobs',
      label: 'Completed Jobs',
      value: kpis.completedJobs,
      subtext: 'Total completed service jobs',
      icon: 'CheckCircleIcon' as const,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      trend: { value: `${kpis.completedJobs} completed`, positive: true },
    },
    {
      id: 'kpi-jobs-in-progress',
      label: 'Jobs In Progress',
      value: kpis.inProgressJobs,
      subtext: 'Currently active field work',
      icon: 'ClockIcon' as const,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
      trend: { value: `${kpis.inProgressJobs} active`, positive: false },
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.id}
          className={`bg-card border rounded-xl p-5 shadow-card hover:shadow-card-hover transition-all duration-200 cursor-default
            ${card.alert ? 'border-red-200 bg-red-50/30' : card.warning ? 'border-amber-200 bg-amber-50/20' : 'border-border'}`}
        >
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-500 text-muted-foreground leading-snug pr-2">{card.label}</p>
            <div className={`p-2 rounded-lg flex-shrink-0 ${card.iconBg}`}>
              <Icon name={card.icon} size={16} className={card.iconColor} />
            </div>
          </div>
          <p className={`text-2xl font-700 tabular-nums mb-1 ${card.alert ? 'text-red-700' : card.warning ? 'text-amber-700' : 'text-foreground'}`}>
            {card.value}
          </p>
          <p className="text-2xs text-muted-foreground mb-2 leading-snug">{card.subtext}</p>
          {card.trend && (
            <div className={`flex items-center gap-1 text-2xs font-500 ${card.trend.positive ? 'text-emerald-600' : 'text-red-500'}`}>
              <Icon name={card.trend.positive ? 'ArrowTrendingUpIcon' : 'ArrowTrendingDownIcon'} size={11} />
              {card.trend.value}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}