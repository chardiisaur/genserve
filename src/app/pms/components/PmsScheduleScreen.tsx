'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Icon from '@/components/ui/AppIcon';
import EmptyState from '@/components/ui/EmptyState';
import Modal from '@/components/ui/Modal';

export type PmsStatus = 'Scheduled' | 'In Progress' | 'Completed' | 'Overdue' | 'Cancelled';
export type PmsType = '250-Hour' | '500-Hour' | '1000-Hour' | '2000-Hour' | 'Annual' | 'Semi-Annual' | 'Monthly' | 'Ad-Hoc';

type ChecklistItem = 'engineOil' | 'oilFilter' | 'fuelFilter' | 'waterSeparator' | 'airFilter' | 'coolant' | 'belts' | 'hoses' | 'battery' | 'batteryCharger' | 'radiatorCooling' | 'fuelSystem' | 'exhaust' | 'turbocharger' | 'alternator' | 'avr' | 'controller' | 'breakerAts' | 'emergencyStop' | 'loadTest';
type ChecklistState = Record<ChecklistItem, 'OK' | 'Needs Attention' | 'Replaced' | 'N/A' | ''>;

const CHECKLIST_LABELS: Record<ChecklistItem, string> = {
  engineOil: 'Engine Oil', oilFilter: 'Oil Filter', fuelFilter: 'Fuel Filter', waterSeparator: 'Water Separator',
  airFilter: 'Air Filter', coolant: 'Coolant', belts: 'Belts', hoses: 'Hoses', battery: 'Battery',
  batteryCharger: 'Battery Charger', radiatorCooling: 'Radiator / Cooling', fuelSystem: 'Fuel System',
  exhaust: 'Exhaust', turbocharger: 'Turbocharger', alternator: 'Alternator', avr: 'AVR',
  controller: 'Controller', breakerAts: 'Breaker / ATS', emergencyStop: 'Emergency Stop / Safety', loadTest: 'Load Test',
};

const CHECKLIST_KEYS = Object.keys(CHECKLIST_LABELS) as ChecklistItem[];
const emptyChecklist: ChecklistState = CHECKLIST_KEYS.reduce((acc, k) => ({ ...acc, [k]: '' }), {} as ChecklistState);

export interface PmsRecord {
  id: string;
  pmsRecordId: string;
  generatorId: string;
  clientId: string;
  siteId: string;
  pmsType: string;
  pmsDate: string;
  runningHours: number;
  nextPmsDate: string;
  nextPmsHours: number;
  technicianId: string;
  pmsScope: string;
  pmsStatus: PmsStatus;
  engineOil: string;
  oilFilter: string;
  fuelFilter: string;
  waterSeparator: string;
  airFilter: string;
  coolant: string;
  belts: string;
  hoses: string;
  battery: string;
  batteryCharger: string;
  radiatorCooling: string;
  fuelSystem: string;
  exhaust: string;
  turbocharger: string;
  alternator: string;
  avr: string;
  controller: string;
  breakerAts: string;
  emergencyStop: string;
  loadTest: string;
  generalCondition: string;
  recommendations: string;
  remarks: string;
}

interface FormState {
  generatorId: string;
  clientId: string;
  siteId: string;
  pmsType: PmsType;
  pmsDate: string;
  runningHours: number;
  nextPmsDate: string;
  nextPmsHours: number;
  technicianId: string;
  pmsScope: string;
  pmsStatus: PmsStatus;
  checklist: ChecklistState;
  generalCondition: string;
  recommendations: string;
  remarks: string;
}

const emptyForm: FormState = {
  generatorId: '', clientId: '', siteId: '',
  pmsType: '250-Hour', pmsDate: '', runningHours: 0, nextPmsDate: '', nextPmsHours: 0,
  technicianId: '', pmsScope: '', pmsStatus: 'Scheduled',
  checklist: { ...emptyChecklist }, generalCondition: '', recommendations: '', remarks: '',
};

const statusColors: Record<PmsStatus, string> = {
  'Scheduled': 'text-blue-600 bg-blue-50 border-blue-200',
  'In Progress': 'text-amber-600 bg-amber-50 border-amber-200',
  'Completed': 'text-emerald-600 bg-emerald-50 border-emerald-200',
  'Overdue': 'text-red-600 bg-red-50 border-red-200',
  'Cancelled': 'text-muted-foreground bg-muted border-border',
};

const checklistColors: Record<string, string> = {
  'OK': 'text-emerald-600 bg-emerald-50',
  'Replaced': 'text-blue-600 bg-blue-50',
  'Needs Attention': 'text-orange-600 bg-orange-50',
  'N/A': 'text-muted-foreground bg-muted',
  '': 'text-muted-foreground bg-muted/40',
};

// ── Toast notification ──────────────────────────────────────────────────────
interface Toast { id: number; type: 'success' | 'error'; message: string }

function ToastList({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: number) => void }) {
  return (
    <div className="fixed bottom-5 right-5 z-[200] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-500 min-w-[280px] max-w-[380px] fade-in ${t.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
          <Icon name={t.type === 'success' ? 'CheckCircleIcon' : 'ExclamationCircleIcon'} size={16} className={t.type === 'success' ? 'text-emerald-500 flex-shrink-0' : 'text-red-500 flex-shrink-0'} />
          <span className="flex-1">{t.message}</span>
          <button onClick={() => onRemove(t.id)} className="text-current opacity-50 hover:opacity-100 transition-opacity"><Icon name="XMarkIcon" size={14} /></button>
        </div>
      ))}
    </div>
  );
}

// ── Delete confirmation dialog ──────────────────────────────────────────────
interface DeleteDialogProps {
  open: boolean;
  record: PmsRecord | null;
  deleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function DeleteConfirmDialog({ open, record, deleting, onConfirm, onCancel }: DeleteDialogProps) {
  if (!open || !record) return null;
  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center">
      <div className="absolute inset-0 bg-foreground/40" onClick={!deleting ? onCancel : undefined} />
      <div className="relative bg-card border border-border rounded-2xl shadow-modal w-full max-w-md mx-4 p-6 fade-in">
        <div className="flex items-start gap-4 mb-5">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <Icon name="TrashIcon" size={20} className="text-red-600" />
          </div>
          <div>
            <h3 className="text-base font-700 text-foreground mb-1">Delete PMS Record</h3>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to permanently delete <span className="font-600 text-foreground">{record.pmsRecordId}</span>?
            </p>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-5">
          <p className="text-xs text-amber-800 font-500 flex items-start gap-2">
            <Icon name="ExclamationTriangleIcon" size={14} className="flex-shrink-0 mt-0.5" />
            This will only delete this PMS record. The associated Generator, Client, Site, and Technician records will NOT be affected.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="flex items-center gap-2 bg-red-600 text-white text-sm font-500 px-5 py-2 rounded-lg hover:bg-red-700 active:scale-95 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {deleting ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Deleting…
              </>
            ) : (
              <>
                <Icon name="TrashIcon" size={14} />
                Delete PMS Record
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function recordToChecklist(r: PmsRecord): ChecklistState {
  return CHECKLIST_KEYS.reduce((acc, k) => ({ ...acc, [k]: (r as Record<string, unknown>)[k] as string || '' }), {} as ChecklistState);
}

function formToApiBody(form: FormState) {
  const flat: Record<string, unknown> = {
    generatorId: form.generatorId,
    clientId: form.clientId,
    siteId: form.siteId,
    pmsType: form.pmsType,
    pmsDate: form.pmsDate,
    runningHours: form.runningHours,
    nextPmsDate: form.nextPmsDate,
    nextPmsHours: form.nextPmsHours,
    technicianId: form.technicianId,
    pmsScope: form.pmsScope,
    pmsStatus: form.pmsStatus,
    generalCondition: form.generalCondition,
    recommendations: form.recommendations,
    remarks: form.remarks,
  };
  CHECKLIST_KEYS.forEach(k => { flat[k] = form.checklist[k] || 'OK'; });
  return flat;
}

// ── Main Screen ──────────────────────────────────────────────────────────────
export default function PmsScheduleScreen() {
  const [records, setRecords] = useState<PmsRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<PmsRecord | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  // Detail drawer
  const [detailRecord, setDetailRecord] = useState<PmsRecord | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'checklist'>('info');

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<PmsRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState<Toast[]>([]);
  const addToast = useCallback((type: 'success' | 'error', message: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4500);
  }, []);
  const removeToast = useCallback((id: number) => setToasts(prev => prev.filter(t => t.id !== id)), []);

  // ── Fetch records ──────────────────────────────────────────────────────────
  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      let res = await fetch('/api/pms');
      if (!res.ok) throw new Error('Failed to load');
      const data: PmsRecord[] = await res.json();
      setRecords(data);
    } catch {
      addToast('error', 'Failed to load PMS records. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  // ── Filtered list ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return records.filter(r => {
      if (search) {
        const q = search.toLowerCase();
        if (
          !r.pmsRecordId.toLowerCase().includes(q) &&
          !r.generatorId.toLowerCase().includes(q) &&
          !r.clientId.toLowerCase().includes(q) &&
          !r.siteId.toLowerCase().includes(q) &&
          !r.technicianId.toLowerCase().includes(q)
        ) return false;
      }
      if (filterStatus && r.pmsStatus !== filterStatus) return false;
      if (filterType && r.pmsType !== filterType) return false;
      return true;
    });
  }, [records, search, filterStatus, filterType]);

  const kpiScheduled = records.filter(r => r.pmsStatus === 'Scheduled').length;
  const kpiInProgress = records.filter(r => r.pmsStatus === 'In Progress').length;
  const kpiCompleted = records.filter(r => r.pmsStatus === 'Completed').length;
  const kpiOverdue = records.filter(r => r.pmsStatus === 'Overdue').length;

  // ── Create / Edit ──────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditRecord(null);
    setForm({ ...emptyForm, checklist: { ...emptyChecklist } });
    setModalOpen(true);
  };

  const openEdit = (r: PmsRecord) => {
    setEditRecord(r);
    setForm({
      generatorId: r.generatorId, clientId: r.clientId, siteId: r.siteId,
      pmsType: r.pmsType as PmsType, pmsDate: r.pmsDate, runningHours: r.runningHours,
      nextPmsDate: r.nextPmsDate, nextPmsHours: r.nextPmsHours, technicianId: r.technicianId,
      pmsScope: r.pmsScope, pmsStatus: r.pmsStatus,
      checklist: recordToChecklist(r),
      generalCondition: r.generalCondition, recommendations: r.recommendations, remarks: r.remarks,
    });
    setModalOpen(true);
    setDetailRecord(null);
  };

  const handleSave = async () => {
    if (!form.generatorId || !form.clientId || !form.siteId || !form.pmsDate) {
      addToast('error', 'Generator ID, Client ID, Site ID, and PMS Date are required.');
      return;
    }
    setSaving(true);
    try {
      const body = formToApiBody(form);
      let res: Response;
      if (editRecord) {
        res = await fetch(`/api/pms/${editRecord.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      } else {
        res = await fetch('/api/pms', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Save failed');
      }
      await fetchRecords();
      setModalOpen(false);
      addToast('success', editRecord ? 'PMS record updated successfully.' : 'PMS record created successfully.');
    } catch (err: unknown) {
      addToast('error', err instanceof Error ? err.message : 'Failed to save PMS record.');
    } finally {
      setSaving(false);
    }
  };

  // ── Status change ──────────────────────────────────────────────────────────
  const handleStatusChange = async (record: PmsRecord, status: PmsStatus) => {
    try {
      let res = await fetch(`/api/pms/${record.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pmsStatus: status }),
      });
      if (!res.ok) throw new Error('Status update failed');
      setRecords(prev => prev.map(r => r.id === record.id ? { ...r, pmsStatus: status } : r));
      if (detailRecord?.id === record.id) setDetailRecord(prev => prev ? { ...prev, pmsStatus: status } : prev);
    } catch {
      addToast('error', 'Failed to update status. Please try again.');
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const openDeleteDialog = (r: PmsRecord, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setDeleteTarget(r);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      let res = await fetch(`/api/pms/${deleteTarget.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Delete failed');
      }
      // Remove from local state immediately for instant feedback
      setRecords(prev => prev.filter(r => r.id !== deleteTarget.id));
      if (detailRecord?.id === deleteTarget.id) setDetailRecord(null);
      setDeleteTarget(null);
      addToast('success', `PMS record ${deleteTarget.pmsRecordId} deleted successfully.`);
    } catch (err: unknown) {
      addToast('error', err instanceof Error ? err.message : 'Failed to delete PMS record.');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    if (!deleting) setDeleteTarget(null);
  };

  // ── Modal footer ───────────────────────────────────────────────────────────
  const modalFooter = (
    <div className="flex items-center justify-end gap-3 w-full">
      <button type="button" onClick={() => setModalOpen(false)} disabled={saving} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50">Cancel</button>
      <button type="button" onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-primary text-primary-foreground text-sm font-500 px-5 py-2 rounded-lg hover:bg-primary/90 active:scale-95 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed">
        {saving ? (
          <>
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {editRecord ? 'Updating…' : 'Creating…'}
          </>
        ) : (
          <>
            <Icon name="CheckIcon" size={15} />
            {editRecord ? 'Update PMS' : 'Create PMS'}
          </>
        )}
      </button>
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      <ToastList toasts={toasts} onRemove={removeToast} />

      <DeleteConfirmDialog
        open={!!deleteTarget}
        record={deleteTarget}
        deleting={deleting}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-600 text-foreground">PMS Schedule</h1>
          <p className="text-xs text-muted-foreground mt-1">{records.length} PMS records</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-primary text-primary-foreground text-sm font-500 px-4 py-2 rounded-lg hover:bg-primary/90 active:scale-95 transition-all duration-150 flex-shrink-0">
          <Icon name="PlusIcon" size={16} />
          New PMS
        </button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Scheduled', value: kpiScheduled, color: 'text-blue-600', bg: 'bg-blue-50', icon: 'CalendarDaysIcon' },
          { label: 'In Progress', value: kpiInProgress, color: 'text-amber-600', bg: 'bg-amber-50', icon: 'ArrowPathIcon' },
          { label: 'Completed', value: kpiCompleted, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: 'CheckCircleIcon' },
          { label: 'Overdue', value: kpiOverdue, color: 'text-red-600', bg: 'bg-red-50', icon: 'ExclamationCircleIcon' },
        ].map(k => (
          <div key={k.label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg ${k.bg} flex items-center justify-center flex-shrink-0`}>
              <Icon name={k.icon as Parameters<typeof Icon>[0]['name']} size={18} className={k.color} />
            </div>
            <div>
              <p className={`text-xl font-700 ${k.color}`}>{k.value}</p>
              <p className="text-2xs text-muted-foreground">{k.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-xl px-4 py-3 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Icon name="MagnifyingGlassIcon" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" placeholder="Search PMS ID, generator, client, technician..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 text-sm bg-muted/40 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="text-sm bg-muted/40 border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground">
          <option value="">All Statuses</option>
          {(['Scheduled', 'In Progress', 'Completed', 'Overdue', 'Cancelled'] as PmsStatus[]).map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="text-sm bg-muted/40 border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground">
          <option value="">All PMS Types</option>
          {(['250-Hour', '500-Hour', '1000-Hour', '2000-Hour', 'Annual', 'Semi-Annual', 'Monthly', 'Ad-Hoc'] as PmsType[]).map(t => <option key={t}>{t}</option>)}
        </select>
        {(search || filterStatus || filterType) && (
          <button onClick={() => { setSearch(''); setFilterStatus(''); setFilterType(''); }} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-muted transition-colors">
            <Icon name="XMarkIcon" size={13} /> Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 gap-3 text-muted-foreground">
            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-sm">Loading PMS records…</span>
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {['PMS Record ID', 'Generator ID', 'Client / Site', 'PMS Type', 'PMS Date', 'Running Hrs', 'Next PMS Date', 'Status'].map(h => (
                    <th key={h} className="text-left px-3 py-3 text-2xs font-600 uppercase tracking-wider text-muted-foreground whitespace-nowrap">{h}</th>
                  ))}
                  <th className="px-3 py-3 text-right text-2xs font-600 uppercase tracking-wider text-muted-foreground w-20">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={9}><EmptyState icon="CalendarDaysIcon" title="No PMS records found" description="Try adjusting your search or filters, or create a new PMS record." /></td></tr>
                ) : filtered.map(r => (
                  <tr key={r.id} onClick={() => { setDetailRecord(r); setActiveTab('info'); }} className={`border-b border-border/50 hover:bg-muted/30 cursor-pointer transition-colors ${r.pmsStatus === 'Overdue' ? 'bg-red-50/30' : ''}`}>
                    <td className="px-3 py-3 text-xs font-600 text-foreground font-mono">{r.pmsRecordId}</td>
                    <td className="px-3 py-3 text-xs text-foreground font-500">{r.generatorId}</td>
                    <td className="px-3 py-3 text-xs text-muted-foreground max-w-[160px]">
                      <p className="truncate font-500 text-foreground">{r.clientId}</p>
                      <p className="truncate text-2xs">{r.siteId}</p>
                    </td>
                    <td className="px-3 py-3"><span className="text-xs bg-muted/60 text-foreground px-2 py-0.5 rounded-full font-500">{r.pmsType}</span></td>
                    <td className="px-3 py-3 text-xs text-foreground">{r.pmsDate || '—'}</td>
                    <td className="px-3 py-3 text-xs font-mono text-foreground">{r.runningHours ? r.runningHours.toLocaleString() : '—'}</td>
                    <td className="px-3 py-3 text-xs text-foreground">{r.nextPmsDate || '—'}</td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-600 border ${statusColors[r.pmsStatus]}`}>{r.pmsStatus}</span>
                    </td>
                    <td className="px-3 py-3 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(r)} className="p-1.5 rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors" title="Edit"><Icon name="PencilSquareIcon" size={14} /></button>
                        <button onClick={(e) => openDeleteDialog(r, e)} className="p-1.5 rounded-md hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors" title="Delete"><Icon name="TrashIcon" size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="px-4 py-2.5 border-t border-border bg-muted/20">
          <p className="text-2xs text-muted-foreground">{filtered.length} of {records.length} records · Click a row to view details</p>
        </div>
      </div>

      {/* Detail Drawer */}
      {detailRecord && (
        <>
          <div className="fixed inset-0 bg-foreground/20 z-40 fade-in" onClick={() => setDetailRecord(null)} />
          <div className="fixed right-0 top-0 h-full w-full max-w-xl bg-card border-l border-border shadow-modal z-50 flex flex-col slide-up overflow-hidden">
            <div className="flex items-start justify-between px-6 py-4 border-b border-border flex-shrink-0">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-base font-700 text-foreground">{detailRecord.pmsRecordId}</h2>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-600 border ${statusColors[detailRecord.pmsStatus]}`}>{detailRecord.pmsStatus}</span>
                </div>
                <p className="text-xs text-muted-foreground">{detailRecord.generatorId} · {detailRecord.clientId}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => openEdit(detailRecord)} className="flex items-center gap-1.5 text-xs font-500 text-primary hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors">
                  <Icon name="PencilSquareIcon" size={14} /> Edit
                </button>
                <button onClick={(e) => openDeleteDialog(detailRecord, e)} className="flex items-center gap-1.5 text-xs font-500 text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors">
                  <Icon name="TrashIcon" size={14} /> Delete
                </button>
                <button onClick={() => setDetailRecord(null)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-colors"><Icon name="XMarkIcon" size={18} /></button>
              </div>
            </div>

            {/* Status change */}
            <div className="px-6 py-3 border-b border-border bg-muted/20 flex-shrink-0">
              <p className="text-2xs font-600 uppercase tracking-wider text-muted-foreground mb-2">Change Status</p>
              <div className="flex gap-2 flex-wrap">
                {(['Scheduled', 'In Progress', 'Completed', 'Overdue', 'Cancelled'] as PmsStatus[]).map(s => (
                  <button key={s} onClick={() => handleStatusChange(detailRecord, s)} className={`text-xs px-3 py-1.5 rounded-lg border font-500 transition-all duration-150 active:scale-95 ${detailRecord.pmsStatus === s ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-foreground hover:border-primary/40 hover:bg-primary/5'}`}>{s}</button>
                ))}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border flex-shrink-0">
              {(['info', 'checklist'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`px-5 py-3 text-xs font-500 capitalize transition-colors border-b-2 ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
                  {tab === 'info' ? 'PMS Info' : 'Checklist'}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-5 space-y-5">
              {activeTab === 'info' ? (
                <>
                  <div>
                    <p className="text-2xs font-600 uppercase tracking-wider text-muted-foreground mb-2.5">Schedule Details</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                      {[
                        { label: 'PMS Type', value: detailRecord.pmsType },
                        { label: 'PMS Date', value: detailRecord.pmsDate || '—' },
                        { label: 'Running Hours', value: detailRecord.runningHours ? `${detailRecord.runningHours.toLocaleString()} hrs` : '—' },
                        { label: 'Next PMS Date', value: detailRecord.nextPmsDate || '—' },
                        { label: 'Next PMS Hours', value: detailRecord.nextPmsHours ? `${detailRecord.nextPmsHours.toLocaleString()} hrs` : '—' },
                        { label: 'Technician ID', value: detailRecord.technicianId || '—' },
                      ].map(f => (
                        <div key={f.label}>
                          <p className="text-2xs text-muted-foreground font-500 mb-0.5">{f.label}</p>
                          <p className="text-xs text-foreground font-500">{f.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <hr className="border-border" />
                  <div>
                    <p className="text-2xs font-600 uppercase tracking-wider text-muted-foreground mb-2.5">Asset</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                      {[
                        { label: 'Generator ID', value: detailRecord.generatorId },
                        { label: 'Client ID', value: detailRecord.clientId },
                        { label: 'Site ID', value: detailRecord.siteId },
                      ].map(f => (
                        <div key={f.label}>
                          <p className="text-2xs text-muted-foreground font-500 mb-0.5">{f.label}</p>
                          <p className="text-xs text-foreground font-500">{f.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  {detailRecord.pmsScope && (
                    <div>
                      <p className="text-2xs font-600 uppercase tracking-wider text-muted-foreground mb-2">PMS Scope</p>
                      <p className="text-xs text-foreground leading-relaxed bg-muted/40 rounded-lg p-3">{detailRecord.pmsScope}</p>
                    </div>
                  )}
                  {detailRecord.generalCondition && (
                    <div>
                      <p className="text-2xs font-600 uppercase tracking-wider text-muted-foreground mb-2">General Condition</p>
                      <p className="text-xs text-foreground leading-relaxed">{detailRecord.generalCondition}</p>
                    </div>
                  )}
                  {detailRecord.recommendations && (
                    <div>
                      <p className="text-2xs font-600 uppercase tracking-wider text-muted-foreground mb-2">Recommendations</p>
                      <p className="text-xs text-foreground leading-relaxed">{detailRecord.recommendations}</p>
                    </div>
                  )}
                  {detailRecord.remarks && (
                    <div>
                      <p className="text-2xs font-600 uppercase tracking-wider text-muted-foreground mb-2">Remarks</p>
                      <p className="text-xs text-foreground leading-relaxed bg-amber-50/50 border border-amber-100 rounded-lg p-3">{detailRecord.remarks}</p>
                    </div>
                  )}
                </>
              ) : (
                <div>
                  <p className="text-2xs font-600 uppercase tracking-wider text-muted-foreground mb-3">Component Checklist</p>
                  <div className="space-y-2">
                    {CHECKLIST_KEYS.map(key => {
                      const val = (detailRecord as Record<string, unknown>)[key] as string || '';
                      return (
                        <div key={key} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                          <span className="text-xs text-foreground font-500">{CHECKLIST_LABELS[key]}</span>
                          <span className={`text-2xs font-600 px-2 py-0.5 rounded-full ${checklistColors[val]}`}>
                            {val || 'Not Checked'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => !saving && setModalOpen(false)} title={editRecord ? `Edit PMS — ${editRecord.pmsRecordId}` : 'New PMS Record'} subtitle="Fill in all PMS details and checklist items" size="xl" footer={modalFooter}>
        <div className="space-y-5">
          <div>
            <p className="text-xs font-600 text-muted-foreground uppercase tracking-wider mb-3">Schedule Information</p>
            <div className="grid grid-cols-2 gap-4">
              <PmsFormField label="Generator ID *" value={form.generatorId} onChange={v => setForm(f => ({ ...f, generatorId: v }))} placeholder="e.g. gen-047" />
              <PmsFormField label="Client ID *" value={form.clientId} onChange={v => setForm(f => ({ ...f, clientId: v }))} placeholder="e.g. client-001" />
              <PmsFormField label="Site ID *" value={form.siteId} onChange={v => setForm(f => ({ ...f, siteId: v }))} placeholder="e.g. site-001" />
              <PmsFormField label="Technician ID" value={form.technicianId} onChange={v => setForm(f => ({ ...f, technicianId: v }))} placeholder="e.g. tech-001" />
              <div>
                <label className="block text-xs font-500 text-muted-foreground mb-1.5">PMS Type</label>
                <select value={form.pmsType} onChange={e => setForm(f => ({ ...f, pmsType: e.target.value as PmsType }))} className="w-full text-sm bg-muted/40 border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground">
                  {(['250-Hour', '500-Hour', '1000-Hour', '2000-Hour', 'Annual', 'Semi-Annual', 'Monthly', 'Ad-Hoc'] as PmsType[]).map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-500 text-muted-foreground mb-1.5">Status</label>
                <select value={form.pmsStatus} onChange={e => setForm(f => ({ ...f, pmsStatus: e.target.value as PmsStatus }))} className="w-full text-sm bg-muted/40 border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground">
                  {(['Scheduled', 'In Progress', 'Completed', 'Overdue', 'Cancelled'] as PmsStatus[]).map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <PmsFormField label="PMS Date *" value={form.pmsDate} onChange={v => setForm(f => ({ ...f, pmsDate: v }))} placeholder="e.g. 15 Aug 2026" />
              <PmsFormField label="Running Hours" value={String(form.runningHours)} onChange={v => setForm(f => ({ ...f, runningHours: Number(v) || 0 }))} type="number" placeholder="0" />
              <PmsFormField label="Next PMS Date" value={form.nextPmsDate} onChange={v => setForm(f => ({ ...f, nextPmsDate: v }))} placeholder="e.g. 15 Nov 2026" />
              <PmsFormField label="Next PMS Hours" value={String(form.nextPmsHours)} onChange={v => setForm(f => ({ ...f, nextPmsHours: Number(v) || 0 }))} type="number" placeholder="0" />
              <div className="col-span-2">
                <label className="block text-xs font-500 text-muted-foreground mb-1.5">PMS Scope</label>
                <textarea value={form.pmsScope} onChange={e => setForm(f => ({ ...f, pmsScope: e.target.value }))} rows={2} placeholder="Describe the scope of work..." className="w-full text-sm bg-muted/40 border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none text-foreground" />
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs font-600 text-muted-foreground uppercase tracking-wider mb-3">Component Checklist</p>
            <div className="grid grid-cols-2 gap-3">
              {CHECKLIST_KEYS.map(key => (
                <div key={key} className="flex items-center justify-between gap-2">
                  <label className="text-xs text-foreground font-500 flex-1">{CHECKLIST_LABELS[key]}</label>
                  <select value={form.checklist[key]} onChange={e => setForm(f => ({ ...f, checklist: { ...f.checklist, [key]: e.target.value } }))} className="text-xs bg-muted/40 border border-border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground w-36">
                    <option value="">—</option>
                    <option>OK</option>
                    <option>Replaced</option>
                    <option>Needs Attention</option>
                    <option>N/A</option>
                  </select>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-xs font-500 text-muted-foreground mb-1.5">General Condition</label>
              <textarea value={form.generalCondition} onChange={e => setForm(f => ({ ...f, generalCondition: e.target.value }))} rows={2} placeholder="Overall condition of the unit..." className="w-full text-sm bg-muted/40 border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none text-foreground" />
            </div>
            <div>
              <label className="block text-xs font-500 text-muted-foreground mb-1.5">Recommendations</label>
              <textarea value={form.recommendations} onChange={e => setForm(f => ({ ...f, recommendations: e.target.value }))} rows={2} placeholder="Recommended follow-up actions..." className="w-full text-sm bg-muted/40 border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none text-foreground" />
            </div>
            <div>
              <label className="block text-xs font-500 text-muted-foreground mb-1.5">Remarks</label>
              <textarea value={form.remarks} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))} rows={2} placeholder="Optional notes..." className="w-full text-sm bg-muted/40 border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none text-foreground" />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function PmsFormField({ label, value, onChange, placeholder, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <div>
      <label className="block text-xs font-500 text-muted-foreground mb-1.5">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full text-sm bg-muted/40 border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground" />
    </div>
  );
}
