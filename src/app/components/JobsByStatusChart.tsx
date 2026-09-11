'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Icon from '@/components/ui/AppIcon';

const jobVolumeData = [
  { month: 'Apr', open: 18, inProgress: 9, completed: 24, closed: 21 },
  { month: 'May', open: 22, inProgress: 11, completed: 19, closed: 18 },
  { month: 'Jun', open: 15, inProgress: 7, completed: 28, closed: 26 },
  { month: 'Jul', open: 27, inProgress: 14, completed: 22, closed: 20 },
  { month: 'Aug', open: 19, inProgress: 8, completed: 31, closed: 29 },
  { month: 'Sep', open: 23, inProgress: 7, completed: 14, closed: 8 },
];

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
      <p className="font-600 text-foreground mb-1.5">{label} 2026</p>
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

export default function JobsByStatusChart() {
  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-600 text-foreground">Job Volume by Status</h3>
          <p className="text-2xs text-muted-foreground mt-0.5">Apr – Sep 2026</p>
        </div>
        <div className="p-1.5 rounded-md bg-muted">
          <Icon name="ChartBarIcon" size={14} className="text-muted-foreground" />
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={jobVolumeData} barSize={9} barGap={2}>
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
    </div>
  );
}