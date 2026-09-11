import React from 'react';
import AppLayout from '@/components/AppLayout';
import ClientsScreen from './components/ClientsScreen';

export default function ClientsPage() {
  return (
    <AppLayout currentPath="/clients">
      <ClientsScreen />
    </AppLayout>
  );
}
