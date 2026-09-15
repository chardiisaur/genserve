'use client';

import React from 'react';
import Icon from '@/components/ui/AppIcon';
import StatusBadge from '@/components/ui/StatusBadge';

interface PmsDueItem {
  id: string;
  generatorId: string;
  generatorName: string;
  client: string;
  site: string;
  nextPmsDate: string;
  daysOverdue: number;
  daysUntilDue: number;
  status: string;
  lastPmsDate: string;
  pmsType: string;
}

interface PmsDueListProps {
  items: PmsDueItem[];
}

export default function PmsDueList({ items }: PmsDueListProps) {
  const overdueCount = items.filter((p) => p.status === 'Overdue').length;

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
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <Icon name="CheckCircleIcon" size={28} className="mb-2 text-emerald-400" />
          <p className="text-xs font-500 text-emerald-600">No PMS due in the next 14 days</p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {items.map((item) => (
            <div
              key={item.id}
              className={`px-4 py-2.5 hover:bg-muted/30 transition-colors ${item.status === 'Overdue' ? 'bg-red-50/40' : ''}`}
            >
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
                      {item.status === 'Overdue'
                        ? `${item.daysOverdue}d overdue`
                        : `Due ${item.nextPmsDate} (${item.daysUntilDue}d)`}
                    </span>
                  </div>
                </div>
                <StatusBadge status={item.status as Parameters<typeof StatusBadge>[0]['status']} size="sm" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}