'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';
import EmptyState from '@/components/ui/EmptyState';
import Modal from '@/components/ui/Modal';

export type GeneratorStatus = 'Active' | 'In Repair' | 'Standby' | 'Decommissioned';
export type FuelType = 'Diesel' | 'Natural Gas' | 'Dual Fuel';
export type Phase = 'Single-Phase' | 'Three-Phase';

export interface GeneratorAsset {
  id: string;
  generatorId: string;
  clientId: string;
  siteId: string;
  assetNo: string;
  brand: string;
  model: string;
  ratedKw: number;
  ratedKva: number;
  voltage: number;
  phase: Phase;
  frequencyHz: number;
  rpm: number;
  engineBrand: string;
  engineModel: string;
  engineSerialNo: string;
  alternatorBrand: string;
  alternatorModel: string;
  alternatorSerialNo: string;
  controllerBrand: string;
  controllerModel: string;
  atsBrandModel: string;
  breakerRatingA: number;
  fuelType: FuelType;
  installationDate: string;
  warrantyExpiry: string;
  currentRunningHours: number;
  pmsIntervalHours: number;
  lastPmsDate: string;
  nextPmsDueDate: string;
  synchronizingCapable: string;
  status: GeneratorStatus;
  remarks: string;
}

const statusColors: Record<GeneratorStatus, string> = {
  'Active': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'In Repair': 'bg-amber-50 text-amber-700 border-amber-200',
  'Standby': 'bg-blue-50 text-blue-700 border-blue-200',
  'Decommissioned': 'bg-gray-100 text-gray-500 border-gray-200',
};

const emptyForm: Omit<GeneratorAsset, 'id' | 'generatorId'> = {
  clientId: '', siteId: '', assetNo: '', brand: '', model: '',
  ratedKw: 0, ratedKva: 0, voltage: 400, phase: 'Three-Phase',
  frequencyHz: 60, rpm: 1800, engineBrand: '', engineModel: '', engineSerialNo: '',
  alternatorBrand: '', alternatorModel: '', alternatorSerialNo: '',
  controllerBrand: '', controllerModel: '', atsBrandModel: '', breakerRatingA: 0,
  fuelType: 'Diesel', installationDate: '', warrantyExpiry: '',
  currentRunningHours: 0, pmsIntervalHours: 250, lastPmsDate: '', nextPmsDueDate: '',
  synchronizingCapable: 'No', status: 'Active', remarks: '',
};

export default function GeneratorsScreen() {
  const [generators, setGenerators] = useState<GeneratorAsset[]>([]);
  const [clients, setClients] = useState<{ clientId: string; clientName: string }[]>([]);
  const [sites, setSites] = useState<{ siteId: string; siteName: string; clientId: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [detailGen, setDetailGen] = useState<GeneratorAsset | null>(null);
  const [activeTab, setActiveTab] = useState<'specs' | 'pms'>('specs');
  const [modalOpen, setModalOpen] = useState(false);
  const [editGen, setEditGen] = useState<GeneratorAsset | null>(null);
  const [form, setForm] = useState<Omit<GeneratorAsset, 'id' | 'generatorId'>>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<GeneratorAsset | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [genRes, clientRes, siteRes] = await Promise.all([
        fetch('/api/generators'),
        fetch('/api/clients'),
        fetch('/api/sites'),
      ]);
      if (!genRes.ok) {
        const d = await genRes.json().catch(() => ({}));
        throw new Error(d.error || `Server error ${genRes.status}`);
      }
      setGenerators(await genRes.json());
      if (clientRes.ok) setClients(await clientRes.json());
      if (siteRes.ok) setSites(await siteRes.json());
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to load generators');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const getClientName = (clientId: string) => clients.find(c => c.clientId === clientId)?.clientName || clientId;
  const getSiteName = (siteId: string) => sites.find(s => s.siteId === siteId)?.siteName || siteId;
  const filteredSites = useMemo(() => sites.filter(s => !form.clientId || s.clientId === form.clientId), [sites, form.clientId]);

  const filtered = useMemo(() => {
    return generators.filter((g) => {
      if (search) {
        const q = search.toLowerCase();
        if (!g.assetNo.toLowerCase().includes(q) && !g.brand.toLowerCase().includes(q) && !g.model.toLowerCase().includes(q) &&
            !getClientName(g.clientId).toLowerCase().includes(q) && !getSiteName(g.siteId).toLowerCase().includes(q) && !g.engineModel.toLowerCase().includes(q)) return false;
      }
      if (clientFilter && g.clientId !== clientFilter) return false;
      if (statusFilter && g.status !== statusFilter) return false;
      return true;
    });
  }, [generators, search, clientFilter, statusFilter, clients, sites]);

  const hoursUntilPms = (gen: GeneratorAsset) => {
    const lastPmsHours = gen.currentRunningHours - (gen.currentRunningHours % gen.pmsIntervalHours);
    return Math.max(0, lastPmsHours + gen.pmsIntervalHours - gen.currentRunningHours);
  };

  const pmsUrgency = (gen: GeneratorAsset) => {
    const remaining = hoursUntilPms(gen);
    if (remaining <= 50) return 'critical';
    if (remaining <= 100) return 'warning';
    return 'ok';
  };

  const openCreate = () => {
    setEditGen(null);
    setForm(emptyForm);
    setSaveError(null);
    setModalOpen(true);
  };

  const openEdit = (g: GeneratorAsset) => {
    setEditGen(g);
    setForm({ ...g });
    setSaveError(null);
    setModalOpen(true);
    setDetailGen(null);
  };

  const handleSave = async () => {
    if (!form.clientId || !form.siteId || !form.assetNo.trim()) {
      setSaveError('Client, Site, and Asset No. are required.');
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      let res: Response;
      if (editGen) {
        res = await fetch(`/api/generators/${editGen.generatorId}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
        });
      } else {
        res = await fetch('/api/generators', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
        });
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Server error ${res.status}`);
      }
      await fetchAll();
      setModalOpen(false);
    } catch (err: unknown) {
      setSaveError((err as Error).message || 'Failed to save generator');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (gen: GeneratorAsset) => {
    setDeleting(true);
    try {
      let res = await fetch(`/api/generators/${gen.generatorId}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Server error ${res.status}`);
      }
      await fetchAll();
      setDeleteConfirm(null);
      if (detailGen?.generatorId === gen.generatorId) setDetailGen(null);
    } catch (err: unknown) {
      alert((err as Error).message || 'Failed to delete generator');
    } finally {
      setDeleting(false);
    }
  };

  const f = (key: keyof typeof emptyForm, val: string | number) => setForm(prev => ({ ...prev, [key]: val }));

  const modalFooter = (
    <div className="flex items-center justify-end gap-3 w-full">
      <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-muted transition-colors">Cancel</button>
      <button type="button" onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-primary text-primary-foreground text-sm font-500 px-5 py-2 rounded-lg hover:bg-primary/90 active:scale-95 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed">
        {saving ? <><Icon name="ArrowPathIcon" size={15} className="animate-spin" />Saving...</> : <><Icon name="CheckIcon" size={15} />{editGen ? 'Update Generator' : 'Add Generator'}</>}
      </button>
    </div>
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Icon name="ArrowPathIcon" size={32} className="animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading generators...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Icon name="ExclamationCircleIcon" size={40} className="text-red-500" />
        <p className="text-base font-600 text-foreground">Failed to load generators</p>
        <p className="text-sm text-muted-foreground">{error}</p>
        <button onClick={fetchAll} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-500 hover:bg-primary/90 transition-colors">
          <Icon name="ArrowPathIcon" size={15} />Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Icon name="ArrowLeftIcon" size={13} />
              Back to Dashboard
            </Link>
          </div>
          <h1 className="text-2xl font-600 text-foreground">Generator Assets</h1>
          <p className="text-xs text-muted-foreground mt-1">
            {generators.length} registered units · {generators.filter(g => g.status === 'Active').length} active · {generators.filter(g => g.status === 'In Repair').length} in repair
          </p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-primary text-primary-foreground text-sm font-500 px-4 py-2 rounded-lg hover:bg-primary/90 active:scale-95 transition-all duration-150 flex-shrink-0">
          <Icon name="PlusIcon" size={16} />Add Generator
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Units', value: generators.length, icon: 'BoltIcon', color: 'text-primary bg-primary/5 border-primary/10' },
          { label: 'Active', value: generators.filter(g => g.status === 'Active').length, icon: 'CheckCircleIcon', color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
          { label: 'In Repair', value: generators.filter(g => g.status === 'In Repair').length, icon: 'WrenchScrewdriverIcon', color: 'text-amber-600 bg-amber-50 border-amber-100' },
          { label: 'PMS Due ≤50h', value: generators.filter(g => pmsUrgency(g) === 'critical').length, icon: 'ExclamationTriangleIcon', color: 'text-red-600 bg-red-50 border-red-100' },
        ].map((card) => (
          <div key={card.label} className={`border rounded-xl p-4 flex items-center gap-3 ${card.color}`}>
            <Icon name={card.icon as Parameters<typeof Icon>[0]['name']} size={20} />
            <div>
              <p className="text-xl font-700">{card.value}</p>
              <p className="text-xs opacity-70 mt-0.5">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Icon name="MagnifyingGlassIcon" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" placeholder="Search asset no., brand, model, client…" value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30 text-foreground placeholder:text-muted-foreground" />
        </div>
        <select value={clientFilter} onChange={e => setClientFilter(e.target.value)}
          className="px-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30 text-foreground">
          <option value="">All Clients</option>
          {clients.map(c => <option key={c.clientId} value={c.clientId}>{c.clientName}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30 text-foreground">
          <option value="">All Statuses</option>
          {(['Active', 'In Repair', 'Standby', 'Decommissioned'] as GeneratorStatus[]).map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        {(search || clientFilter || statusFilter) && (
          <button onClick={() => { setSearch(''); setClientFilter(''); setStatusFilter(''); }}
            className="flex items-center gap-1.5 px-3 py-2 text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg bg-card transition-colors">
            <Icon name="XMarkIcon" size={13} /> Clear
          </button>
        )}
        <span className="ml-auto text-xs text-muted-foreground">{filtered.length} unit{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState icon="BoltIcon" title="No generators found" description="No generators match your filters, or no generators have been added yet."
          action={{ label: 'Add Generator', onClick: openCreate }} />
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  {['Asset / Unit', 'Client', 'Site', 'Brand / Model', 'kVA', 'Run Hrs', 'Next PMS', 'Status', 'Actions'].map(h => (
                    <th key={h} className={`px-4 py-3 text-xs font-600 text-muted-foreground uppercase tracking-wide whitespace-nowrap ${h === 'kVA' || h === 'Run Hrs' || h === 'Actions' ? 'text-right' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((gen) => {
                  const urgency = pmsUrgency(gen);
                  const remaining = hoursUntilPms(gen);
                  return (
                    <tr key={gen.generatorId} className="hover:bg-muted/30 transition-colors group">
                      <td className="px-4 py-3">
                        <button onClick={() => { setDetailGen(gen); setActiveTab('specs'); }} className="text-left">
                          <p className="font-600 text-foreground group-hover:text-primary transition-colors">{gen.assetNo}</p>
                          <p className="text-2xs text-muted-foreground mt-0.5">{gen.generatorId}</p>
                        </button>
                      </td>
                      <td className="px-4 py-3 text-xs text-foreground">{getClientName(gen.clientId)}</td>
                      <td className="px-4 py-3 text-xs text-foreground">{getSiteName(gen.siteId)}</td>
                      <td className="px-4 py-3">
                        <p className="font-500 text-foreground text-xs">{gen.brand}</p>
                        <p className="text-2xs text-muted-foreground">{gen.model}</p>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-xs font-500 text-foreground">{gen.ratedKva.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-xs font-500 text-foreground">{gen.currentRunningHours.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-foreground">{gen.nextPmsDueDate}</p>
                        <p className={`text-2xs mt-0.5 font-500 ${urgency === 'critical' ? 'text-red-600' : urgency === 'warning' ? 'text-amber-600' : 'text-muted-foreground'}`}>
                          {remaining}h remaining
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-500 border ${statusColors[gen.status]}`}>{gen.status}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setDetailGen(gen); setActiveTab('specs'); }} title="View" className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"><Icon name="EyeIcon" size={14} /></button>
                          <button onClick={() => openEdit(gen)} title="Edit" className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"><Icon name="PencilSquareIcon" size={14} /></button>
                          <button onClick={() => setDeleteConfirm(gen)} title="Delete" className="p-1.5 rounded-md text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors"><Icon name="TrashIcon" size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Drawer */}
      {detailGen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-foreground/30" onClick={() => setDetailGen(null)} />
          <aside className="relative w-full max-w-2xl bg-card border-l border-border h-full overflow-y-auto scrollbar-thin shadow-2xl flex flex-col">
            <div className="flex items-start justify-between px-6 py-4 border-b border-border sticky top-0 bg-card z-10">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-600 text-foreground">{detailGen.assetNo}</h2>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-500 border ${statusColors[detailGen.status]}`}>{detailGen.status}</span>
                  {detailGen.synchronizingCapable === 'Yes' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-500 bg-blue-50 text-blue-700 border border-blue-200">
                      <Icon name="ArrowsRightLeftIcon" size={11} /> Sync
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{detailGen.brand} {detailGen.model} · {detailGen.ratedKva} kVA · {getClientName(detailGen.clientId)} — {getSiteName(detailGen.siteId)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => openEdit(detailGen)} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"><Icon name="PencilSquareIcon" size={15} /></button>
                <button onClick={() => setDetailGen(null)} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"><Icon name="XMarkIcon" size={16} /></button>
              </div>
            </div>
            <div className="flex border-b border-border px-6">
              {(['specs', 'pms'] as const).map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-4 py-3 text-sm font-500 border-b-2 transition-colors ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
                  {tab === 'specs' ? 'Asset Details' : 'PMS Info'}
                </button>
              ))}
            </div>
            <div className="flex-1 px-6 py-5">
              {activeTab === 'specs' && (
                <div className="space-y-5">
                  <div className="bg-muted/50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-500 text-muted-foreground">Running Hours Progress</span>
                      <span className="text-sm font-700 text-foreground tabular-nums">{detailGen.currentRunningHours.toLocaleString()} h</span>
                    </div>
                    <div className="h-2 bg-border rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${pmsUrgency(detailGen) === 'critical' ? 'bg-red-500' : pmsUrgency(detailGen) === 'warning' ? 'bg-amber-500' : 'bg-primary'}`}
                        style={{ width: `${Math.min(100, ((detailGen.currentRunningHours % detailGen.pmsIntervalHours) / detailGen.pmsIntervalHours) * 100)}%` }} />
                    </div>
                    <div className="flex justify-between mt-1.5 text-2xs text-muted-foreground">
                      <span>Last PMS: {detailGen.lastPmsDate || '—'}</span>
                      <span>Next PMS: {detailGen.nextPmsDueDate || '—'} ({hoursUntilPms(detailGen)}h left)</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <SpecSection title="Generator">
                      <SpecRow label="Asset No." value={detailGen.assetNo} />
                      <SpecRow label="Brand" value={detailGen.brand} />
                      <SpecRow label="Model" value={detailGen.model} />
                      <SpecRow label="Rated kW" value={`${detailGen.ratedKw} kW`} />
                      <SpecRow label="Rated kVA" value={`${detailGen.ratedKva} kVA`} />
                      <SpecRow label="Voltage" value={`${detailGen.voltage} V`} />
                      <SpecRow label="Phase" value={detailGen.phase} />
                      <SpecRow label="Frequency" value={`${detailGen.frequencyHz} Hz`} />
                      <SpecRow label="RPM" value={`${detailGen.rpm}`} />
                      <SpecRow label="Fuel Type" value={detailGen.fuelType} />
                    </SpecSection>
                    <SpecSection title="Engine">
                      <SpecRow label="Brand" value={detailGen.engineBrand} />
                      <SpecRow label="Model" value={detailGen.engineModel} />
                      <SpecRow label="Serial No." value={detailGen.engineSerialNo} />
                    </SpecSection>
                    <SpecSection title="Alternator">
                      <SpecRow label="Brand" value={detailGen.alternatorBrand} />
                      <SpecRow label="Model" value={detailGen.alternatorModel} />
                      <SpecRow label="Serial No." value={detailGen.alternatorSerialNo} />
                    </SpecSection>
                    <SpecSection title="Controls">
                      <SpecRow label="Controller" value={`${detailGen.controllerBrand} ${detailGen.controllerModel}`} />
                      <SpecRow label="ATS" value={detailGen.atsBrandModel} />
                      <SpecRow label="Breaker" value={`${detailGen.breakerRatingA} A`} />
                      <SpecRow label="Sync Capable" value={detailGen.synchronizingCapable} />
                    </SpecSection>
                    <SpecSection title="Installation">
                      <SpecRow label="Install Date" value={detailGen.installationDate} />
                      <SpecRow label="Warranty Expiry" value={detailGen.warrantyExpiry} />
                      <SpecRow label="PMS Interval" value={`${detailGen.pmsIntervalHours} h`} />
                    </SpecSection>
                  </div>
                  {detailGen.remarks && (
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-xs font-500 text-muted-foreground mb-1">Remarks</p>
                      <p className="text-sm text-foreground">{detailGen.remarks}</p>
                    </div>
                  )}
                </div>
              )}
              {activeTab === 'pms' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <SpecRow label="PMS Interval" value={`${detailGen.pmsIntervalHours} hours`} />
                    <SpecRow label="Current Hours" value={`${detailGen.currentRunningHours.toLocaleString()} h`} />
                    <SpecRow label="Last PMS Date" value={detailGen.lastPmsDate || '—'} />
                    <SpecRow label="Next PMS Due" value={detailGen.nextPmsDueDate || '—'} />
                    <SpecRow label="Hours Remaining" value={`${hoursUntilPms(detailGen)} h`} />
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}
        title={editGen ? `Edit Generator — ${editGen.assetNo}` : 'Add New Generator'}
        subtitle={editGen ? 'Update generator asset details' : 'Enter generator details to register a new asset'}
        size="xl" footer={modalFooter}>
        <div className="space-y-4">
          {saveError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 text-sm text-red-700">
              <Icon name="ExclamationCircleIcon" size={16} className="flex-shrink-0" />{saveError}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-500 text-foreground mb-1.5">Client <span className="text-red-500">*</span></label>
              <select value={form.clientId} onChange={e => f('clientId', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30">
                <option value="">Select client...</option>
                {clients.map(c => <option key={c.clientId} value={c.clientId}>{c.clientName}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-500 text-foreground mb-1.5">Site <span className="text-red-500">*</span></label>
              <select value={form.siteId} onChange={e => f('siteId', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30">
                <option value="">Select site...</option>
                {filteredSites.map(s => <option key={s.siteId} value={s.siteId}>{s.siteName}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-500 text-foreground mb-1.5">Asset No. <span className="text-red-500">*</span></label>
              <input value={form.assetNo} onChange={e => f('assetNo', e.target.value)} placeholder="e.g. GEN-047"
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="block text-xs font-500 text-foreground mb-1.5">Status</label>
              <select value={form.status} onChange={e => f('status', e.target.value as GeneratorStatus)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30">
                {(['Active', 'In Repair', 'Standby', 'Decommissioned'] as GeneratorStatus[]).map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-500 text-foreground mb-1.5">Brand</label>
              <input value={form.brand} onChange={e => f('brand', e.target.value)} placeholder="e.g. Cummins"
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="block text-xs font-500 text-foreground mb-1.5">Model</label>
              <input value={form.model} onChange={e => f('model', e.target.value)} placeholder="e.g. C550 D5"
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="block text-xs font-500 text-foreground mb-1.5">Rated kW</label>
              <input type="number" min="0" value={form.ratedKw} onChange={e => f('ratedKw', Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="block text-xs font-500 text-foreground mb-1.5">Rated kVA</label>
              <input type="number" min="0" value={form.ratedKva} onChange={e => f('ratedKva', Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="block text-xs font-500 text-foreground mb-1.5">Engine Brand</label>
              <input value={form.engineBrand} onChange={e => f('engineBrand', e.target.value)} placeholder="e.g. Cummins"
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="block text-xs font-500 text-foreground mb-1.5">Engine Model</label>
              <input value={form.engineModel} onChange={e => f('engineModel', e.target.value)} placeholder="e.g. QSX15-G9"
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="block text-xs font-500 text-foreground mb-1.5">Engine Serial No.</label>
              <input value={form.engineSerialNo} onChange={e => f('engineSerialNo', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="block text-xs font-500 text-foreground mb-1.5">Fuel Type</label>
              <select value={form.fuelType} onChange={e => f('fuelType', e.target.value as FuelType)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30">
                {(['Diesel', 'Natural Gas', 'Dual Fuel'] as FuelType[]).map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-500 text-foreground mb-1.5">Current Running Hours</label>
              <input type="number" min="0" value={form.currentRunningHours} onChange={e => f('currentRunningHours', Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="block text-xs font-500 text-foreground mb-1.5">PMS Interval (hours)</label>
              <input type="number" min="0" value={form.pmsIntervalHours} onChange={e => f('pmsIntervalHours', Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="block text-xs font-500 text-foreground mb-1.5">Installation Date</label>
              <input value={form.installationDate} onChange={e => f('installationDate', e.target.value)} placeholder="e.g. 15 Mar 2021"
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="block text-xs font-500 text-foreground mb-1.5">Sync Capable</label>
              <select value={form.synchronizingCapable} onChange={e => f('synchronizingCapable', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30">
                <option>No</option>
                <option>Yes</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-500 text-foreground mb-1.5">Remarks</label>
              <input value={form.remarks} onChange={e => f('remarks', e.target.value)} placeholder="Optional notes"
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center">
          <div className="absolute inset-0 bg-foreground/40" onClick={!deleting ? () => setDeleteConfirm(null) : undefined} />
          <div className="relative bg-card border border-border rounded-2xl shadow-modal w-full max-w-md mx-4 p-6">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <Icon name="TrashIcon" size={20} className="text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-700 text-foreground mb-1">Delete Generator</h3>
                <p className="text-sm text-muted-foreground">Delete <span className="font-600 text-foreground">{deleteConfirm.assetNo} — {deleteConfirm.brand} {deleteConfirm.model}</span>? Generators with service history cannot be deleted.</p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3">
              <button onClick={() => setDeleteConfirm(null)} disabled={deleting} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} disabled={deleting}
                className="flex items-center gap-2 bg-red-600 text-white text-sm font-500 px-5 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-60">
                {deleting ? <><Icon name="ArrowPathIcon" size={14} className="animate-spin" />Deleting...</> : 'Delete Generator'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SpecSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-600 text-muted-foreground uppercase tracking-wide mb-2">{title}</p>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="text-xs text-muted-foreground flex-shrink-0">{label}</span>
      <span className="text-xs font-500 text-foreground text-right">{value || '—'}</span>
    </div>
  );
}
