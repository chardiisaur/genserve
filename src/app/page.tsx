'use client';

import React, { useEffect, useState, useCallback } from 'react';
import AppLayout from '@/components/AppLayout';
import DashboardKpiGrid from './components/DashboardKpiGrid';
import DashboardChartsRow from './components/DashboardChartsRow';
import RecentJobsTable from './components/RecentJobsTable';
import PmsDueList from './components/PmsDueList';
import TechnicianAvailabilityPanel from './components/TechnicianAvailabilityPanel';
import LowStockAlertList from './components/LowStockAlertList';
import Icon from '@/components/ui/AppIcon';

interface DashboardData {
  refreshedAt: string;
  kpis: {
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
  };
  recentJobs: {
    id: string;
    jobOrderNo: string;
    clientName: string;
    siteName: string;
    generatorName: string;
    serviceType: string;
    priority: string;
    status: string;
    leadTechnicianName: string;
    scheduledDate: string;
    billingStatus: string;
    requestDate: string;
  }[];
  pmsDue: {
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
  }[];
  technicians: {
    id: string;
    name: string;
    position: string;
    skillLevel: string;
    availability: string;
    initials: string;
  }[];
  lowStockParts: {
    partId: string;
    partNo: string;
    partDescription: string;
    brand: string;
    stockQty: number;
    minimumStock: number;
    unit: string;
    unitCost: number;
    supplier: string;
    storageLocation: string;
    reorderStatus: string;
  }[];
  charts: {
    jobsByStatus: { month: string; open: number; inProgress: number; completed: number; closed: number }[];
    serviceTypeDistribution: { name: string; value: number; color: string }[];
  };
}

function formatRefreshedAt(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-PH', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export default function OperationsDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/dashboard');
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Server error ${res.status}`);
      }
      const json: DashboardData = await res.json();
      setData(json);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return (
    <AppLayout currentPath="/">
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-600 text-foreground">Operations Dashboard</h1>
            <p className="text-xs text-muted-foreground mt-1">
              Indentrade Systems Corp. — Real-time operational overview
              {data?.refreshedAt ? ` · Updated ${formatRefreshedAt(data.refreshedAt)}` : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchDashboard}
              disabled={loading}
              className="flex items-center gap-1.5 text-2xs text-muted-foreground bg-muted border border-border rounded-full px-2.5 py-1 font-500 hover:bg-muted/80 transition-colors disabled:opacity-50"
            >
              <Icon name={loading ? 'ArrowPathIcon' : 'ArrowPathIcon'} size={12} className={loading ? 'animate-spin' : ''} />
              {loading ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-5 py-4">
            <Icon name="ExclamationCircleIcon" size={20} className="text-red-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-600 text-red-800">Failed to load dashboard data</p>
              <p className="text-xs text-red-600 mt-0.5">{error}</p>
            </div>
            <button
              onClick={fetchDashboard}
              className="flex items-center gap-1.5 text-xs font-500 text-red-700 bg-red-100 hover:bg-red-200 border border-red-300 rounded-lg px-3 py-1.5 transition-colors"
            >
              <Icon name="ArrowPathIcon" size={13} />
              Retry
            </button>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && !data && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-5 h-28 animate-pulse">
                  <div className="h-3 bg-muted rounded w-2/3 mb-3" />
                  <div className="h-7 bg-muted rounded w-1/2 mb-2" />
                  <div className="h-2.5 bg-muted rounded w-3/4" />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="bg-card border border-border rounded-xl p-5 h-64 animate-pulse" />
              <div className="bg-card border border-border rounded-xl p-5 h-64 animate-pulse" />
            </div>
          </div>
        )}

        {/* Dashboard content */}
        {data && (
          <>
            {/* KPI bento grid */}
            <DashboardKpiGrid kpis={data.kpis} />

            {/* Charts row */}
            <DashboardChartsRow
              jobsByStatus={data.charts.jobsByStatus}
              serviceTypeDistribution={data.charts.serviceTypeDistribution}
            />

            {/* Lower panels grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3 gap-5">
              {/* Recent jobs — spans 2 cols */}
              <div className="lg:col-span-2 xl:col-span-2 2xl:col-span-2">
                <RecentJobsTable jobs={data.recentJobs} />
              </div>
              {/* Right column */}
              <div className="flex flex-col gap-5">
                <PmsDueList items={data.pmsDue} />
                <TechnicianAvailabilityPanel technicians={data.technicians} />
              </div>
            </div>

            {/* Low stock full width */}
            <LowStockAlertList parts={data.lowStockParts} />
          </>
        )}
      </div>
    </AppLayout>
  );
}