import React from 'react';
import StatusBadge from '@/components/ui/StatusBadge';
import Icon from '@/components/ui/AppIcon';

const technicians = [
  { id: 'tech-001', name: 'Rodrigo Dela Cruz', position: 'Lead Technician', skillLevel: 'Senior', availability: 'Available' as const, initials: 'RC' },
  { id: 'tech-002', name: 'Mario Santos', position: 'Field Technician', skillLevel: 'Senior', availability: 'On Deployment' as const, initials: 'MS' },
  { id: 'tech-003', name: 'Jose Villanueva', position: 'Field Technician', skillLevel: 'Junior', availability: 'Available' as const, initials: 'JV' },
  { id: 'tech-004', name: 'Danilo Fernandez', position: 'Electrical Tech.', skillLevel: 'Senior', availability: 'Available' as const, initials: 'DF' },
  { id: 'tech-005', name: 'Antonio Garcia', position: 'Mechanical Tech.', skillLevel: 'Lead', availability: 'On Deployment' as const, initials: 'AG' },
  { id: 'tech-006', name: 'Eduardo Reyes', position: 'Field Technician', skillLevel: 'Junior', availability: 'Available' as const, initials: 'ER' },
  { id: 'tech-007', name: 'Carlos Bautista', position: 'Field Technician', skillLevel: 'Senior', availability: 'On Deployment' as const, initials: 'CB' },
  { id: 'tech-008', name: 'Renato Cruz', position: 'Lead Technician', skillLevel: 'Lead', availability: 'On Leave' as const, initials: 'RC' },
];

const avatarColors = [
  'bg-blue-600', 'bg-violet-600', 'bg-teal-600', 'bg-indigo-600',
  'bg-sky-600', 'bg-emerald-600', 'bg-rose-600', 'bg-amber-600',
];

export default function TechnicianAvailabilityPanel() {
  const available = technicians.filter(t => t.availability === 'Available').length;

  return (
    <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div>
          <h3 className="text-sm font-600 text-foreground">Technician Availability</h3>
          <p className="text-2xs text-muted-foreground mt-0.5">
            <span className="text-emerald-600 font-600">{available} available</span> · {technicians.length - available} deployed/leave
          </p>
        </div>
        <div className="p-1.5 rounded-md bg-blue-50">
          <Icon name="UsersIcon" size={14} className="text-blue-600" />
        </div>
      </div>
      <div className="divide-y divide-border">
        {technicians.map((tech, idx) => (
          <div key={tech.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30 transition-colors">
            <div className={`w-7 h-7 rounded-full ${avatarColors[idx % avatarColors.length]} flex items-center justify-center text-white text-2xs font-600 flex-shrink-0`}>
              {tech.initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-500 text-foreground truncate">{tech.name}</p>
              <p className="text-2xs text-muted-foreground">{tech.position} · {tech.skillLevel}</p>
            </div>
            <StatusBadge status={tech.availability} size="sm" />
          </div>
        ))}
      </div>
    </div>
  );
}