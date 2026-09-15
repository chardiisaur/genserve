import React from 'react';
import AppLayout from '@/components/AppLayout';
import SitesScreen from './components/SitesScreen';

export default function SitesPage() {
  return (
    <AppLayout currentPath="/sites">
      <SitesScreen />
    </AppLayout>
  );
}
