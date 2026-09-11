import React from 'react';

type JobStatus = 'Open' | 'In Progress' | 'Completed' | 'Closed' | 'Cancelled';
type PmsStatus = 'Scheduled' | 'Completed' | 'Due' | 'Overdue';
type BillingStatus = 'Pending' | 'Quoted' | 'Approved' | 'Invoiced' | 'Paid' | 'Cancelled';
type Priority = 'Normal' | 'High' | 'Critical';
type DeploymentStatus = 'Scheduled' | 'Deployed' | 'Returned' | 'Cancelled';
type ReorderStatus = 'OK' | 'Low Stock' | 'Out of Stock';
type TechAvailability = 'Available' | 'On Deployment' | 'On Leave' | 'Unavailable';

type StatusType = JobStatus | PmsStatus | BillingStatus | Priority | DeploymentStatus | ReorderStatus | TechAvailability;

const statusMap: Record<string, string> = {
  // Job Status
  'Open': 'status-badge-open',
  'In Progress': 'status-badge-inprogress',
  'Completed': 'status-badge-completed',
  'Closed': 'status-badge-closed',
  'Cancelled': 'status-badge-cancelled',
  // Priority
  'Normal': 'priority-badge-normal',
  'High': 'priority-badge-high',
  'Critical': 'priority-badge-critical',
  // Billing
  'Pending': 'billing-badge-pending',
  'Quoted': 'billing-badge-quoted',
  'Approved': 'billing-badge-approved',
  'Invoiced': 'billing-badge-invoiced',
  'Paid': 'billing-badge-paid',
  // PMS
  'Scheduled': 'billing-badge-approved',
  'Due': 'billing-badge-invoiced',
  'Overdue': 'billing-badge-cancelled',
  // Deployment
  'Deployed': 'status-badge-inprogress',
  'Returned': 'status-badge-completed',
  // Reorder
  'OK': 'status-badge-completed',
  'Low Stock': 'priority-badge-high',
  'Out of Stock': 'priority-badge-critical',
  // Tech availability
  'Available': 'status-badge-completed',
  'On Deployment': 'status-badge-inprogress',
  'On Leave': 'status-badge-closed',
  'Unavailable': 'status-badge-cancelled',
};

interface StatusBadgeProps {
  status: StatusType;
  size?: 'sm' | 'md';
  dot?: boolean;
}

export default function StatusBadge({ status, size = 'md', dot = false }: StatusBadgeProps) {
  const cls = statusMap[status] || 'billing-badge-pending';
  return (
    <span className={`
      inline-flex items-center gap-1 rounded-full font-500 whitespace-nowrap
      ${cls}
      ${size === 'sm' ? 'text-2xs px-1.5 py-0.5' : 'text-xs px-2 py-0.5'}
    `}>
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80 flex-shrink-0" />}
      {status}
    </span>
  );
}