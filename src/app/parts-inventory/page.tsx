'use client';
import React from 'react';
import AppLayout from '@/components/AppLayout';
import PartsInventoryScreen from './components/PartsInventoryScreen';

export default function PartsInventoryPage() {
  return (
    <AppLayout currentPath="/parts-inventory">
      <PartsInventoryScreen />
    </AppLayout>
  );
}
