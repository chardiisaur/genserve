'use client';

import React from 'react';
import JobsByStatusChart from './JobsByStatusChart';
import ServiceTypeDistributionChart from './ServiceTypeDistributionChart';

export default function DashboardChartsRow() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-2 gap-5">
      <JobsByStatusChart />
      <ServiceTypeDistributionChart />
    </div>
  );
}