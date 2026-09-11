import React from 'react';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div className={`animate-pulse bg-muted rounded-md ${className}`} />
  );
}

export function KpiCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-card">
      <div className="flex items-start justify-between mb-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <Skeleton className="h-8 w-16 mb-2" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}

export function TableSkeleton({ rows = 8, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-card">
      <div className="px-4 py-3 border-b border-border">
        <Skeleton className="h-4 w-32" />
      </div>
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            {Array.from({ length: cols }).map((_, i) => (
              <th key={`th-skel-${i}`} className="px-4 py-3">
                <Skeleton className="h-3 w-16" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={`tr-skel-${i}`} className="border-b border-border last:border-0">
              {Array.from({ length: cols }).map((_, j) => (
                <td key={`td-skel-${i}-${j}`} className="px-4 py-3">
                  <Skeleton className="h-3 w-full" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ChartSkeleton({ height = 240 }: { height?: number }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-6 w-20 rounded-md" />
      </div>
      <Skeleton className={`w-full rounded-lg`} style={{ height: `${height}px` }} />
    </div>
  );
}