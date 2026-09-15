'use client';

import React from 'react';
import JobsByStatusChart from './JobsByStatusChart';
import ServiceTypeDistributionChart from './ServiceTypeDistributionChart';

interface MonthlyJobData {
  month: string;
  open: number;
  inProgress: number;
  completed: number;
  closed: number;
}

interface ServiceTypeItem {
  name: string;
  value: number;
  color: string;
}

interface DashboardChartsRowProps {
  jobsByStatus: MonthlyJobData[];
  serviceTypeDistribution: ServiceTypeItem[];
}

export default function DashboardChartsRow({ jobsByStatus, serviceTypeDistribution }: DashboardChartsRowProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-2 gap-5">
      <JobsByStatusChart data={jobsByStatus} />
      <ServiceTypeDistributionChart data={serviceTypeDistribution} />
    </div>
  );
}