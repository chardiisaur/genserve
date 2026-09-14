import React from 'react';
import AppLayout from '@/components/AppLayout';
import TechniciansScreen from './components/TechniciansScreen';

export default function TechniciansPage() {
  return (
    <AppLayout currentPath="/technicians">
      <TechniciansScreen />
    </AppLayout>
  );
}
