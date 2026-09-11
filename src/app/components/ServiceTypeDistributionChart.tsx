'use client';

import React, { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer,  } from 'recharts';

// Backend integration: replace with GET /api/jobs/service-type-distribution
const serviceTypeData = [
  { id: 'st-pms', name: 'PMS', value: 38, color: '#3b82f6' },
  { id: 'st-repair', name: 'Repair', value: 22, color: '#ef4444' },
  { id: 'st-troubleshoot', name: 'Troubleshooting', value: 17, color: '#f59e0b' },
  { id: 'st-emergency', name: 'Emergency Call', value: 9, color: '#dc2626' },
  { id: 'st-loadtest', name: 'Load Test', value: 7, color: '#10b981' },
  { id: 'st-inspection', name: 'Inspection', value: 5, color: '#8b5cf6' },
  { id: 'st-commissioning', name: 'Commissioning', value: 2, color: '#06b6d4' },
];

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { name: string; value: number; payload: { color: string } }[] }) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0];
  const total = serviceTypeData.reduce((s, i) => s + i.value, 0);
  return (
    <div className="bg-card border border-border rounded-lg shadow-dropdown px-3 py-2 text-xs">
      <div className="flex items-center gap-2 mb-1">
        <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: d.payload.color }} />
        <span className="font-600 text-foreground">{d.name}</span>
      </div>
      <p className="text-muted-foreground">
        <span className="tabular-nums font-600 text-foreground">{d.value}</span> jobs ({Math.round((d.value / total) * 100)}%)
      </p>
    </div>
  );
}

export default function ServiceTypeDistributionChart() {
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);
  const total = serviceTypeData.reduce((s, i) => s + i.value, 0);

  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-600 text-foreground">Jobs by Service Type</h3>
          <p className="text-2xs text-muted-foreground mt-0.5">YTD 2026 · {total} total jobs</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0">
          <ResponsiveContainer width={180} height={180}>
            <PieChart>
              <Pie
                data={serviceTypeData}
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                onMouseEnter={(_, index) => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(undefined)}
              >
                {serviceTypeData.map((entry, index) => (
                  <Cell
                    key={entry.id}
                    fill={entry.color}
                    opacity={activeIndex === undefined || activeIndex === index ? 1 : 0.45}
                    stroke="none"
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 min-w-0 space-y-1.5">
          {serviceTypeData.map((item, idx) => (
            <div
              key={item.id}
              className="flex items-center gap-2 cursor-default"
              onMouseEnter={() => setActiveIndex(idx)}
              onMouseLeave={() => setActiveIndex(undefined)}
            >
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
              <span className="text-xs text-muted-foreground truncate flex-1">{item.name}</span>
              <span className="text-xs font-600 text-foreground tabular-nums ml-auto">{item.value}</span>
              <span className="text-2xs text-muted-foreground w-8 text-right tabular-nums">
                {Math.round((item.value / total) * 100)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}