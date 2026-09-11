import React from 'react';
import Icon from '@/components/ui/AppIcon';
import StatusBadge from '@/components/ui/StatusBadge';

const pmsDueItems = [
  {
    id: 'pms-due-001',
    generatorId: 'GEN-047',
    generatorName: 'Cummins C550',
    client: 'BDO Unibank Inc.',
    site: 'Makati Main',
    nextPmsDate: '05 Sep 2026',
    daysOverdue: 4,
    status: 'Overdue' as const,
    lastPmsDate: '28 May 2026',
  },
  {
    id: 'pms-due-002',
    generatorId: 'GEN-022',
    generatorName: 'Cummins KTA38',
    client: 'Ayala Land Inc.',
    site: 'BGC Corp. Center',
    nextPmsDate: '07 Sep 2026',
    daysOverdue: 2,
    status: 'Overdue' as const,
    lastPmsDate: '10 Jun 2026',
  },
  {
    id: 'pms-due-003',
    generatorId: 'GEN-031',
    generatorName: 'Mitsubishi S12R',
    client: 'SM Prime Holdings',
    site: 'SM Aura Premier',
    nextPmsDate: '11 Sep 2026',
    daysOverdue: 0,
    status: 'Due' as const,
    lastPmsDate: '15 Jun 2026',
  },
  {
    id: 'pms-due-004',
    generatorId: 'GEN-039',
    generatorName: 'Mitsubishi S16R',
    client: 'Robinsons Land',
    site: 'Galleria Ortigas',
    nextPmsDate: '13 Sep 2026',
    daysOverdue: 0,
    status: 'Due' as const,
    lastPmsDate: '20 Jun 2026',
  },
  {
    id: 'pms-due-005',
    generatorId: 'GEN-015',
    generatorName: 'Cummins QSK78',
    client: 'PLDT Inc.',
    site: 'Mandaluyong DC',
    nextPmsDate: '15 Sep 2026',
    daysOverdue: 0,
    status: 'Due' as const,
    lastPmsDate: '25 Jun 2026',
  },
  {
    id: 'pms-due-006',
    generatorId: 'GEN-003',
    generatorName: 'Mitsubishi S6A3',
    client: 'Jollibee Foods',
    site: 'Ortigas Commissary',
    nextPmsDate: '16 Sep 2026',
    daysOverdue: 0,
    status: 'Due' as const,
    lastPmsDate: '28 Jun 2026',
  },
];

export default function PmsDueList() {
  const overdueCount = pmsDueItems.filter(p => p.status === 'Overdue').length;

  return (
    <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div>
          <h3 className="text-sm font-600 text-foreground flex items-center gap-1.5">
            PMS Due / Overdue
            {overdueCount > 0 && (
              <span className="text-2xs bg-red-100 text-red-700 rounded-full px-1.5 py-0.5 font-600">
                {overdueCount} overdue
              </span>
            )}
          </h3>
          <p className="text-2xs text-muted-foreground mt-0.5">Next 14 days + overdue</p>
        </div>
        <div className="p-1.5 rounded-md bg-red-50">
          <Icon name="ExclamationTriangleIcon" size={14} className="text-red-600" />
        </div>
      </div>
      <div className="divide-y divide-border">
        {pmsDueItems.map((item) => (
          <div key={item.id} className={`px-4 py-2.5 hover:bg-muted/30 transition-colors ${item.status === 'Overdue' ? 'bg-red-50/40' : ''}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-2xs font-600 text-muted-foreground tabular-nums">{item.generatorId}</span>
                  <span className="text-2xs text-muted-foreground">·</span>
                  <span className="text-xs font-500 text-foreground truncate">{item.generatorName}</span>
                </div>
                <p className="text-2xs text-muted-foreground truncate">{item.client} — {item.site}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Icon name="CalendarIcon" size={11} className="text-muted-foreground flex-shrink-0" />
                  <span className={`text-2xs font-500 ${item.status === 'Overdue' ? 'text-red-600' : 'text-amber-600'}`}>
                    {item.status === 'Overdue' ? `${item.daysOverdue}d overdue` : `Due ${item.nextPmsDate}`}
                  </span>
                </div>
              </div>
              <StatusBadge status={item.status} size="sm" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}