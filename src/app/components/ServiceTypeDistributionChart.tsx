'use client';

import React, { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

interface ServiceTypeItem {
  name: string;
  value: number;
  color: string;
}

interface ServiceTypeDistributionChartProps {
  data: ServiceTypeItem[];
}

function CustomTooltip({
  active,
  payload,
  total,
}: {
  active?: boolean;
  payload?: { name: string; value: number; payload: { color: string } }[];
  total: number;
}) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0];
  return (
    <div className="bg-card border border-border rounded-lg shadow-dropdown px-3 py-2 text-xs">
      <div className="flex items-center gap-2 mb-1">
        <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: d.payload.color }} />
        <span className="font-600 text-foreground">{d.name}</span>
      </div>
      <p className="text-muted-foreground">
        <span className="tabular-nums font-600 text-foreground">{d.value}</span> jobs
        {total > 0 ? ` (${Math.round((d.value / total) * 100)}%)` : ''}
      </p>
    </div>
  );
}

export default function ServiceTypeDistributionChart({ data }: ServiceTypeDistributionChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);
  const total = data.reduce((s, i) => s + i.value, 0);

  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-600 text-foreground">Jobs by Service Type</h3>
          <p className="text-2xs text-muted-foreground mt-0.5">All time · {total} total job{total !== 1 ? 's' : ''}</p>
        </div>
      </div>
      {data.length === 0 || total === 0 ? (
        <div className="flex flex-col items-center justify-center h-[180px] text-muted-foreground">
          <p className="text-xs">No service job data available</p>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            <ResponsiveContainer width={180} height={180}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(undefined)}
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${entry.name}`}
                      fill={entry.color}
                      opacity={activeIndex === undefined || activeIndex === index ? 1 : 0.45}
                      stroke="none"
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip total={total} />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 min-w-0 space-y-1.5">
            {data.map((item, idx) => (
              <div
                key={`legend-${item.name}`}
                className="flex items-center gap-2 cursor-default"
                onMouseEnter={() => setActiveIndex(idx)}
                onMouseLeave={() => setActiveIndex(undefined)}
              >
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-xs text-muted-foreground truncate flex-1">{item.name}</span>
                <span className="text-xs font-600 text-foreground tabular-nums ml-auto">{item.value}</span>
                <span className="text-2xs text-muted-foreground w-8 text-right tabular-nums">
                  {total > 0 ? `${Math.round((item.value / total) * 100)}%` : '0%'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}