import React from 'react';
import AppLayout from '@/components/AppLayout';
import ServiceJobsScreen from './components/ServiceJobsScreen';

export default function ServiceJobManagementPage() {
  return (
    <AppLayout currentPath="/service-job-management">
      <ServiceJobsScreen />
    </AppLayout>
  );
}