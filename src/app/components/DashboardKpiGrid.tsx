import React from 'react';
import Icon from '@/components/ui/AppIcon';

interface KpiCard {
  id: string;
  label: string;
  value: string | number;
  subtext: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  trend?: { value: string; positive: boolean };
  alert?: boolean;
  warning?: boolean;
  span?: string;
}

const kpiCards: KpiCard[] = [
  {
    id: 'kpi-open-jobs',
    label: 'Open Service Jobs',
    value: 23,
    subtext: '7 In Progress · 16 Open',
    icon: 'WrenchScrewdriverIcon',
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    trend: { value: '+3 since yesterday', positive: false },
    span: 'col-span-1 md:col-span-1',
  },
  {
    id: 'kpi-pms-overdue',
    label: 'PMS Due / Overdue',
    value: '4 / 2',
    subtext: '2 overdue — immediate action required',
    icon: 'CalendarDaysIcon',
    iconBg: 'bg-red-50',
    iconColor: 'text-red-600',
    alert: true,
    trend: { value: '2 overdue >30 days', positive: false },
    span: 'col-span-1 md:col-span-1',
  },
  {
    id: 'kpi-low-stock',
    label: 'Low Stock Parts',
    value: 3,
    subtext: '1 out of stock · 2 below minimum',
    icon: 'ArchiveBoxIcon',
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    warning: true,
    trend: { value: 'Reorder needed', positive: false },
    span: 'col-span-1 md:col-span-1',
  },
  {
    id: 'kpi-pending-billing',
    label: 'Pending Billing',
    value: 'PHP 284,500',
    subtext: '9 jobs awaiting invoice or payment',
    icon: 'DocumentCurrencyDollarIcon',
    iconBg: 'bg-violet-50',
    iconColor: 'text-violet-600',
    warning: true,
    trend: { value: '3 invoiced · 6 pending', positive: false },
    span: 'col-span-1 md:col-span-1',
  },
  {
    id: 'kpi-technicians',
    label: 'Active Technicians',
    value: '8 / 11',
    subtext: '3 on deployment · 0 on leave',
    icon: 'UsersIcon',
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    trend: { value: '8 available or deployed', positive: true },
    span: 'col-span-1 md:col-span-1',
  },
  {
    id: 'kpi-generators',
    label: 'Generator Assets',
    value: 47,
    subtext: '41 Active · 4 Standby · 2 Under Repair',
    icon: 'BoltIcon',
    iconBg: 'bg-sky-50',
    iconColor: 'text-sky-600',
    trend: { value: '2 under repair', positive: false },
    span: 'col-span-1 md:col-span-1',
  },
  {
    id: 'kpi-clients',
    label: 'Active Clients',
    value: 18,
    subtext: '18 active · 2 inactive accounts',
    icon: 'BuildingOffice2Icon',
    iconBg: 'bg-indigo-50',
    iconColor: 'text-indigo-600',
    trend: { value: '1 new this month', positive: true },
    span: 'col-span-1 md:col-span-1',
  },
  {
    id: 'kpi-deployments',
    label: 'Active Deployments',
    value: 5,
    subtext: '3 scheduled · 2 currently in field',
    icon: 'TruckIcon',
    iconBg: 'bg-teal-50',
    iconColor: 'text-teal-600',
    trend: { value: '2 return due today', positive: false },
    span: 'col-span-1 md:col-span-1',
  },
];

export default function DashboardKpiGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4 gap-4">
      {kpiCards.map((card) => (
        <KpiCardItem key={card.id} card={card} />
      ))}
    </div>
  );
}

function KpiCardItem({ card }: { card: KpiCard }) {
  return (
    <div className={`
      bg-card border rounded-xl p-5 shadow-card hover:shadow-card-hover transition-all duration-200 cursor-default
      ${card.alert ? 'border-red-200 bg-red-50/30' : card.warning ? 'border-amber-200 bg-amber-50/20' : 'border-border'}
    `}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-500 text-muted-foreground leading-snug pr-2">{card.label}</p>
        <div className={`p-2 rounded-lg flex-shrink-0 ${card.iconBg}`}>
          <Icon name={card.icon as Parameters<typeof Icon>[0]['name']} size={16} className={card.iconColor} />
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
  );
}