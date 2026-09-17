'use client';

import React from 'react';
import StatusBadge from '@/components/ui/StatusBadge';
import Icon from '@/components/ui/AppIcon';

interface TechnicianItem {
  id: string;
  name: string;
  position: string;
  skillLevel: string;
  availability: string;
  initials: string;
}

interface TechnicianAvailabilityPanelProps {
  technicians: TechnicianItem[];
}

const avatarColors = [
  'bg-blue-600', 'bg-violet-600', 'bg-teal-600', 'bg-indigo-600',
  'bg-sky-600', 'bg-emerald-600', 'bg-rose-600', 'bg-amber-600',
  'bg-orange-600', 'bg-pink-600', 'bg-cyan-600', 'bg-lime-600',
];

export default function TechnicianAvailabilityPanel({ technicians }: TechnicianAvailabilityPanelProps) {
  const available = technicians.filter((t) => t.availability === 'Available').length;

  return (
    <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div>
          <h3 className="text-sm font-600 text-foreground">Manpower Availability</h3>
          <p className="text-2xs text-muted-foreground mt-0.5">
            <span className="text-emerald-600 font-600">{available} available</span>
            {' · '}{technicians.length - available} deployed/leave
          </p>
        </div>
        <div className="p-1.5 rounded-md bg-blue-50">
          <Icon name="UsersIcon" size={14} className="text-blue-600" />
        </div>
      </div>
      {technicians.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <Icon name="UsersIcon" size={28} className="mb-2 opacity-40" />
          <p className="text-xs">No manpower records found</p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {technicians.map((tech, idx) => (
            <div key={tech.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30 transition-colors">
              <div className={`w-7 h-7 rounded-full ${avatarColors[idx % avatarColors.length]} flex items-center justify-center text-white text-2xs font-600 flex-shrink-0`}>
                {tech.initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-500 text-foreground truncate">{tech.name}</p>
                <p className="text-2xs text-muted-foreground">{tech.position}{tech.skillLevel ? ` · ${tech.skillLevel}` : ''}</p>
              </div>
              <StatusBadge status={tech.availability as Parameters<typeof StatusBadge>[0]['status']} size="sm" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}