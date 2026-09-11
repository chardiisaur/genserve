import React from 'react';
import AppLayout from '@/components/AppLayout';
import GeneratorsScreen from './components/GeneratorsScreen';

export default function GeneratorsPage() {
  return (
    <AppLayout currentPath="/generators">
      <GeneratorsScreen />
    </AppLayout>
  );
}
