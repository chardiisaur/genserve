'use client';
import React from 'react';
import AppLayout from '@/components/AppLayout';
import PmsScheduleScreen from './components/PmsScheduleScreen';
export default function PmsSchedulePage() {
  return (
    <AppLayout currentPath="/pms">
      <PmsScheduleScreen />
    </AppLayout>
  );
}
