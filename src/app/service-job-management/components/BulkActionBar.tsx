'use client';

import React, { useState } from 'react';
import Icon from '@/components/ui/AppIcon';
import { JobStatus } from './mockData';

interface BulkActionBarProps {
  selectedCount: number;
  onClear: () => void;
  onBulkDelete: () => void;
  onBulkStatusChange: (status: JobStatus) => void;
}

export default function BulkActionBar({ selectedCount, onClear, onBulkDelete, onBulkStatusChange }: BulkActionBarProps) {
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const statusOptions: JobStatus[] = ['Open', 'In Progress', 'Completed', 'Closed', 'Cancelled'];

  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-primary/5 border-b border-primary/20 slide-up">
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded bg-primary flex items-center justify-center">
          <Icon name="CheckIcon" size={12} className="text-primary-foreground" />
        </div>
        <span className="text-xs font-600 text-primary tabular-nums">
          {selectedCount} job{selectedCount > 1 ? 's' : ''} selected
        </span>
      </div>

      <div className="h-4 w-px bg-primary/20" />

      {/* Change status */}
      <div className="relative">
        <button
          onClick={() => setStatusMenuOpen(!statusMenuOpen)}
          className="flex items-center gap-1.5 text-xs font-500 text-foreground hover:text-primary transition-colors px-2 py-1 rounded-md hover:bg-primary/10"
        >
          <Icon name="ArrowPathIcon" size={13} />
          Change Status
          <Icon name="ChevronDownIcon" size={11} />
        </button>
        {statusMenuOpen && (
          <>
            <div className="fixed inset-0 z-20" onClick={() => setStatusMenuOpen(false)} />
            <div className="absolute left-0 top-full mt-1 w-36 bg-card border border-border rounded-lg shadow-dropdown z-30 py-1 scale-in">
              {statusOptions.map(s => (
                <button
                  key={`bulk-status-${s}`}
                  onClick={() => { onBulkStatusChange(s); setStatusMenuOpen(false); }}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted transition-colors text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Delete */}
      {!confirmDelete ? (
        <button
          onClick={() => setConfirmDelete(true)}
          className="flex items-center gap-1.5 text-xs font-500 text-red-600 hover:text-red-700 transition-colors px-2 py-1 rounded-md hover:bg-red-50"
        >
          <Icon name="TrashIcon" size={13} />
          Delete Selected
        </button>
      ) : (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5">
          <Icon name="ExclamationTriangleIcon" size={13} className="text-red-600" />
          <span className="text-2xs text-red-700 font-500">Delete {selectedCount} job{selectedCount > 1 ? 's' : ''}?</span>
          <button
            onClick={() => { onBulkDelete(); setConfirmDelete(false); }}
            className="text-2xs font-700 text-red-700 hover:text-red-900 underline"
          >
            Confirm
          </button>
          <button
            onClick={() => setConfirmDelete(false)}
            className="text-2xs text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
        </div>
      )}

      <button
        onClick={onClear}
        className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <Icon name="XMarkIcon" size={13} />
        Clear selection
      </button>
    </div>
  );
}