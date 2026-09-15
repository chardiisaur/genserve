'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/AppLayout';
import Icon from '@/components/ui/AppIcon';
import EmptyState from '@/components/ui/EmptyState';
import Modal from '@/components/ui/Modal';

interface PartUsedRecord {
  usageId: string;
  jobOrderNo: string;
  generatorId: string;
  partId: string;
  partNo: string;
  partDescription: string;
  qty: number;
  unitCost: number;
  sellingPrice: number;
  totalCost: number;
  totalSelling: number;
  dateUsed: string;
  technicianId: string | null;
  remarks: string;
  clientName: string;
  siteName: string;
  generatorLabel: string;
  technicianName: string;
  partUnit: string;
}

interface ServiceJobOption { jobOrderNo: string; clientName?: string; siteName?: string; }
interface GeneratorOption { generatorId: string; assetNo: string; brand: string; model: string; }
interface PartOption { partId: string; partNo: string; partDescription: string; unit: string; unitCost: number; sellingPrice: number; stockQty: number; }
interface TechnicianOption { technicianId: string; technicianName: string; }

const emptyForm = {
  jobOrderNo: '',
  generatorId: '',
  partId: '',
  qty: 1,
  unitCost: 0,
  sellingPrice: 0,
  dateUsed: new Date().toISOString().slice(0, 10),
  technicianId: '',
  remarks: '',
};

type FormState = typeof emptyForm;

export default function PartsUsedPage() {
  const [records, setRecords] = useState<PartUsedRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [filterJob, setFilterJob] = useState('');
  const [search, setSearch] = useState('');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<PartUsedRecord | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<PartUsedRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Reference data
  const [jobs, setJobs] = useState<ServiceJobOption[]>([]);
  const [generators, setGenerators] = useState<GeneratorOption[]>([]);
  const [parts, setParts] = useState<PartOption[]>([]);
  const [technicians, setTechnicians] = useState<TechnicianOption[]>([]);
  const [refLoading, setRefLoading] = useState(false);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let res = await fetch('/api/parts-used');
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Server error ${res.status}`);
      }
      const data = await res.json();
      setRecords(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to load parts used records');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const fetchRefData = useCallback(async () => {
    setRefLoading(true);
    try {
      const [jobsRes, gensRes, partsRes, techsRes] = await Promise.all([
        fetch('/api/service-jobs').then(r => r.ok ? r.json() : []),
        fetch('/api/generators').then(r => r.ok ? r.json() : []),
        fetch('/api/parts').then(r => r.ok ? r.json() : []),
        fetch('/api/technicians').then(r => r.ok ? r.json() : []),
      ]);
      setJobs(Array.isArray(jobsRes) ? jobsRes : []);
      setGenerators(Array.isArray(gensRes) ? gensRes : []);
      setParts(Array.isArray(partsRes) ? partsRes : []);
      setTechnicians(Array.isArray(techsRes) ? techsRes : []);
    } catch (err) {
      console.error('[PartsUsed] Failed to load reference data', err);
    } finally {
      setRefLoading(false);
    }
  }, []);

  const openCreate = () => {
    setEditRecord(null);
    setForm({ ...emptyForm, dateUsed: new Date().toISOString().slice(0, 10) });
    setSaveError(null);
    fetchRefData();
    setModalOpen(true);
  };

  const openEdit = (rec: PartUsedRecord) => {
    setEditRecord(rec);
    setForm({
      jobOrderNo: rec.jobOrderNo,
      generatorId: rec.generatorId,
      partId: rec.partId,
      qty: rec.qty,
      unitCost: rec.unitCost,
      sellingPrice: rec.sellingPrice,
      dateUsed: rec.dateUsed,
      technicianId: rec.technicianId ?? '',
      remarks: rec.remarks,
    });
    setSaveError(null);
    fetchRefData();
    setModalOpen(true);
  };

  const handlePartChange = (partId: string) => {
    const part = parts.find(p => p.partId === partId);
    setForm(f => ({
      ...f,
      partId,
      unitCost: part ? part.unitCost : f.unitCost,
      sellingPrice: part ? part.sellingPrice : f.sellingPrice,
    }));
  };

  const handleSave = async () => {
    if (!form.jobOrderNo.trim()) { setSaveError('Service Job is required.'); return; }
    if (!form.generatorId.trim()) { setSaveError('Generator is required.'); return; }
    if (!form.partId.trim()) { setSaveError('Part is required.'); return; }
    if (!form.dateUsed.trim()) { setSaveError('Date used is required.'); return; }
    if (form.qty < 1) { setSaveError('Quantity must be at least 1.'); return; }

    setSaving(true);
    setSaveError(null);
    try {
      const payload = {
        jobOrderNo: form.jobOrderNo,
        generatorId: form.generatorId,
        partId: form.partId,
        qty: Number(form.qty),
        unitCost: Number(form.unitCost),
        sellingPrice: Number(form.sellingPrice),
        dateUsed: form.dateUsed,
        technicianId: form.technicianId || null,
        remarks: form.remarks.trim(),
      };

      let res: Response;
      if (editRecord) {
        res = await fetch(`/api/parts-used/${editRecord.usageId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/parts-used', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Server error ${res.status}`);
      }
      await fetchRecords();
      setModalOpen(false);
    } catch (err: unknown) {
      setSaveError((err as Error).message || 'Failed to save record');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      let res = await fetch(`/api/parts-used/${deleteConfirm.usageId}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Server error ${res.status}`);
      }
      await fetchRecords();
      setDeleteConfirm(null);
    } catch (err: unknown) {
      alert((err as Error).message || 'Failed to delete record');
    } finally {
      setDeleting(false);
    }
  };

  const filtered = useMemo(() => {
    return records.filter(r => {
      if (filterJob && r.jobOrderNo !== filterJob) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !r.jobOrderNo.toLowerCase().includes(q) &&
          !r.partDescription.toLowerCase().includes(q) &&
          !r.partNo.toLowerCase().includes(q) &&
          !r.clientName.toLowerCase().includes(q) &&
          !r.technicianName.toLowerCase().includes(q)
        ) return false;
      }
      return true;
    });
  }, [records, filterJob, search]);

  const uniqueJobs = useMemo(() => [...new Set(records.map(r => r.jobOrderNo))].sort(), [records]);

  const selectedPart = parts.find(p => p.partId === form.partId);

  const modalFooter = (
    <div className="flex items-center justify-end gap-2">
      <button
        onClick={() => setModalOpen(false)}
        disabled={saving}
        className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors disabled:opacity-50"
      >
        Cancel
      </button>
      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 px-4 py-2 text-sm bg-primary text-primary-foreground font-500 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-60"
      >
        {saving && <Icon name="ArrowPathIcon" size={13} className="animate-spin" />}
        {editRecord ? 'Update Record' : 'Record Parts Used'}
      </button>
    </div>
  );

  return (
    <AppLayout currentPath="/parts-used">
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link
                href="/parts-inventory"
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Icon name="ArrowLeftIcon" size={13} />
                Back to Parts Inventory
              </Link>
            </div>
            <h1 className="text-2xl font-600 text-foreground">Parts Used</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Track parts consumed in service jobs. Recording parts used automatically deducts from inventory.
            </p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-primary text-primary-foreground font-500 rounded-lg hover:bg-primary/90 transition-colors flex-shrink-0"
          >
            <Icon name="PlusIcon" size={15} />
            Record Parts Used
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Icon name="MagnifyingGlassIcon" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search parts, jobs, clients…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <select
            value={filterJob}
            onChange={e => setFilterJob(e.target.value)}
            className="px-3 py-2 text-xs bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">All Jobs</option>
            {uniqueJobs.map(j => (
              <option key={j} value={j}>{j}</option>
            ))}
          </select>
          {(filterJob || search) && (
            <button
              onClick={() => { setFilterJob(''); setSearch(''); }}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <Icon name="XMarkIcon" size={13} />
              Clear
            </button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <Icon name="ExclamationCircleIcon" size={18} className="text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-700 flex-1">{error}</p>
            <button onClick={fetchRecords} className="text-xs text-red-600 hover:text-red-800 font-500">Retry</button>
          </div>
        )}

        {/* Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-8 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-10 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon="WrenchIcon"
              title="No parts used records"
              description={search || filterJob ? 'No records match your filters.' : 'Record parts used in service jobs to track inventory consumption.'}
              action={!search && !filterJob ? { label: 'Record Parts Used', onClick: openCreate } : undefined}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="text-left px-4 py-3 font-600 text-muted-foreground">Date Used</th>
                    <th className="text-left px-4 py-3 font-600 text-muted-foreground">Job Order</th>
                    <th className="text-left px-4 py-3 font-600 text-muted-foreground">Client / Site</th>
                    <th className="text-left px-4 py-3 font-600 text-muted-foreground">Part</th>
                    <th className="text-right px-4 py-3 font-600 text-muted-foreground">Qty</th>
                    <th className="text-right px-4 py-3 font-600 text-muted-foreground">Unit Cost</th>
                    <th className="text-right px-4 py-3 font-600 text-muted-foreground">Total Cost</th>
                    <th className="text-left px-4 py-3 font-600 text-muted-foreground">Technician</th>
                    <th className="text-left px-4 py-3 font-600 text-muted-foreground">Remarks</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((rec) => (
                    <tr key={rec.usageId} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{rec.dateUsed}</td>
                      <td className="px-4 py-3 font-500 text-primary whitespace-nowrap">{rec.jobOrderNo}</td>
                      <td className="px-4 py-3">
                        <div className="font-500 text-foreground truncate max-w-[140px]">{rec.clientName || '—'}</div>
                        <div className="text-muted-foreground truncate max-w-[140px]">{rec.siteName || '—'}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-500 text-foreground truncate max-w-[160px]">{rec.partDescription}</div>
                        <div className="text-muted-foreground">{rec.partNo} {rec.partUnit ? `· ${rec.partUnit}` : ''}</div>
                      </td>
                      <td className="px-4 py-3 text-right font-600 tabular-nums">{rec.qty}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                        {rec.unitCost.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-500">
                        {rec.totalCost.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground truncate max-w-[120px]">{rec.technicianName || '—'}</td>
                      <td className="px-4 py-3 text-muted-foreground truncate max-w-[120px]">{rec.remarks || '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <button
                            onClick={() => openEdit(rec)}
                            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            title="Edit"
                          >
                            <Icon name="PencilSquareIcon" size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(rec)}
                            className="p-1.5 rounded-md hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors"
                            title="Delete"
                          >
                            <Icon name="TrashIcon" size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Summary */}
        {filtered.length > 0 && (
          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
            <span>{filtered.length} record{filtered.length !== 1 ? 's' : ''}</span>
            <span>
              Total Cost:{' '}
              <span className="font-600 text-foreground">
                ₱{filtered.reduce((s, r) => s + r.totalCost, 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              </span>
            </span>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editRecord ? `Edit Parts Used — ${editRecord.usageId}` : 'Record Parts Used'}
        subtitle={editRecord ? 'Update quantity or details. Stock will be adjusted accordingly.' : 'Select the service job, part, and quantity used. Inventory will be deducted automatically.'}
        size="lg"
        footer={modalFooter}
      >
        <div className="space-y-4">
          {saveError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
              <Icon name="ExclamationCircleIcon" size={15} className="text-red-600 flex-shrink-0" />
              <p className="text-xs text-red-700">{saveError}</p>
            </div>
          )}

          {refLoading && (
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <Icon name="ArrowPathIcon" size={13} className="animate-spin" />
              Loading reference data…
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Service Job */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-500 text-foreground mb-1.5">
                Service Job <span className="text-red-500">*</span>
              </label>
              <select
                value={form.jobOrderNo}
                onChange={e => setForm(f => ({ ...f, jobOrderNo: e.target.value }))}
                disabled={!!editRecord}
                className="w-full px-3 py-2 text-xs bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60"
              >
                <option value="">Select service job…</option>
                {jobs.map(j => (
                  <option key={j.jobOrderNo} value={j.jobOrderNo}>
                    {j.jobOrderNo}{j.clientName ? ` — ${j.clientName}` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Generator */}
            <div>
              <label className="block text-xs font-500 text-foreground mb-1.5">
                Generator <span className="text-red-500">*</span>
              </label>
              <select
                value={form.generatorId}
                onChange={e => setForm(f => ({ ...f, generatorId: e.target.value }))}
                disabled={!!editRecord}
                className="w-full px-3 py-2 text-xs bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60"
              >
                <option value="">Select generator…</option>
                {generators.map(g => (
                  <option key={g.generatorId} value={g.generatorId}>
                    {g.assetNo} — {g.brand} {g.model}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Used */}
            <div>
              <label className="block text-xs font-500 text-foreground mb-1.5">
                Date Used <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={form.dateUsed}
                onChange={e => setForm(f => ({ ...f, dateUsed: e.target.value }))}
                className="w-full px-3 py-2 text-xs bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            {/* Part */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-500 text-foreground mb-1.5">
                Part <span className="text-red-500">*</span>
              </label>
              <select
                value={form.partId}
                onChange={e => handlePartChange(e.target.value)}
                disabled={!!editRecord}
                className="w-full px-3 py-2 text-xs bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60"
              >
                <option value="">Select part…</option>
                {parts.map(p => (
                  <option key={p.partId} value={p.partId}>
                    {p.partNo} — {p.partDescription} (Stock: {p.stockQty} {p.unit})
                  </option>
                ))}
              </select>
              {selectedPart && (
                <p className="text-2xs text-muted-foreground mt-1">
                  Available stock: <span className="font-600 text-foreground">{selectedPart.stockQty} {selectedPart.unit}</span>
                </p>
              )}
            </div>

            {/* Qty */}
            <div>
              <label className="block text-xs font-500 text-foreground mb-1.5">
                Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                value={form.qty}
                onChange={e => setForm(f => ({ ...f, qty: Number(e.target.value) }))}
                className="w-full px-3 py-2 text-xs bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            {/* Unit Cost */}
            <div>
              <label className="block text-xs font-500 text-foreground mb-1.5">Unit Cost</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.unitCost}
                onChange={e => setForm(f => ({ ...f, unitCost: Number(e.target.value) }))}
                className="w-full px-3 py-2 text-xs bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            {/* Selling Price */}
            <div>
              <label className="block text-xs font-500 text-foreground mb-1.5">Selling Price</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.sellingPrice}
                onChange={e => setForm(f => ({ ...f, sellingPrice: Number(e.target.value) }))}
                className="w-full px-3 py-2 text-xs bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            {/* Technician */}
            <div>
              <label className="block text-xs font-500 text-foreground mb-1.5">Technician</label>
              <select
                value={form.technicianId}
                onChange={e => setForm(f => ({ ...f, technicianId: e.target.value }))}
                className="w-full px-3 py-2 text-xs bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">None</option>
                {technicians.map(t => (
                  <option key={t.technicianId} value={t.technicianId}>{t.technicianName}</option>
                ))}
              </select>
            </div>

            {/* Remarks */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-500 text-foreground mb-1.5">Remarks</label>
              <textarea
                value={form.remarks}
                onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 text-xs bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                placeholder="Optional notes…"
              />
            </div>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-sm mx-4 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
                <Icon name="TrashIcon" size={18} className="text-red-400" />
              </div>
              <div>
                <h3 className="text-sm font-600 text-foreground">Delete Parts Used Record</h3>
                <p className="text-xs text-muted-foreground">Stock will be restored upon deletion.</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Delete record for{' '}
              <span className="font-500 text-foreground">{deleteConfirm.partDescription}</span>{' '}
              (Qty: {deleteConfirm.qty}) from job{' '}
              <span className="font-500 text-foreground">{deleteConfirm.jobOrderNo}</span>?
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-red-500 text-white font-500 rounded-md hover:bg-red-600 transition-colors disabled:opacity-60"
              >
                {deleting && <Icon name="ArrowPathIcon" size={13} className="animate-spin" />}
                Delete & Restore Stock
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
