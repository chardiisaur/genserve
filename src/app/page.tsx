import React from 'react';
import AppLayout from '@/components/AppLayout';
import DashboardKpiGrid from './components/DashboardKpiGrid';
import DashboardChartsRow from './components/DashboardChartsRow';
import RecentJobsTable from './components/RecentJobsTable';
import PmsDueList from './components/PmsDueList';
import TechnicianAvailabilityPanel from './components/TechnicianAvailabilityPanel';
import LowStockAlertList from './components/LowStockAlertList';

export default function OperationsDashboardPage() {
  return (
    <AppLayout currentPath="/">
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-600 text-foreground">Operations Dashboard</h1>
            <p className="text-xs text-muted-foreground mt-1">
              Indentrade Systems Corp. — Live operational overview · Updated 09 Sep 2026, 06:47
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-2xs text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1 font-500">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </span>
          </div>
        </div>

        {/* KPI bento grid */}
        <DashboardKpiGrid />

        {/* Charts row */}
        <DashboardChartsRow />

        {/* Lower panels grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3 gap-5">
          {/* Recent jobs — spans 2 cols */}
          <div className="lg:col-span-2 xl:col-span-2 2xl:col-span-2">
            <RecentJobsTable />
          </div>
          {/* Right column */}
          <div className="flex flex-col gap-5">
            <PmsDueList />
            <TechnicianAvailabilityPanel />
          </div>
        </div>

        {/* Low stock full width */}
        <LowStockAlertList />
      </div>
    </AppLayout>
  );
}