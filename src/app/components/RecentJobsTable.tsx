'use client';

import React from 'react';
import Link from 'next/link';
import StatusBadge from '@/components/ui/StatusBadge';
import Icon from '@/components/ui/AppIcon';

interface RecentJob {
  id: string;
  jobOrderNo: string;
  clientName: string;
  siteName: string;
  generatorName: string;
  serviceType: string;
  priority: string;
  status: string;
  leadTechnicianName: string;
  scheduledDate: string;
  billingStatus: string;
  requestDate: string;
}

interface RecentJobsTableProps {
  jobs: RecentJob[];
}

export default function RecentJobsTable({ jobs }: RecentJobsTableProps) {
  return (
    <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
        <div>
          <h3 className="text-sm font-600 text-foreground">Recent Service Jobs</h3>
          <p className="text-2xs text-muted-foreground mt-0.5">
            Latest {jobs.length} job{jobs.length !== 1 ? 's' : ''} across all clients
          </p>
        </div>
        <Link
          href="/service-job-management"
          className="text-xs text-primary font-500 hover:underline flex items-center gap-1"
        >
          View all <Icon name="ArrowRightIcon" size={12} />
        </Link>
      </div>
      {jobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Icon name="ClipboardDocumentListIcon" size={32} className="mb-2 opacity-40" />
          <p className="text-sm">No service jobs found</p>
        </div>
      ) : (
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-2.5 text-2xs font-600 uppercase tracking-wider text-muted-foreground">Job No.</th>
                <th className="text-left px-4 py-2.5 text-2xs font-600 uppercase tracking-wider text-muted-foreground">Client / Site</th>
                <th className="text-left px-4 py-2.5 text-2xs font-600 uppercase tracking-wider text-muted-foreground">Generator</th>
                <th className="text-left px-4 py-2.5 text-2xs font-600 uppercase tracking-wider text-muted-foreground">Service Type</th>
                <th className="text-left px-4 py-2.5 text-2xs font-600 uppercase tracking-wider text-muted-foreground">Priority</th>
                <th className="text-left px-4 py-2.5 text-2xs font-600 uppercase tracking-wider text-muted-foreground">Status</th>
                <th className="text-left px-4 py-2.5 text-2xs font-600 uppercase tracking-wider text-muted-foreground">Technician</th>
                <th className="text-left px-4 py-2.5 text-2xs font-600 uppercase tracking-wider text-muted-foreground">Billing</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job, idx) => (
                <tr
                  key={job.id}
                  className={`border-b border-border last:border-0 hover:bg-muted/40 transition-colors ${idx % 2 === 0 ? '' : 'bg-muted/10'}`}
                >
                  <td className="px-4 py-2.5">
                    <Link href="/service-job-management" className="text-xs font-600 text-primary hover:underline tabular-nums">
                      {job.jobOrderNo}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5">
                    <p className="text-xs font-500 text-foreground truncate max-w-[130px]">{job.clientName}</p>
                    <p className="text-2xs text-muted-foreground truncate max-w-[130px]">{job.siteName}</p>
                  </td>
                  <td className="px-4 py-2.5">
                    <p className="text-xs text-foreground truncate max-w-[120px]">{job.generatorName}</p>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="text-xs text-foreground">{job.serviceType}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <StatusBadge status={job.priority as Parameters<typeof StatusBadge>[0]['status']} size="sm" />
                  </td>
                  <td className="px-4 py-2.5">
                    <StatusBadge status={job.status as Parameters<typeof StatusBadge>[0]['status']} size="sm" dot />
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="text-xs text-foreground">{job.leadTechnicianName || '—'}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <StatusBadge status={job.billingStatus as Parameters<typeof StatusBadge>[0]['status']} size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}