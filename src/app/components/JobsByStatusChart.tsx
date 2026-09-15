'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Icon from '@/components/ui/AppIcon';

interface MonthlyJobData {
  month: string;
  open: number;
  inProgress: number;
  completed: number;
  closed: number;
}

interface JobsByStatusChartProps {
  data: MonthlyJobData[];
}

const COLORS = {
  open: '#3b82f6',
  inProgress: '#f59e0b',
  completed: '#10b981',
  closed: '#94a3b8',
};

interface TooltipEntry {
  name: string;
  value: number;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg shadow-dropdown px-3 py-2.5 text-xs">
      <p className="font-600 text-foreground mb-1.5">{label}</p>
      {payload.map((entry) => (
        <div key={`tip-${entry.name}`} className="flex items-center gap-2 mb-0.5">
          <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: entry.color }} />
          <span className="text-muted-foreground capitalize">{entry.name}:</span>
          <span className="font-600 text-foreground tabular-nums ml-auto pl-3">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function JobsByStatusChart({ data }: JobsByStatusChartProps) {
  const hasData = data.some((d) => d.open + d.inProgress + d.completed + d.closed > 0);

  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-600 text-foreground">Job Volume by Status</h3>
          <p className="text-2xs text-muted-foreground mt-0.5">
            {data.length > 0 ? `${data[0]?.month} – ${data[data.length - 1]?.month}` : 'Last 6 months'}
          </p>
        </div>
        <div className="p-1.5 rounded-md bg-muted">
          <Icon name="ChartBarIcon" size={14} className="text-muted-foreground" />
        </div>
      </div>
      {!hasData ? (
        <div className="flex flex-col items-center justify-center h-[220px] text-muted-foreground">
          <Icon name="ChartBarIcon" size={32} className="mb-2 opacity-30" />
          <p className="text-xs">No job data for this period</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} barSize={9} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: 'var(--muted-foreground)', fontFamily: 'var(--font-sans)' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: 'var(--muted-foreground)', fontFamily: 'var(--font-sans)' }}
              axisLine={false}
              tickLine={false}
              width={28}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--muted)', opacity: 0.5 }} />
            <Legend
              wrapperStyle={{ fontSize: '11px', paddingTop: '12px', fontFamily: 'var(--font-sans)' }}
              iconType="square"
              iconSize={8}
            />
            <Bar dataKey="open" name="Open" fill={COLORS.open} radius={[2, 2, 0, 0]} />
            <Bar dataKey="inProgress" name="In Progress" fill={COLORS.inProgress} radius={[2, 2, 0, 0]} />
            <Bar dataKey="completed" name="Completed" fill={COLORS.completed} radius={[2, 2, 0, 0]} />
            <Bar dataKey="closed" name="Closed" fill={COLORS.closed} radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}