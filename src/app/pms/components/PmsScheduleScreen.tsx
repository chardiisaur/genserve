'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Icon from '@/components/ui/AppIcon';
import EmptyState from '@/components/ui/EmptyState';
import Modal from '@/components/ui/Modal';

export type PmsStatus = 'Scheduled' | 'In Progress' | 'Completed' | 'Overdue' | 'Cancelled';
export type PmsType = '250-Hour' | '500-Hour' | '1000-Hour' | '2000-Hour' | 'Annual' | 'Semi-Annual' | 'Monthly' | 'Ad-Hoc';

type ChecklistItem =
  | 'engineOil' | 'oilFilter' | 'fuelFilter' | 'waterSeparator' | 'airFilter' |'coolant'| 'belts' | 'hoses' | 'battery' | 'batteryCharger' |'radiatorCooling'| 'fuelSystem' | 'exhaust' | 'turbocharger' | 'alternator' |'avr' | 'controller' | 'breakerAts' | 'emergencyStop' | 'loadTest';

type ChecklistState = Record<ChecklistItem, 'OK' | 'Needs Attention' | 'Replaced' | 'N/A' | ''>;

const CHECKLIST_LABELS: Record<ChecklistItem, string> = {
  engineOil: 'Engine Oil', oilFilter: 'Oil Filter', fuelFilter: 'Fuel Filter',
  waterSeparator: 'Water Separator', airFilter: 'Air Filter', coolant: 'Coolant',
  belts: 'Belts', hoses: 'Hoses', battery: 'Battery', batteryCharger: 'Battery Charger',
  radiatorCooling: 'Radiator / Cooling', fuelSystem: 'Fuel System', exhaust: 'Exhaust',
  turbocharger: 'Turbocharger', alternator: 'Alternator', avr: 'AVR',
  controller: 'Controller', breakerAts: 'Breaker / ATS',
  emergencyStop: 'Emergency Stop / Safety', loadTest: 'Load Test',
};

const CHECKLIST_KEYS = Object.keys(CHECKLIST_LABELS) as ChecklistItem[];
const emptyChecklist: ChecklistState = CHECKLIST_KEYS.reduce(
  (acc, k) => ({ ...acc, [k]: '' }), {} as ChecklistState
);

// ── Types ────────────────────────────────────────────────────────────────────
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
  technicianId: string | null;
  pmsScope: string;
  pmsStatus: PmsStatus;
  engineOil: string; oilFilter: string; fuelFilter: string; waterSeparator: string;
  airFilter: string; coolant: string; belts: string; hoses: string;
  battery: string; batteryCharger: string; radiatorCooling: string; fuelSystem: string;
  exhaust: string; turbocharger: string; alternator: string; avr: string;
  controller: string; breakerAts: string; emergencyStop: string; loadTest: string;
  generalCondition: string;
  recommendations: string;
  remarks: string;
  // enriched from API
  clientName?: string;
  siteName?: string;
  generatorLabel?: string;
  technicianName?: string | null;
  daysUntilNextPms?: number | null;
  isUpcoming?: boolean;
}

interface ClientOption { clientId: string; clientName: string; }
interface SiteOption { siteId: string; siteName: string; clientId: string; }
interface GeneratorOption { generatorId: string; brand: string; model: string; assetNo: string; clientId: string; siteId: string; }
interface TechnicianOption { technicianId: string; technicianName: string; }

interface FormState {
  clientId: string;
  siteId: string;
  generatorId: string;
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
  clientId: '', siteId: '', generatorId: '',
  pmsType: '250-Hour', pmsDate: '', runningHours: 0, nextPmsDate: '', nextPmsHours: 0,
  technicianId: '', pmsScope: '', pmsStatus: 'Scheduled',
  checklist: { ...emptyChecklist }, generalCondition: '', recommendations: '', remarks: '',
};

// ── Constants ────────────────────────────────────────────────────────────────
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

// ── Toast ────────────────────────────────────────────────────────────────────
interface Toast { id: number; type: 'success' | 'error'; message: string }

function ToastList({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: number) => void }) {
  return (
    <div className="fixed bottom-5 right-5 z-[200] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-500 min-w-[280px] max-w-[400px] fade-in ${t.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
          <Icon name={t.type === 'success' ? 'CheckCircleIcon' : 'ExclamationCircleIcon'} size={16} className={`flex-shrink-0 ${t.type === 'success' ? 'text-emerald-500' : 'text-red-500'}`} />
          <span className="flex-1">{t.message}</span>
          <button onClick={() => onRemove(t.id)} className="text-current opacity-50 hover:opacity-100 transition-opacity"><Icon name="XMarkIcon" size={14} /></button>
        </div>
      ))}
    </div>
  );
}

// ── Delete Dialog ────────────────────────────────────────────────────────────
function DeleteConfirmDialog({ open, record, deleting, onConfirm, onCancel }: {
  open: boolean; record: PmsRecord | null; deleting: boolean;
  onConfirm: () => void; onCancel: () => void;
}) {
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
              Permanently delete <span className="font-600 text-foreground">{record.pmsRecordId}</span>?
              This action cannot be undone.
            </p>
          </div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-5">
          <p className="text-xs text-amber-800 font-500 flex items-start gap-2">
            <Icon name="ExclamationTriangleIcon" size={14} className="flex-shrink-0 mt-0.5" />
            The associated Generator, Client, Site, and Technician records will NOT be affected.
          </p>
        </div>
        <div className="flex items-center justify-end gap-3">
          <button type="button" onClick={onCancel} disabled={deleting}
            className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button type="button" onClick={onConfirm} disabled={deleting}
            className="flex items-center gap-2 bg-red-600 text-white text-sm font-500 px-5 py-2 rounded-lg hover:bg-red-700 active:scale-95 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed">
            {deleting ? (
              <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Deleting…</>
            ) : (
              <><Icon name="TrashIcon" size={14} />Delete PMS Record</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function recordToChecklist(r: PmsRecord): ChecklistState {
  return CHECKLIST_KEYS.reduce(
    (acc, k) => ({ ...acc, [k]: (r as Record<string, unknown>)[k] as string || '' }),
    {} as ChecklistState
  );
}

function formToApiBody(form: FormState) {
  const flat: Record<string, unknown> = {
    clientId: form.clientId,
    siteId: form.siteId,
    generatorId: form.generatorId,
    pmsType: form.pmsType,
    pmsDate: form.pmsDate,
    runningHours: form.runningHours,
    nextPmsDate: form.nextPmsDate,
    nextPmsHours: form.nextPmsHours,
    technicianId: form.technicianId || null,
    pmsScope: form.pmsScope,
    pmsStatus: form.pmsStatus,
    generalCondition: form.generalCondition,
    recommendations: form.recommendations,
    remarks: form.remarks,
  };
  CHECKLIST_KEYS.forEach(k => { flat[k] = form.checklist[k] || 'OK'; });
  return flat;
}

// ── Form Field Components ────────────────────────────────────────────────────
function PmsFormField({ label, value, onChange, placeholder, type = 'text', required }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-500 text-muted-foreground mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full text-sm bg-muted/40 border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground" />
    </div>
  );
}

// ── Main Screen ──────────────────────────────────────────────────────────────
export default function PmsScheduleScreen() {
  const [records, setRecords] = useState<PmsRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterTechnician, setFilterTechnician] = useState('');
  const [filterGenerator, setFilterGenerator] = useState('');

  // Dropdown data
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [allSites, setAllSites] = useState<SiteOption[]>([]);
  const [allGenerators, setAllGenerators] = useState<GeneratorOption[]>([]);
  const [technicians, setTechnicians] = useState<TechnicianOption[]>([]);
  const [dropdownsLoading, setDropdownsLoading] = useState(false);

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

  // ── Cascading dropdown options ─────────────────────────────────────────────
  const filteredSites = useMemo(
    () => form.clientId ? allSites.filter(s => s.clientId === form.clientId) : allSites,
    [allSites, form.clientId]
  );
  const filteredGenerators = useMemo(
    () => allGenerators.filter(g =>
      (!form.clientId || g.clientId === form.clientId) &&
      (!form.siteId || g.siteId === form.siteId)
    ),
    [allGenerators, form.clientId, form.siteId]
  );

  // ── Fetch dropdown data ────────────────────────────────────────────────────
  const fetchDropdowns = useCallback(async () => {
    setDropdownsLoading(true);
    try {
      const [cRes, sRes, gRes, tRes] = await Promise.all([
        fetch('/api/clients'),
        fetch('/api/sites'),
        fetch('/api/generators'),
        fetch('/api/technicians'),
      ]);
      if (cRes.ok) setClients(await cRes.json());
      if (sRes.ok) setAllSites(await sRes.json());
      if (gRes.ok) setAllGenerators(await gRes.json());
      if (tRes.ok) setTechnicians(await tRes.json());
    } catch {
      // non-fatal — dropdowns may be empty
    } finally {
      setDropdownsLoading(false);
    }
  }, []);

  // ── Fetch PMS records ──────────────────────────────────────────────────────
  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/pms');
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Server error ${res.status}`);
      }
      const data: PmsRecord[] = await res.json();
      setRecords(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load PMS records.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecords();
    fetchDropdowns();
  }, [fetchRecords, fetchDropdowns]);

  // ── Filtered list (client-side after API fetch) ────────────────────────────
  const filtered = useMemo(() => {
    return records.filter(r => {
      if (filterStatus && r.pmsStatus !== filterStatus) return false;
      if (filterGenerator && r.generatorId !== filterGenerator) return false;
      if (filterTechnician && r.technicianId !== filterTechnician) return false;
      if (search) {
        const q = search.toLowerCase();
        const searchable = [
          r.pmsRecordId, r.generatorId, r.clientId, r.siteId,
          r.clientName ?? '', r.siteName ?? '', r.generatorLabel ?? '',
          r.technicianName ?? '', r.technicianId ?? '', r.pmsType,
        ].join(' ').toLowerCase();
        if (!searchable.includes(q)) return false;
      }
      return true;
    });
  }, [records, search, filterStatus, filterGenerator, filterTechnician]);

  // ── KPIs ───────────────────────────────────────────────────────────────────
  const kpiScheduled = records.filter(r => r.pmsStatus === 'Scheduled').length;
  const kpiInProgress = records.filter(r => r.pmsStatus === 'In Progress').length;
  const kpiCompleted = records.filter(r => r.pmsStatus === 'Completed').length;
  const kpiOverdue = records.filter(r => r.pmsStatus === 'Overdue').length;
  const kpiUpcoming = records.filter(r => r.isUpcoming && r.pmsStatus !== 'Completed' && r.pmsStatus !== 'Cancelled').length;

  // ── Create / Edit ──────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditRecord(null);
    setForm({ ...emptyForm, checklist: { ...emptyChecklist } });
    setModalOpen(true);
  };

  const openEdit = (r: PmsRecord) => {
    setEditRecord(r);
    setForm({
      clientId: r.clientId, siteId: r.siteId, generatorId: r.generatorId,
      pmsType: r.pmsType as PmsType, pmsDate: r.pmsDate,
      runningHours: r.runningHours, nextPmsDate: r.nextPmsDate, nextPmsHours: r.nextPmsHours,
      technicianId: r.technicianId ?? '', pmsScope: r.pmsScope, pmsStatus: r.pmsStatus,
      checklist: recordToChecklist(r),
      generalCondition: r.generalCondition, recommendations: r.recommendations, remarks: r.remarks,
    });
    setModalOpen(true);
    setDetailRecord(null);
  };

  const handleSave = async () => {
    if (!form.clientId || !form.siteId || !form.generatorId || !form.pmsDate) {
      addToast('error', 'Client, Site, Generator, and PMS Date are required.');
      return;
    }
    setSaving(true);
    try {
      const body = formToApiBody(form);
      const url = editRecord ? `/api/pms/${editRecord.id}` : '/api/pms';
      const method = editRecord ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
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
      const res = await fetch(`/api/pms/${record.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pmsStatus: status }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Status update failed');
      }
      await fetchRecords();
      if (detailRecord?.id === record.id) {
        setDetailRecord(prev => prev ? { ...prev, pmsStatus: status } : prev);
      }
    } catch (err: unknown) {
      addToast('error', err instanceof Error ? err.message : 'Failed to update status.');
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
      const res = await fetch(`/api/pms/${deleteTarget.id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `Delete failed (HTTP ${res.status})`);
      }
      // Confirm server returned success before updating UI
      if (!data.success) {
        throw new Error('Server did not confirm deletion.');
      }
      // Refresh from database — do NOT just filter local state
      await fetchRecords();
      if (detailRecord?.id === deleteTarget.id) setDetailRecord(null);
      setDeleteTarget(null);
      addToast('success', `PMS record ${deleteTarget.pmsRecordId} deleted successfully.`);
    } catch (err: unknown) {
      addToast('error', err instanceof Error ? err.message : 'Failed to delete PMS record.');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => { if (!deleting) setDeleteTarget(null); };

  // ── Modal footer ───────────────────────────────────────────────────────────
  const modalFooter = (
    <div className="flex items-center justify-end gap-3 w-full">
      <button type="button" onClick={() => setModalOpen(false)} disabled={saving}
        className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50">
        Cancel
      </button>
      <button type="button" onClick={handleSave} disabled={saving}
        className="flex items-center gap-2 bg-primary text-primary-foreground text-sm font-500 px-5 py-2 rounded-lg hover:bg-primary/90 active:scale-95 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed">
        {saving ? (
          <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>{editRecord ? 'Updating…' : 'Creating…'}</>
        ) : (
          <><Icon name="CheckIcon" size={15} />{editRecord ? 'Update PMS' : 'Create PMS'}</>
        )}
      </button>
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      <ToastList toasts={toasts} onRemove={removeToast} />
      <DeleteConfirmDialog open={!!deleteTarget} record={deleteTarget} deleting={deleting} onConfirm={handleDeleteConfirm} onCancel={handleDeleteCancel} />

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-600 text-foreground">PMS Schedule</h1>
          <p className="text-xs text-muted-foreground mt-1">{records.length} PMS records · {kpiUpcoming} upcoming in 30 days</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-primary text-primary-foreground text-sm font-500 px-4 py-2 rounded-lg hover:bg-primary/90 active:scale-95 transition-all duration-150 flex-shrink-0">
          <Icon name="PlusIcon" size={16} />
          New PMS
        </button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Scheduled', value: kpiScheduled, color: 'text-blue-600', bg: 'bg-blue-50', icon: 'CalendarDaysIcon' },
          { label: 'In Progress', value: kpiInProgress, color: 'text-amber-600', bg: 'bg-amber-50', icon: 'ArrowPathIcon' },
          { label: 'Completed', value: kpiCompleted, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: 'CheckCircleIcon' },
          { label: 'Overdue', value: kpiOverdue, color: 'text-red-600', bg: 'bg-red-50', icon: 'ExclamationCircleIcon' },
          { label: 'Upcoming (30d)', value: kpiUpcoming, color: 'text-violet-600', bg: 'bg-violet-50', icon: 'BellAlertIcon' },
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
          <input type="text" placeholder="Search by PMS ID, generator, client, technician…"
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-muted/40 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="text-sm bg-muted/40 border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground">
          <option value="">All Statuses</option>
          {(['Scheduled', 'In Progress', 'Completed', 'Overdue', 'Cancelled'] as PmsStatus[]).map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={filterGenerator} onChange={e => setFilterGenerator(e.target.value)}
          className="text-sm bg-muted/40 border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground">
          <option value="">All Generators</option>
          {allGenerators.map(g => (
            <option key={g.generatorId} value={g.generatorId}>
              {g.brand} {g.model} ({g.generatorId})
            </option>
          ))}
        </select>
        <select value={filterTechnician} onChange={e => setFilterTechnician(e.target.value)}
          className="text-sm bg-muted/40 border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground">
          <option value="">All Technicians</option>
          {technicians.map(t => <option key={t.technicianId} value={t.technicianId}>{t.technicianName}</option>)}
        </select>
        {(search || filterStatus || filterGenerator || filterTechnician) && (
          <button onClick={() => { setSearch(''); setFilterStatus(''); setFilterGenerator(''); setFilterTechnician(''); }}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-muted transition-colors">
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
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <Icon name="ExclamationCircleIcon" size={24} className="text-red-500" />
            </div>
            <div className="text-center">
              <p className="text-sm font-600 text-foreground mb-1">Failed to load PMS records</p>
              <p className="text-xs text-muted-foreground mb-4">{error}</p>
              <button onClick={fetchRecords} className="flex items-center gap-2 text-sm text-primary hover:underline mx-auto">
                <Icon name="ArrowPathIcon" size={14} /> Retry
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full min-w-[1000px]">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {['PMS Record ID', 'Generator', 'Client', 'Site', 'PMS Type', 'PMS Date', 'Running Hrs', 'Next PMS Date', 'Next PMS Hrs', 'Technician', 'Status'].map(h => (
                    <th key={h} className="text-left px-3 py-3 text-2xs font-600 uppercase tracking-wider text-muted-foreground whitespace-nowrap">{h}</th>
                  ))}
                  <th className="px-3 py-3 text-right text-2xs font-600 uppercase tracking-wider text-muted-foreground w-20">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={12}><EmptyState icon="CalendarDaysIcon" title="No PMS records found" description="Try adjusting your search or filters, or create a new PMS record." /></td></tr>
                ) : filtered.map(r => (
                  <tr key={r.id}
                    onClick={() => { setDetailRecord(r); setActiveTab('info'); }}
                    className={`border-b border-border/50 hover:bg-muted/30 cursor-pointer transition-colors ${r.pmsStatus === 'Overdue' ? 'bg-red-50/30' : r.isUpcoming && r.pmsStatus !== 'Completed' ? 'bg-amber-50/20' : ''}`}>
                    <td className="px-3 py-3 text-xs font-600 text-foreground font-mono">{r.pmsRecordId}</td>
                    <td className="px-3 py-3 text-xs text-foreground">
                      <p className="font-500">{r.generatorLabel || r.generatorId}</p>
                      <p className="text-2xs text-muted-foreground">{r.generatorId}</p>
                    </td>
                    <td className="px-3 py-3 text-xs text-foreground font-500 max-w-[120px] truncate">{r.clientName || r.clientId}</td>
                    <td className="px-3 py-3 text-xs text-muted-foreground max-w-[120px] truncate">{r.siteName || r.siteId}</td>
                    <td className="px-3 py-3"><span className="text-xs bg-muted/60 text-foreground px-2 py-0.5 rounded-full font-500">{r.pmsType}</span></td>
                    <td className="px-3 py-3 text-xs text-foreground whitespace-nowrap">{r.pmsDate || '—'}</td>
                    <td className="px-3 py-3 text-xs font-mono text-foreground">{r.runningHours ? r.runningHours.toLocaleString() : '—'}</td>
                    <td className="px-3 py-3 text-xs text-foreground whitespace-nowrap">
                      {r.nextPmsDate || '—'}
                      {r.daysUntilNextPms !== null && r.daysUntilNextPms !== undefined && r.pmsStatus !== 'Completed' && r.pmsStatus !== 'Cancelled' && (
                        <span className={`ml-1 text-2xs font-500 ${r.daysUntilNextPms < 0 ? 'text-red-500' : r.daysUntilNextPms <= 30 ? 'text-amber-500' : 'text-muted-foreground'}`}>
                          ({r.daysUntilNextPms < 0 ? `${Math.abs(r.daysUntilNextPms)}d overdue` : `${r.daysUntilNextPms}d`})
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-xs font-mono text-foreground">{r.nextPmsHours ? r.nextPmsHours.toLocaleString() : '—'}</td>
                    <td className="px-3 py-3 text-xs text-foreground">{r.technicianName || (r.technicianId ? r.technicianId : '—')}</td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-600 border ${statusColors[r.pmsStatus]}`}>{r.pmsStatus}</span>
                    </td>
                    <td className="px-3 py-3 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(r)} className="p-1.5 rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors" title="Edit"><Icon name="PencilSquareIcon" size={14} /></button>
                        <button onClick={e => openDeleteDialog(r, e)} className="p-1.5 rounded-md hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors" title="Delete"><Icon name="TrashIcon" size={14} /></button>
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
                <p className="text-xs text-muted-foreground">{detailRecord.generatorLabel || detailRecord.generatorId} · {detailRecord.clientName || detailRecord.clientId}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => openEdit(detailRecord)} className="flex items-center gap-1.5 text-xs font-500 text-primary hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors">
                  <Icon name="PencilSquareIcon" size={14} /> Edit
                </button>
                <button onClick={e => openDeleteDialog(detailRecord, e)} className="flex items-center gap-1.5 text-xs font-500 text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors">
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
                  <button key={s} onClick={() => handleStatusChange(detailRecord, s)}
                    className={`text-xs px-3 py-1.5 rounded-lg border font-500 transition-all duration-150 active:scale-95 ${detailRecord.pmsStatus === s ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-foreground hover:border-primary/40 hover:bg-primary/5'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border flex-shrink-0">
              {(['info', 'checklist'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-5 py-3 text-xs font-500 capitalize transition-colors border-b-2 ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
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
                        { label: 'Technician', value: detailRecord.technicianName || detailRecord.technicianId || '—' },
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
                        { label: 'Generator', value: detailRecord.generatorLabel || detailRecord.generatorId },
                        { label: 'Generator ID', value: detailRecord.generatorId },
                        { label: 'Client', value: detailRecord.clientName || detailRecord.clientId },
                        { label: 'Site', value: detailRecord.siteName || detailRecord.siteId },
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
      <Modal
        open={modalOpen}
        onClose={() => !saving && setModalOpen(false)}
        title={editRecord ? `Edit PMS — ${editRecord.pmsRecordId}` : 'New PMS Record'}
        subtitle="Fill in all PMS details and checklist items"
        size="xl"
        footer={modalFooter}
      >
        <div className="space-y-6">
          {/* Asset Selection */}
          <div>
            <p className="text-xs font-600 text-muted-foreground uppercase tracking-wider mb-3">Asset Selection</p>
            <div className="grid grid-cols-3 gap-4">
              {/* Client */}
              <div>
                <label className="block text-xs font-500 text-muted-foreground mb-1.5">Client <span className="text-red-500">*</span></label>
                <select
                  value={form.clientId}
                  onChange={e => setForm(f => ({ ...f, clientId: e.target.value, siteId: '', generatorId: '' }))}
                  disabled={dropdownsLoading}
                  className="w-full text-sm bg-muted/40 border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground disabled:opacity-60">
                  <option value="">Select Client…</option>
                  {clients.map(c => <option key={c.clientId} value={c.clientId}>{c.clientName}</option>)}
                </select>
              </div>
              {/* Site */}
              <div>
                <label className="block text-xs font-500 text-muted-foreground mb-1.5">Site <span className="text-red-500">*</span></label>
                <select
                  value={form.siteId}
                  onChange={e => setForm(f => ({ ...f, siteId: e.target.value, generatorId: '' }))}
                  disabled={!form.clientId || dropdownsLoading}
                  className="w-full text-sm bg-muted/40 border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground disabled:opacity-60">
                  <option value="">Select Site…</option>
                  {filteredSites.map(s => <option key={s.siteId} value={s.siteId}>{s.siteName}</option>)}
                </select>
              </div>
              {/* Generator */}
              <div>
                <label className="block text-xs font-500 text-muted-foreground mb-1.5">Generator <span className="text-red-500">*</span></label>
                <select
                  value={form.generatorId}
                  onChange={e => setForm(f => ({ ...f, generatorId: e.target.value }))}
                  disabled={!form.siteId || dropdownsLoading}
                  className="w-full text-sm bg-muted/40 border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground disabled:opacity-60">
                  <option value="">Select Generator…</option>
                  {filteredGenerators.map(g => (
                    <option key={g.generatorId} value={g.generatorId}>
                      {g.brand} {g.model} {g.assetNo ? `(${g.assetNo})` : `(${g.generatorId})`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Schedule Information */}
          <div>
            <p className="text-xs font-600 text-muted-foreground uppercase tracking-wider mb-3">Schedule Information</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-500 text-muted-foreground mb-1.5">PMS Type</label>
                <select value={form.pmsType} onChange={e => setForm(f => ({ ...f, pmsType: e.target.value as PmsType }))}
                  className="w-full text-sm bg-muted/40 border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground">
                  {(['250-Hour', '500-Hour', '1000-Hour', '2000-Hour', 'Annual', 'Semi-Annual', 'Monthly', 'Ad-Hoc'] as PmsType[]).map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-500 text-muted-foreground mb-1.5">Status</label>
                <select value={form.pmsStatus} onChange={e => setForm(f => ({ ...f, pmsStatus: e.target.value as PmsStatus }))}
                  className="w-full text-sm bg-muted/40 border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground">
                  {(['Scheduled', 'In Progress', 'Completed', 'Overdue', 'Cancelled'] as PmsStatus[]).map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <PmsFormField label="PMS Date" value={form.pmsDate} onChange={v => setForm(f => ({ ...f, pmsDate: v }))} placeholder="e.g. 2026-08-15" required />
              <PmsFormField label="Running Hours" value={String(form.runningHours)} onChange={v => setForm(f => ({ ...f, runningHours: Number(v) || 0 }))} type="number" placeholder="0" />
              <PmsFormField label="Next PMS Date" value={form.nextPmsDate} onChange={v => setForm(f => ({ ...f, nextPmsDate: v }))} placeholder="e.g. 2026-11-15" />
              <PmsFormField label="Next PMS Hours" value={String(form.nextPmsHours)} onChange={v => setForm(f => ({ ...f, nextPmsHours: Number(v) || 0 }))} type="number" placeholder="0" />
              {/* Technician */}
              <div className="col-span-2">
                <label className="block text-xs font-500 text-muted-foreground mb-1.5">Technician</label>
                <select value={form.technicianId} onChange={e => setForm(f => ({ ...f, technicianId: e.target.value }))}
                  disabled={dropdownsLoading}
                  className="w-full text-sm bg-muted/40 border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground disabled:opacity-60">
                  <option value="">— No Technician Assigned —</option>
                  {technicians.map(t => <option key={t.technicianId} value={t.technicianId}>{t.technicianName}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-500 text-muted-foreground mb-1.5">PMS Scope</label>
                <textarea value={form.pmsScope} onChange={e => setForm(f => ({ ...f, pmsScope: e.target.value }))} rows={2}
                  placeholder="Describe the scope of work…"
                  className="w-full text-sm bg-muted/40 border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none text-foreground" />
              </div>
            </div>
          </div>

          {/* Component Checklist */}
          <div>
            <p className="text-xs font-600 text-muted-foreground uppercase tracking-wider mb-3">Component Checklist</p>
            <div className="grid grid-cols-2 gap-3">
              {CHECKLIST_KEYS.map(key => (
                <div key={key} className="flex items-center justify-between gap-2">
                  <label className="text-xs text-foreground font-500 flex-1">{CHECKLIST_LABELS[key]}</label>
                  <select value={form.checklist[key]}
                    onChange={e => setForm(f => ({ ...f, checklist: { ...f.checklist, [key]: e.target.value as ChecklistState[ChecklistItem] } }))}
                    className="text-xs bg-muted/40 border border-border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground w-36">
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

          {/* Findings & Notes */}
          <div>
            <p className="text-xs font-600 text-muted-foreground uppercase tracking-wider mb-3">Findings & Notes</p>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-xs font-500 text-muted-foreground mb-1.5">General Condition</label>
                <textarea value={form.generalCondition} onChange={e => setForm(f => ({ ...f, generalCondition: e.target.value }))} rows={2}
                  placeholder="Overall condition of the unit…"
                  className="w-full text-sm bg-muted/40 border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none text-foreground" />
              </div>
              <div>
                <label className="block text-xs font-500 text-muted-foreground mb-1.5">Recommendations</label>
                <textarea value={form.recommendations} onChange={e => setForm(f => ({ ...f, recommendations: e.target.value }))} rows={2}
                  placeholder="Recommended follow-up actions…"
                  className="w-full text-sm bg-muted/40 border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none text-foreground" />
              </div>
              <div>
                <label className="block text-xs font-500 text-muted-foreground mb-1.5">Remarks</label>
                <textarea value={form.remarks} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))} rows={2}
                  placeholder="Optional notes…"
                  className="w-full text-sm bg-muted/40 border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none text-foreground" />
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}