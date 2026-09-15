'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Icon from '@/components/ui/AppIcon';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import { ServiceJob, JobStatus, BillingStatus, Priority } from './mockData';
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

function mapApiJob(j: Record<string, unknown>): ServiceJob {
  return {
    id: j.id as string,
    jobOrderNo: j.jobOrderNo as string,
    requestDate: (j.requestDate as string) || '',
    clientId: (j.clientId as string) || '',
    clientName: (j.clientId as string) || '',
    siteId: (j.siteId as string) || '',
    siteName: (j.siteId as string) || '',
    generatorId: (j.generatorId as string) || '',
    generatorName: (j.generatorId as string) || '',
    serviceType: (j.serviceType as string) || '',
    problem: (j.problem as string) || '',
    priority: ((j.priority as Priority) || 'Normal'),
    scheduledDate: (j.scheduledDate as string) || '',
    status: ((j.status as JobStatus) || 'Open'),
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
    billingStatus: ((j.billingStatus as BillingStatus) || 'Pending'),
    remarks: (j.remarks as string) || undefined,
  };
}

export default function ServiceJobsScreen() {
  const [jobs, setJobs] = useState<ServiceJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/service-jobs');
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Server error ${res.status}`);
      }
      const data = await res.json();
      setJobs(Array.isArray(data) ? data.map(mapApiJob) : []);
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to load service jobs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const filtered = useMemo(() => {
    return jobs.filter((j) => {
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (!j.jobOrderNo.toLowerCase().includes(q) && !j.clientName.toLowerCase().includes(q) &&
            !j.siteName.toLowerCase().includes(q) && !j.generatorName.toLowerCase().includes(q) &&
            !j.leadTechnicianName.toLowerCase().includes(q) && !j.serviceType.toLowerCase().includes(q)) return false;
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
    if (sortCol === col) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
    setPage(1);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === paginated.length) setSelectedIds([]);
    else setSelectedIds(paginated.map(j => j.id));
  };

  const handleDelete = async (id: string) => {
    const job = jobs.find(j => j.id === id);
    if (!job) return;
    setDeletingIds(prev => [...prev, id]);
    try {
      const res = await fetch(`/api/service-jobs/${job.jobOrderNo}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Server error ${res.status}`);
      }
      await fetchJobs();
      setSelectedIds(prev => prev.filter(x => x !== id));
      if (detailJob?.id === id) setDetailJob(null);
    } catch (err: unknown) {
      alert((err as Error).message || 'Failed to delete job');
    } finally {
      setDeletingIds(prev => prev.filter(x => x !== id));
    }
  };

  const handleBulkDelete = async () => {
    const toDelete = [...selectedIds];
    for (const id of toDelete) {
      await handleDelete(id);
    }
  };

  const handleBulkStatusChange = async (status: JobStatus) => {
    const toUpdate = jobs.filter(j => selectedIds.includes(j.id));
    for (const job of toUpdate) {
      try {
        await fetch(`/api/service-jobs/${job.jobOrderNo}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        });
      } catch { /* continue */ }
    }
    await fetchJobs();
    setSelectedIds([]);
  };

  const handleCreateJob = async (data: Partial<ServiceJob>) => {
    try {
      const res = await fetch('/api/service-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `Server error ${res.status}`);
      }
      await fetchJobs();
      setCreateModalOpen(false);
    } catch (err: unknown) {
      throw err;
    }
  };

  const handleUpdateJob = async (updated: ServiceJob) => {
    try {
      const res = await fetch(`/api/service-jobs/${updated.jobOrderNo}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `Server error ${res.status}`);
      }
      await fetchJobs();
      setDetailJob(updated);
    } catch (err: unknown) {
      throw err;
    }
  };

  const handleStatusChange = async (job: ServiceJob, newStatus: JobStatus) => {
    try {
      const res = await fetch(`/api/service-jobs/${job.jobOrderNo}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `Server error ${res.status}`);
      }
      await fetchJobs();
    } catch (err: unknown) {
      alert((err as Error).message || 'Failed to update status');
    }
  };

  const activeFilterCount = Object.values(filters).filter(v => v !== '').length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Icon name="ArrowPathIcon" size={32} className="animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading service jobs...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Icon name="ExclamationCircleIcon" size={40} className="text-red-500" />
        <p className="text-base font-600 text-foreground">Failed to load service jobs</p>
        <p className="text-sm text-muted-foreground">{error}</p>
        <button onClick={fetchJobs} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-500 hover:bg-primary/90 transition-colors">
          <Icon name="ArrowPathIcon" size={15} />Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-600 text-foreground">Service Jobs</h1>
          <p className="text-xs text-muted-foreground mt-1">
            {filtered.length} job{filtered.length !== 1 ? 's' : ''} {activeFilterCount > 0 ? 'matching filters' : 'total'}
          </p>
        </div>
        <button onClick={() => setCreateModalOpen(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground text-sm font-500 px-4 py-2 rounded-lg hover:bg-primary/90 active:scale-95 transition-all duration-150 flex-shrink-0">
          <Icon name="PlusIcon" size={16} />Create Job
        </button>
      </div>

      {/* KPI summary row */}
      <JobStatusSummary jobs={jobs} />

      {/* Filter bar */}
      <JobFilterBar filters={filters} onChange={(f) => { setFilters(f); setPage(1); }} onReset={() => { setFilters(initialFilters); setPage(1); }} />

      {/* Table card */}
      <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
        <BulkActionBar selectedCount={selectedIds.length} onClear={() => setSelectedIds([])} onBulkDelete={handleBulkDelete} onBulkStatusChange={handleBulkStatusChange} />
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full min-w-[1200px]">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-3 w-10">
                  <input type="checkbox" checked={paginated.length > 0 && selectedIds.length === paginated.length} onChange={toggleSelectAll}
                    className="w-3.5 h-3.5 rounded border-input text-primary focus:ring-primary/30 cursor-pointer" aria-label="Select all" />
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
                  <th key={`th-${col.key}`} className="text-left px-3 py-3 text-2xs font-600 uppercase tracking-wider text-muted-foreground cursor-pointer hover:text-foreground select-none whitespace-nowrap" onClick={() => handleSort(col.key)}>
                    <div className="flex items-center gap-1">
                      {col.label}
                      {sortCol === col.key ? <Icon name={sortDir === 'asc' ? 'ChevronUpIcon' : 'ChevronDownIcon'} size={11} className="text-primary" /> : <Icon name="ChevronUpDownIcon" size={11} className="text-muted-foreground/40" />}
                    </div>
                  </th>
                ))}
                <th className="px-3 py-3 text-right text-2xs font-600 uppercase tracking-wider text-muted-foreground w-24">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr><td colSpan={13}>
                  <EmptyState icon="WrenchScrewdriverIcon" title="No service jobs found" description="No jobs match your current filters. Try adjusting the filters above, or create a new service job."
                    action={{ label: 'Create Service Job', onClick: () => setCreateModalOpen(true) }} />
                </td></tr>
              ) : (
                paginated.map((job, idx) => (
                  <JobTableRow key={job.id} job={job} idx={idx} selected={selectedIds.includes(job.id)} deleting={deletingIds.includes(job.id)}
                    onSelect={() => toggleSelect(job.id)} onView={() => setDetailJob(job)}
                    onEdit={() => { setEditJob(job); setCreateModalOpen(true); }}
                    onDelete={() => handleDelete(job.id)} onStatusChange={(s) => handleStatusChange(job, s)} />
                ))
              )}
            </tbody>
          </table>
        </div>
        {sorted.length > 0 && (
          <TablePagination page={page} totalPages={totalPages} pageSize={pageSize} total={sorted.length} onPageChange={setPage} onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} />
        )}
      </div>

      <CreateJobModal open={createModalOpen} editJob={editJob} onClose={() => { setCreateModalOpen(false); setEditJob(null); }} onCreate={handleCreateJob} onUpdate={handleUpdateJob} />
      <JobDetailDrawer job={detailJob} onClose={() => setDetailJob(null)} onEdit={(job) => { setEditJob(job); setDetailJob(null); setCreateModalOpen(true); }} onStatusChange={handleStatusChange} onUpdateJob={handleUpdateJob} />
    </div>
  );
}

function JobStatusSummary({ jobs }: { jobs: ServiceJob[] }) {
  const counts = {
    open: jobs.filter(j => j.status === 'Open').length,
    inProgress: jobs.filter(j => j.status === 'In Progress').length,
    completed: jobs.filter(j => j.status === 'Completed').length,
    closed: jobs.filter(j => j.status === 'Closed').length,
    cancelled: jobs.filter(j => j.status === 'Cancelled').length,
  };
  return (
    <div className="flex items-center gap-3 flex-wrap">
      {[
        { id: 'sum-open', label: 'Open', count: counts.open, color: 'text-blue-600', bg: 'bg-blue-50' },
        { id: 'sum-inprog', label: 'In Progress', count: counts.inProgress, color: 'text-amber-600', bg: 'bg-amber-50' },
        { id: 'sum-completed', label: 'Completed', count: counts.completed, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { id: 'sum-closed', label: 'Closed', count: counts.closed, color: 'text-slate-600', bg: 'bg-slate-50' },
        { id: 'sum-cancelled', label: 'Cancelled', count: counts.cancelled, color: 'text-red-600', bg: 'bg-red-50' },
      ].map(item => (
        <div key={item.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border ${item.bg}`}>
          <span className={`text-xl font-700 tabular-nums ${item.color}`}>{item.count}</span>
          <span className="text-xs text-muted-foreground font-500">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

interface JobTableRowProps {
  job: ServiceJob; idx: number; selected: boolean; deleting: boolean;
  onSelect: () => void; onView: () => void; onEdit: () => void; onDelete: () => void; onStatusChange: (s: JobStatus) => void;
}

function JobTableRow({ job, idx, selected, deleting, onSelect, onView, onEdit, onDelete, onStatusChange }: JobTableRowProps) {
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const statusOptions: JobStatus[] = ['Open', 'In Progress', 'Completed', 'Closed', 'Cancelled'];
  return (
    <tr className={`border-b border-border last:border-0 transition-all duration-200 group ${deleting ? 'opacity-40' : ''} ${selected ? 'bg-primary/5' : idx % 2 === 0 ? '' : 'bg-muted/10'} hover:bg-muted/40`}>
      <td className="px-4 py-2.5">
        <input type="checkbox" checked={selected} onChange={onSelect} className="w-3.5 h-3.5 rounded border-input text-primary focus:ring-primary/30 cursor-pointer" aria-label={`Select ${job.jobOrderNo}`} />
      </td>
      <td className="px-3 py-2.5">
        <button onClick={onView} className="text-xs font-600 text-primary hover:underline tabular-nums whitespace-nowrap">{job.jobOrderNo}</button>
        {job.serviceReportNo && <p className="text-2xs text-muted-foreground tabular-nums">{job.serviceReportNo}</p>}
      </td>
      <td className="px-3 py-2.5"><span className="text-xs text-foreground whitespace-nowrap">{job.requestDate}</span></td>
      <td className="px-3 py-2.5"><span className="text-xs font-500 text-foreground truncate max-w-[120px] block">{job.clientName}</span></td>
      <td className="px-3 py-2.5"><span className="text-xs text-foreground truncate max-w-[120px] block">{job.siteName}</span></td>
      <td className="px-3 py-2.5"><span className="text-xs text-foreground truncate max-w-[130px] block">{job.generatorName}</span></td>
      <td className="px-3 py-2.5"><span className="text-xs text-foreground whitespace-nowrap">{job.serviceType}</span></td>
      <td className="px-3 py-2.5"><StatusBadge status={job.priority} size="sm" /></td>
      <td className="px-3 py-2.5 relative">
        <div className="relative inline-block">
          <button onClick={() => setStatusMenuOpen(!statusMenuOpen)} className="flex items-center gap-1 hover:opacity-80 transition-opacity" title="Click to change status">
            <StatusBadge status={job.status} size="sm" dot />
            <Icon name="ChevronDownIcon" size={10} className="text-muted-foreground" />
          </button>
          {statusMenuOpen && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setStatusMenuOpen(false)} />
              <div className="absolute left-0 top-full mt-1 w-36 bg-card border border-border rounded-lg shadow-dropdown z-30 py-1 scale-in">
                {statusOptions.map(s => (
                  <button key={`status-opt-${s}`} onClick={() => { onStatusChange(s); setStatusMenuOpen(false); }}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-muted transition-colors text-left ${job.status === s ? 'font-600 text-primary' : 'text-foreground'}`}>
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
        {job.additionalTechnicianName && <p className="text-2xs text-muted-foreground">+{job.additionalTechnicianName}</p>}
      </td>
      <td className="px-3 py-2.5"><span className="text-xs text-foreground whitespace-nowrap">{job.scheduledDate}</span></td>
      <td className="px-3 py-2.5"><StatusBadge status={job.billingStatus} size="sm" /></td>
      <td className="px-3 py-2.5">
        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onView} title="View" className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"><Icon name="EyeIcon" size={14} /></button>
          <button onClick={onEdit} title="Edit" className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"><Icon name="PencilSquareIcon" size={14} /></button>
          <button onClick={onDelete} title="Delete" className="p-1.5 rounded-md hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors"><Icon name="TrashIcon" size={14} /></button>
        </div>
      </td>
    </tr>
  );
}

function TablePagination({ page, totalPages, pageSize, total, onPageChange, onPageSizeChange }: {
  page: number; totalPages: number; pageSize: number; total: number; onPageChange: (p: number) => void; onPageSizeChange: (s: number) => void;
}) {
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  const pageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    if (totalPages <= 7) { for (let i = 1; i <= totalPages; i++) pages.push(i); }
    else {
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
        <span className="text-xs text-muted-foreground tabular-nums">Showing {start}–{end} of {total} jobs</span>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Per page:</span>
          <select value={pageSize} onChange={(e) => onPageSizeChange(Number(e.target.value))} className="text-xs border border-input rounded-md px-2 py-1 bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30">
            {[10, 20, 50].map(s => <option key={`ps-${s}`} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button onClick={() => onPageChange(page - 1)} disabled={page === 1} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors" aria-label="Previous page">
          <Icon name="ChevronLeftIcon" size={14} />
        </button>
        {pageNumbers().map((p, i) =>
          p === 'ellipsis' ? <span key={`ellipsis-${i}`} className="px-2 text-xs text-muted-foreground">…</span> : (
            <button key={`page-${p}`} onClick={() => onPageChange(p)}
              className={`min-w-[28px] h-7 px-2 rounded-md text-xs font-500 transition-colors ${page === p ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-foreground'}`}>{p}</button>
          )
        )}
        <button onClick={() => onPageChange(page + 1)} disabled={page === totalPages} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors" aria-label="Next page">
          <Icon name="ChevronRightIcon" size={14} />
        </button>
      </div>
    </div>
  );
}