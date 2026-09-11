'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { toast } from 'sonner';
import Icon from '@/components/ui/AppIcon';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import { mockJobs, ServiceJob, JobStatus } from './mockData';
import JobFilterBar from './JobFilterBar';
import CreateJobModal from './CreateJobModal';
import JobDetailDrawer from './JobDetailDrawer';
import BulkActionBar from './BulkActionBar';

export interface FilterState {
  search: string;
  status: string;
  priority: string;
  serviceType: string;
  technician: string;
  billingStatus: string;
}

const initialFilters: FilterState = {
  search: '',
  status: '',
  priority: '',
  serviceType: '',
  technician: '',
  billingStatus: '',
};

export default function ServiceJobsScreen() {
  const [jobs, setJobs] = useState<ServiceJob[]>(mockJobs);
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailJob, setDetailJob] = useState<ServiceJob | null>(null);
  const [editJob, setEditJob] = useState<ServiceJob | null>(null);
  const [sortCol, setSortCol] = useState<keyof ServiceJob>('requestDate');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [deletingIds, setDeletingIds] = useState<string[]>([]);

  // Load jobs from database on mount
  useEffect(() => {
    fetch('/api/service-jobs')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data && Array.isArray(data) && data.length > 0) {
          // Map API response to ServiceJob shape
          const mapped: ServiceJob[] = data.map((j: Record<string, unknown>) => ({
            id: j.id as string,
            jobOrderNo: j.jobOrderNo as string,
            requestDate: j.requestDate as string,
            clientId: j.clientId as string,
            clientName: j.clientId as string,
            siteId: j.siteId as string,
            siteName: j.siteId as string,
            generatorId: j.generatorId as string,
            generatorName: j.generatorId as string,
            serviceType: j.serviceType as string,
            problem: (j.problem as string) || '',
            priority: (j.priority as Priority) || 'Normal',
            scheduledDate: (j.scheduledDate as string) || '',
            status: (j.status as JobStatus) || 'Open',
            leadTechnicianId: (j.leadTechnicianId as string) || '',
            leadTechnicianName: (j.leadTechnicianId as string) || '',
            additionalTechnicianName: (j.additionalTechnicianId as string) || undefined,
            startDate: (j.startDate as string) || undefined,
            completionDate: (j.completionDate as string) || undefined,
            runningHours: (j.runningHours as number) || undefined,
            findings: (j.findings as string) || undefined,
            workPerformed: (j.workPerformed as string) || undefined,
            testingResults: (j.testingResults as string) || undefined,
            recommendations: (j.recommendations as string) || undefined,
            partsMaterialsSummary: (j.partsMaterialsSummary as string) || undefined,
            customerRepresentative: (j.customerRepresentative as string) || undefined,
            customerContact: (j.customerContact as string) || undefined,
            serviceReportNo: (j.serviceReportNo as string) || undefined,
            quotationNo: (j.quotationNo as string) || undefined,
            billingStatus: (j.billingStatus as BillingStatus) || 'Pending',
            remarks: (j.remarks as string) || undefined,
          }));
          setJobs(mapped);
        }
      })
      .catch(() => { /* keep mock data on error */ });
  }, []);

  const filtered = useMemo(() => {
    return jobs.filter((j) => {
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (
          !j.jobOrderNo.toLowerCase().includes(q) &&
          !j.clientName.toLowerCase().includes(q) &&
          !j.siteName.toLowerCase().includes(q) &&
          !j.generatorName.toLowerCase().includes(q) &&
          !j.leadTechnicianName.toLowerCase().includes(q) &&
          !j.serviceType.toLowerCase().includes(q)
        ) return false;
      }
      if (filters.status && j.status !== filters.status) return false;
      if (filters.priority && j.priority !== filters.priority) return false;
      if (filters.serviceType && j.serviceType !== filters.serviceType) return false;
      if (filters.technician && j.leadTechnicianName !== filters.technician) return false;
      if (filters.billingStatus && j.billingStatus !== filters.billingStatus) return false;
      return true;
    });
  }, [jobs, filters]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const av = a[sortCol] ?? '';
      const bv = b[sortCol] ?? '';
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filtered, sortCol, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paginated = sorted.slice((page - 1) * pageSize, page * pageSize);

  const handleSort = (col: keyof ServiceJob) => {
    if (sortCol === col) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
    setPage(1);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === paginated.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginated.map(j => j.id));
    }
  };

  const handleDelete = (id: string) => {
    setDeletingIds(prev => [...prev, id]);
    setTimeout(() => {
      setJobs(prev => prev.filter(j => j.id !== id));
      setDeletingIds(prev => prev.filter(x => x !== id));
      setSelectedIds(prev => prev.filter(x => x !== id));
      toast.success('Service job deleted successfully.');
    }, 280);
  };

  const handleBulkDelete = () => {
    selectedIds.forEach(id => setDeletingIds(prev => [...prev, id]));
    setTimeout(() => {
      const count = selectedIds.length;
      setJobs(prev => prev.filter(j => !selectedIds.includes(j.id)));
      setDeletingIds([]);
      setSelectedIds([]);
      toast.success(`${count} job${count > 1 ? 's' : ''} deleted.`);
    }, 300);
  };

  const handleBulkStatusChange = (status: JobStatus) => {
    setJobs(prev =>
      prev.map(j => selectedIds.includes(j.id) ? { ...j, status } : j)
    );
    toast.success(`${selectedIds.length} job${selectedIds.length > 1 ? 's' : ''} updated to "${status}".`);
    setSelectedIds([]);
  };

  const handleCreateJob = (data: Partial<ServiceJob>) => {
    const newJob: ServiceJob = {
      id: `job-new-${Date.now()}`,
      jobOrderNo: `JO-2026-${String(jobs.length + 95).padStart(4, '0')}`,
      requestDate: '09 Sep 2026',
      billingStatus: 'Pending',
      status: 'Open',
      ...data,
    } as ServiceJob;
    setJobs(prev => [newJob, ...prev]);
    setCreateModalOpen(false);
    toast.success(`Job ${newJob.jobOrderNo} created successfully.`);
  };

  const handleUpdateJob = (updated: ServiceJob) => {
    setJobs(prev => prev.map(j => j.id === updated.id ? updated : j));
    setDetailJob(updated);
    toast.success(`Job ${updated.jobOrderNo} updated.`);
  };

  const handleStatusChange = (job: ServiceJob, newStatus: JobStatus) => {
    const updated = { ...job, status: newStatus };
    setJobs(prev => prev.map(j => j.id === job.id ? updated : j));
    toast.success(`Job ${job.jobOrderNo} status changed to "${newStatus}".`);
  };

  const activeFilterCount = Object.values(filters).filter(v => v !== '').length;

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-600 text-foreground">Service Jobs</h1>
          <p className="text-xs text-muted-foreground mt-1">
            {filtered.length} job{filtered.length !== 1 ? 's' : ''} {activeFilterCount > 0 ? `matching filters` : 'total'} · Updated 09 Sep 2026, 06:47
          </p>
        </div>
        <button
          onClick={() => setCreateModalOpen(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground text-sm font-500 px-4 py-2 rounded-lg hover:bg-primary/90 active:scale-95 transition-all duration-150 flex-shrink-0"
        >
          <Icon name="PlusIcon" size={16} />
          Create Job
        </button>
      </div>

      {/* KPI summary row */}
      <JobStatusSummary jobs={jobs} />

      {/* Filter bar */}
      <JobFilterBar
        filters={filters}
        onChange={(f) => { setFilters(f); setPage(1); }}
        onReset={() => { setFilters(initialFilters); setPage(1); }}
      />

      {/* Table card */}
      <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
        {/* Bulk action bar */}
        <BulkActionBar
          selectedCount={selectedIds.length}
          onClear={() => setSelectedIds([])}
          onBulkDelete={handleBulkDelete}
          onBulkStatusChange={handleBulkStatusChange}
        />

        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full min-w-[1200px]">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={paginated.length > 0 && selectedIds.length === paginated.length}
                    onChange={toggleSelectAll}
                    className="w-3.5 h-3.5 rounded border-input text-primary focus:ring-primary/30 cursor-pointer"
                    aria-label="Select all"
                  />
                </th>
                {([
                  { key: 'jobOrderNo', label: 'Job Order No.' },
                  { key: 'requestDate', label: 'Request Date' },
                  { key: 'clientName', label: 'Client' },
                  { key: 'siteName', label: 'Site' },
                  { key: 'generatorName', label: 'Generator' },
                  { key: 'serviceType', label: 'Service Type' },
                  { key: 'priority', label: 'Priority' },
                  { key: 'status', label: 'Status' },
                  { key: 'leadTechnicianName', label: 'Lead Technician' },
                  { key: 'scheduledDate', label: 'Scheduled Date' },
                  { key: 'billingStatus', label: 'Billing' },
                ] as { key: keyof ServiceJob; label: string }[]).map(col => (
                  <th
                    key={`th-${col.key}`}
                    className="text-left px-3 py-3 text-2xs font-600 uppercase tracking-wider text-muted-foreground cursor-pointer hover:text-foreground select-none whitespace-nowrap"
                    onClick={() => handleSort(col.key)}
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      {sortCol === col.key ? (
                        <Icon name={sortDir === 'asc' ? 'ChevronUpIcon' : 'ChevronDownIcon'} size={11} className="text-primary" />
                      ) : (
                        <Icon name="ChevronUpDownIcon" size={11} className="text-muted-foreground/40" />
                      )}
                    </div>
                  </th>
                ))}
                <th className="px-3 py-3 text-right text-2xs font-600 uppercase tracking-wider text-muted-foreground w-24">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={13}>
                    <EmptyState
                      icon="WrenchScrewdriverIcon"
                      title="No service jobs found"
                      description="No jobs match your current filters. Try adjusting the filters above, or create a new service job to get started."
                      action={{ label: 'Create Service Job', onClick: () => setCreateModalOpen(true) }}
                    />
                  </td>
                </tr>
              ) : (
                paginated.map((job, idx) => (
                  <JobTableRow
                    key={job.id}
                    job={job}
                    idx={idx}
                    selected={selectedIds.includes(job.id)}
                    deleting={deletingIds.includes(job.id)}
                    onSelect={() => toggleSelect(job.id)}
                    onView={() => setDetailJob(job)}
                    onEdit={() => { setEditJob(job); setCreateModalOpen(true); }}
                    onDelete={() => handleDelete(job.id)}
                    onStatusChange={(s) => handleStatusChange(job, s)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {sorted.length > 0 && (
          <TablePagination
            page={page}
            totalPages={totalPages}
            pageSize={pageSize}
            total={sorted.length}
            onPageChange={setPage}
            onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
          />
        )}
      </div>

      {/* Create / Edit modal */}
      <CreateJobModal
        open={createModalOpen}
        editJob={editJob}
        onClose={() => { setCreateModalOpen(false); setEditJob(null); }}
        onCreate={handleCreateJob}
        onUpdate={handleUpdateJob}
      />

      {/* Detail drawer */}
      <JobDetailDrawer
        job={detailJob}
        onClose={() => setDetailJob(null)}
        onEdit={(job) => { setEditJob(job); setDetailJob(null); setCreateModalOpen(true); }}
        onStatusChange={handleStatusChange}
        onUpdateJob={handleUpdateJob}
      />
    </div>
  );
}

// ─── Job Status Summary ───────────────────────────────────────────────────────

function JobStatusSummary({ jobs }: { jobs: ServiceJob[] }) {
  const counts = {
    open: jobs.filter(j => j.status === 'Open').length,
    inProgress: jobs.filter(j => j.status === 'In Progress').length,
    completed: jobs.filter(j => j.status === 'Completed').length,
    closed: jobs.filter(j => j.status === 'Closed').length,
    cancelled: jobs.filter(j => j.status === 'Cancelled').length,
  };

  const summaryItems = [
    { id: 'sum-open', label: 'Open', count: counts.open, color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 'sum-inprog', label: 'In Progress', count: counts.inProgress, color: 'text-amber-600', bg: 'bg-amber-50' },
    { id: 'sum-completed', label: 'Completed', count: counts.completed, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { id: 'sum-closed', label: 'Closed', count: counts.closed, color: 'text-slate-600', bg: 'bg-slate-50' },
    { id: 'sum-cancelled', label: 'Cancelled', count: counts.cancelled, color: 'text-red-600', bg: 'bg-red-50' },
  ];

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {summaryItems.map(item => (
        <div key={item.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border ${item.bg}`}>
          <span className={`text-xl font-700 tabular-nums ${item.color}`}>{item.count}</span>
          <span className="text-xs text-muted-foreground font-500">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Job Table Row ────────────────────────────────────────────────────────────

interface JobTableRowProps {
  job: ServiceJob;
  idx: number;
  selected: boolean;
  deleting: boolean;
  onSelect: () => void;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (s: JobStatus) => void;
}

function JobTableRow({ job, idx, selected, deleting, onSelect, onView, onEdit, onDelete, onStatusChange }: JobTableRowProps) {
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);

  const statusOptions: JobStatus[] = ['Open', 'In Progress', 'Completed', 'Closed', 'Cancelled'];

  return (
    <tr
      className={`
        border-b border-border last:border-0 transition-all duration-200 group
        ${deleting ? 'row-delete-exit' : ''}
        ${selected ? 'bg-primary/5' : idx % 2 === 0 ? '' : 'bg-muted/10'}
        hover:bg-muted/40
      `}
    >
      <td className="px-4 py-2.5">
        <input
          type="checkbox"
          checked={selected}
          onChange={onSelect}
          className="w-3.5 h-3.5 rounded border-input text-primary focus:ring-primary/30 cursor-pointer"
          aria-label={`Select ${job.jobOrderNo}`}
        />
      </td>
      <td className="px-3 py-2.5">
        <button
          onClick={onView}
          className="text-xs font-600 text-primary hover:underline tabular-nums whitespace-nowrap"
        >
          {job.jobOrderNo}
        </button>
        {job.serviceReportNo && (
          <p className="text-2xs text-muted-foreground tabular-nums">{job.serviceReportNo}</p>
        )}
      </td>
      <td className="px-3 py-2.5">
        <span className="text-xs text-foreground whitespace-nowrap">{job.requestDate}</span>
      </td>
      <td className="px-3 py-2.5">
        <span className="text-xs font-500 text-foreground truncate max-w-[120px] block">{job.clientName}</span>
      </td>
      <td className="px-3 py-2.5">
        <span className="text-xs text-foreground truncate max-w-[120px] block">{job.siteName}</span>
      </td>
      <td className="px-3 py-2.5">
        <span className="text-xs text-foreground truncate max-w-[130px] block">{job.generatorName}</span>
      </td>
      <td className="px-3 py-2.5">
        <span className="text-xs text-foreground whitespace-nowrap">{job.serviceType}</span>
      </td>
      <td className="px-3 py-2.5">
        <StatusBadge status={job.priority} size="sm" />
      </td>
      <td className="px-3 py-2.5 relative">
        <div className="relative inline-block">
          <button
            onClick={() => setStatusMenuOpen(!statusMenuOpen)}
            className="flex items-center gap-1 hover:opacity-80 transition-opacity"
            title="Click to change status"
            aria-haspopup="true"
            aria-expanded={statusMenuOpen}
          >
            <StatusBadge status={job.status} size="sm" dot />
            <Icon name="ChevronDownIcon" size={10} className="text-muted-foreground" />
          </button>
          {statusMenuOpen && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setStatusMenuOpen(false)} />
              <div className="absolute left-0 top-full mt-1 w-36 bg-card border border-border rounded-lg shadow-dropdown z-30 py-1 scale-in">
                {statusOptions.map(s => (
                  <button
                    key={`status-opt-${s}`}
                    onClick={() => { onStatusChange(s); setStatusMenuOpen(false); }}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-muted transition-colors text-left ${job.status === s ? 'font-600 text-primary' : 'text-foreground'}`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60 flex-shrink-0" />
                    {s}
                    {job.status === s && <Icon name="CheckIcon" size={11} className="ml-auto text-primary" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </td>
      <td className="px-3 py-2.5">
        <span className="text-xs text-foreground">{job.leadTechnicianName}</span>
        {job.additionalTechnicianName && (
          <p className="text-2xs text-muted-foreground">+{job.additionalTechnicianName}</p>
        )}
      </td>
      <td className="px-3 py-2.5">
        <span className="text-xs text-foreground whitespace-nowrap">{job.scheduledDate}</span>
      </td>
      <td className="px-3 py-2.5">
        <StatusBadge status={job.billingStatus} size="sm" />
      </td>
      <td className="px-3 py-2.5">
        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <ActionIconButton icon="EyeIcon" label="View job details" onClick={onView} />
          <ActionIconButton icon="PencilSquareIcon" label="Edit service job" onClick={onEdit} />
          <ActionIconButton icon="TrashIcon" label="Delete job — cannot be undone" onClick={onDelete} danger />
        </div>
      </td>
    </tr>
  );
}

function ActionIconButton({ icon, label, onClick, danger = false }: { icon: string; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <div className="relative group/btn">
      <button
        onClick={onClick}
        title={label}
        className={`
          p-1.5 rounded-md transition-all duration-150 active:scale-90
          ${danger
            ? 'hover:bg-red-50 text-muted-foreground hover:text-red-600'
            : 'hover:bg-muted text-muted-foreground hover:text-foreground'
          }
        `}
        aria-label={label}
      >
        <Icon name={icon as Parameters<typeof Icon>[0]['name']} size={14} />
      </button>
    </div>
  );
}

// ─── Table Pagination ─────────────────────────────────────────────────────────

function TablePagination({
  page, totalPages, pageSize, total, onPageChange, onPageSizeChange,
}: {
  page: number;
  totalPages: number;
  pageSize: number;
  total: number;
  onPageChange: (p: number) => void;
  onPageSizeChange: (s: number) => void;
}) {
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  const pageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('ellipsis');
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
      if (page < totalPages - 2) pages.push('ellipsis');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-border">
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground tabular-nums">
          Showing {start}–{end} of {total} jobs
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Per page:</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="text-xs border border-input rounded-md px-2 py-1 bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            {[10, 20, 50].map(s => (
              <option key={`ps-${s}`} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Previous page"
        >
          <Icon name="ChevronLeftIcon" size={14} />
        </button>
        {pageNumbers().map((p, i) =>
          p === 'ellipsis' ? (
            <span key={`ellipsis-${i}`} className="px-2 text-xs text-muted-foreground">…</span>
          ) : (
            <button
              key={`page-${p}`}
              onClick={() => onPageChange(p)}
              className={`
                min-w-[28px] h-7 px-2 rounded-md text-xs font-500 transition-colors
                ${page === p
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted text-foreground'
                }
              `}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Next page"
        >
          <Icon name="ChevronRightIcon" size={14} />
        </button>
      </div>
    </div>
  );
}