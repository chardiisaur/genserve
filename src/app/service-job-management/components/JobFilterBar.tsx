'use client';

import React, { useState, useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';
import { FilterState } from './ServiceJobsScreen';
import { serviceTypes } from './mockData';

interface JobFilterBarProps {
  filters: FilterState;
  onChange: (f: FilterState) => void;
  onReset: () => void;
}

const statusOptions = ['Open', 'In Progress', 'Completed', 'Closed', 'Cancelled'];
const priorityOptions = ['Normal', 'High', 'Critical'];
const billingOptions = ['Pending', 'Quoted', 'Approved', 'Invoiced', 'Paid', 'Cancelled'];

export default function JobFilterBar({ filters, onChange, onReset }: JobFilterBarProps) {
  const activeCount = Object.values(filters).filter(v => v !== '').length;
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [manpowerNames, setManpowerNames] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/technicians')
      .then(r => r.ok ? r.json() : [])
      .then((data: { technicianName: string }[]) => {
        if (Array.isArray(data)) {
          setManpowerNames(data.map(t => t.technicianName));
        }
      })
      .catch(() => {/* silently fail */});
  }, []);

  const update = (key: keyof FilterState, value: string) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <div className="bg-card border border-border rounded-xl shadow-card px-4 py-3 space-y-3">
      {/* Top row: search + filter toggle */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="flex items-center gap-2 flex-1 min-w-0 bg-muted rounded-lg px-3 py-2">
          <Icon name="MagnifyingGlassIcon" size={15} className="text-muted-foreground flex-shrink-0" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => update('search', e.target.value)}
            placeholder="Search by job no., client, site, generator, manpower..."
            className="flex-1 text-xs bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground"
          />
          {filters.search && (
            <button onClick={() => update('search', '')} className="text-muted-foreground hover:text-foreground transition-colors">
              <Icon name="XMarkIcon" size={13} />
            </button>
          )}
        </div>

        {/* Filter toggle */}
        <button
          onClick={() => setFiltersExpanded(!filtersExpanded)}
          className={`
            flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-500 transition-all duration-150
            ${filtersExpanded || activeCount > 1
              ? 'border-primary/40 bg-primary/5 text-primary' :'border-border text-muted-foreground hover:border-muted-foreground hover:text-foreground'
            }
          `}
        >
          <Icon name="FunnelIcon" size={14} />
          Filters
          {activeCount > 0 && (
            <span className="ml-0.5 min-w-[16px] h-4 px-1 rounded-full bg-primary text-primary-foreground text-2xs font-700 flex items-center justify-center tabular-nums">
              {activeCount}
            </span>
          )}
        </button>

        {activeCount > 0 && (
          <button
            onClick={onReset}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Icon name="ArrowPathIcon" size={13} />
            Reset
          </button>
        )}
      </div>

      {/* Expanded filter row */}
      {filtersExpanded && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-5 gap-3 pt-1 border-t border-border fade-in">
          {/* Status */}
          <FilterSelect
            id="filter-status"
            label="Status"
            value={filters.status}
            options={statusOptions}
            onChange={(v) => update('status', v)}
          />
          {/* Priority */}
          <FilterSelect
            id="filter-priority"
            label="Priority"
            value={filters.priority}
            options={priorityOptions}
            onChange={(v) => update('priority', v)}
          />
          {/* Service Type */}
          <FilterSelect
            id="filter-svctype"
            label="Service Type"
            value={filters.serviceType}
            options={serviceTypes.map(s => s.name)}
            onChange={(v) => update('serviceType', v)}
          />
          {/* Lead Manpower */}
          <FilterSelect
            id="filter-tech"
            label="Lead Manpower"
            value={filters.technician}
            options={manpowerNames}
            onChange={(v) => update('technician', v)}
          />
          {/* Billing Status */}
          <FilterSelect
            id="filter-billing"
            label="Billing Status"
            value={filters.billingStatus}
            options={billingOptions}
            onChange={(v) => update('billingStatus', v)}
          />
        </div>
      )}

      {/* Active filter chips */}
      {activeCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap pt-1">
          {Object.entries(filters).filter(([, v]) => v !== '').map(([k, v]) => (
            <span
              key={`chip-${k}`}
              className="inline-flex items-center gap-1.5 bg-primary/8 border border-primary/20 text-primary text-2xs font-500 rounded-full px-2.5 py-1"
            >
              <span className="text-primary/60 capitalize">{k.replace(/([A-Z])/g, ' $1').trim()}:</span>
              {v}
              <button onClick={() => update(k as keyof FilterState, '')} className="text-primary/60 hover:text-primary transition-colors ml-0.5">
                <Icon name="XMarkIcon" size={11} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterSelect({
  id, label, value, options, onChange,
}: {
  id: string;
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-2xs font-500 text-muted-foreground mb-1">{label}</label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`
          w-full h-8 px-2 rounded-lg border text-xs bg-card text-foreground
          focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
          transition-colors
          ${value ? 'border-primary/40 text-primary font-500' : 'border-input text-foreground'}
        `}
      >
        <option value="">All {label}</option>
        {options.map(opt => (
          <option key={`opt-${id}-${opt}`} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}