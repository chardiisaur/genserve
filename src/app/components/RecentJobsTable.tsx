import React from 'react';
import Link from 'next/link';
import StatusBadge from '@/components/ui/StatusBadge';
import Icon from '@/components/ui/AppIcon';

const recentJobs = [
  {
    id: 'job-2026-0094',
    jobNo: 'JO-2026-0094',
    client: 'BDO Unibank Inc.',
    site: 'Makati Main Branch',
    generator: 'GEN-047 / Cummins C550',
    serviceType: 'Emergency Call',
    priority: 'Critical' as const,
    status: 'In Progress' as const,
    technician: 'R. Dela Cruz',
    scheduledDate: '09 Sep 2026',
    billingStatus: 'Pending' as const,
  },
  {
    id: 'job-2026-0093',
    jobNo: 'JO-2026-0093',
    client: 'SM Prime Holdings',
    site: 'SM Aura Premier',
    generator: 'GEN-031 / Mitsubishi S12R',
    serviceType: 'PMS',
    priority: 'Normal' as const,
    status: 'Open' as const,
    technician: 'M. Santos',
    scheduledDate: '10 Sep 2026',
    billingStatus: 'Pending' as const,
  },
  {
    id: 'job-2026-0092',
    jobNo: 'JO-2026-0092',
    client: 'Ayala Land Inc.',
    site: 'BGC Corporate Center',
    generator: 'GEN-022 / Cummins KTA38',
    serviceType: 'Repair',
    priority: 'High' as const,
    status: 'In Progress' as const,
    technician: 'J. Villanueva',
    scheduledDate: '08 Sep 2026',
    billingStatus: 'Quoted' as const,
  },
  {
    id: 'job-2026-0091',
    jobNo: 'JO-2026-0091',
    client: 'PLDT Inc.',
    site: 'Mandaluyong Data Center',
    generator: 'GEN-015 / Cummins QSK78',
    serviceType: 'Load Test',
    priority: 'High' as const,
    status: 'Completed' as const,
    technician: 'R. Dela Cruz',
    scheduledDate: '07 Sep 2026',
    billingStatus: 'Invoiced' as const,
  },
  {
    id: 'job-2026-0090',
    jobNo: 'JO-2026-0090',
    client: 'Robinsons Land Corp.',
    site: 'Galleria Mall Ortigas',
    generator: 'GEN-039 / Mitsubishi S16R',
    serviceType: 'Troubleshooting',
    priority: 'High' as const,
    status: 'Open' as const,
    technician: 'D. Fernandez',
    scheduledDate: '09 Sep 2026',
    billingStatus: 'Pending' as const,
  },
  {
    id: 'job-2026-0089',
    jobNo: 'JO-2026-0089',
    client: 'Megaworld Corp.',
    site: 'Eastwood City Tower 1',
    generator: 'GEN-028 / Cummins 6CTA',
    serviceType: 'PMS',
    priority: 'Normal' as const,
    status: 'Completed' as const,
    technician: 'A. Garcia',
    scheduledDate: '05 Sep 2026',
    billingStatus: 'Paid' as const,
  },
  {
    id: 'job-2026-0088',
    jobNo: 'JO-2026-0088',
    client: 'ICTSI Ports',
    site: 'MICT South Harbor',
    generator: 'GEN-011 / Cummins KTA50',
    serviceType: 'Inspection',
    priority: 'Normal' as const,
    status: 'Closed' as const,
    technician: 'M. Santos',
    scheduledDate: '03 Sep 2026',
    billingStatus: 'Paid' as const,
  },
  {
    id: 'job-2026-0087',
    jobNo: 'JO-2026-0087',
    client: 'Jollibee Foods Corp.',
    site: 'Ortigas Commissary',
    generator: 'GEN-003 / Mitsubishi S6A3',
    serviceType: 'Repair',
    priority: 'High' as const,
    status: 'Open' as const,
    technician: 'J. Villanueva',
    scheduledDate: '10 Sep 2026',
    billingStatus: 'Pending' as const,
  },
];

export default function RecentJobsTable() {
  return (
    <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
        <div>
          <h3 className="text-sm font-600 text-foreground">Recent Service Jobs</h3>
          <p className="text-2xs text-muted-foreground mt-0.5">Latest 8 jobs across all clients</p>
        </div>
        <Link
          href="/service-job-management"
          className="text-xs text-primary font-500 hover:underline flex items-center gap-1"
        >
          View all <Icon name="ArrowRightIcon" size={12} />
        </Link>
      </div>
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
            {recentJobs.map((job, idx) => (
              <tr
                key={job.id}
                className={`border-b border-border last:border-0 hover:bg-muted/40 transition-colors ${idx % 2 === 0 ? '' : 'bg-muted/10'}`}
              >
                <td className="px-4 py-2.5">
                  <Link href="/service-job-management" className="text-xs font-600 text-primary hover:underline tabular-nums">
                    {job.jobNo}
                  </Link>
                </td>
                <td className="px-4 py-2.5">
                  <p className="text-xs font-500 text-foreground truncate max-w-[130px]">{job.client}</p>
                  <p className="text-2xs text-muted-foreground truncate max-w-[130px]">{job.site}</p>
                </td>
                <td className="px-4 py-2.5">
                  <p className="text-xs text-foreground truncate max-w-[120px]">{job.generator}</p>
                </td>
                <td className="px-4 py-2.5">
                  <span className="text-xs text-foreground">{job.serviceType}</span>
                </td>
                <td className="px-4 py-2.5">
                  <StatusBadge status={job.priority} size="sm" />
                </td>
                <td className="px-4 py-2.5">
                  <StatusBadge status={job.status} size="sm" dot />
                </td>
                <td className="px-4 py-2.5">
                  <span className="text-xs text-foreground">{job.technician}</span>
                </td>
                <td className="px-4 py-2.5">
                  <StatusBadge status={job.billingStatus} size="sm" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}