'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Icon from '@/components/ui/AppIcon';
import EmptyState from '@/components/ui/EmptyState';
import Modal from '@/components/ui/Modal';


export type ReorderStatus = 'OK' | 'Low Stock' | 'Critical' | 'Out of Stock';

export interface SparePart {
  id: string;
  partId: string;
  partNo: string;
  partDescription: string;
  brand: string;
  applicableEngine: string;
  supplier: string;
  unit: string;
  unitCost: number;
  sellingPrice: number;
  stockQty: number;
  minimumStock: number;
  storageLocation: string;
  reorderStatus: ReorderStatus;
  remarks: string;
}

const emptyPart: Omit<SparePart, 'id' | 'partId'> = {
  partNo: '', partDescription: '', brand: '', applicableEngine: '', supplier: '',
  unit: 'pc', unitCost: 0, sellingPrice: 0, stockQty: 0, minimumStock: 0,
  storageLocation: '', reorderStatus: 'OK', remarks: '',
};

function computeReorderStatus(qty: number, min: number): ReorderStatus {
  if (qty === 0) return 'Out of Stock';
  if (qty < min * 0.5) return 'Critical';
  if (qty < min) return 'Low Stock';
  return 'OK';
}

export default function PartsInventoryScreen() {
  const [parts, setParts] = useState<SparePart[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterBrand, setFilterBrand] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editPart, setEditPart] = useState<SparePart | null>(null);
  const [detailPart, setDetailPart] = useState<SparePart | null>(null);
  const [form, setForm] = useState<Omit<SparePart, 'id' | 'partId'>>(emptyPart);
  const [sortCol, setSortCol] = useState<keyof SparePart>('partNo');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<SparePart | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchParts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let res = await fetch('/api/parts');
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Server error ${res.status}`);
      }
      const data = await res.json();
      setParts(data);
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to load parts inventory');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchParts(); }, [fetchParts]);

  const brands = useMemo(() => [...new Set(parts.map(p => p.brand))].sort(), [parts]);

  const filtered = useMemo(() => {
    return parts.filter(p => {
      if (search) {
        const q = search.toLowerCase();
        if (!p.partNo.toLowerCase().includes(q) && !p.partDescription.toLowerCase().includes(q) && !p.brand.toLowerCase().includes(q) && !p.applicableEngine.toLowerCase().includes(q) && !p.supplier.toLowerCase().includes(q)) return false;
      }
      if (filterStatus && p.reorderStatus !== filterStatus) return false;
      if (filterBrand && p.brand !== filterBrand) return false;
      return true;
    });
  }, [parts, search, filterStatus, filterBrand]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const av = a[sortCol] ?? '';
      const bv = b[sortCol] ?? '';
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filtered, sortCol, sortDir]);

  const handleSort = (col: keyof SparePart) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };

  const openCreate = () => {
    setEditPart(null);
    setForm(emptyPart);
    setSaveError(null);
    setModalOpen(true);
  };

  const openEdit = (p: SparePart) => {
    setEditPart(p);
    setForm({
      partNo: p.partNo, partDescription: p.partDescription, brand: p.brand,
      applicableEngine: p.applicableEngine, supplier: p.supplier, unit: p.unit,
      unitCost: p.unitCost, sellingPrice: p.sellingPrice, stockQty: p.stockQty,
      minimumStock: p.minimumStock, storageLocation: p.storageLocation,
      reorderStatus: p.reorderStatus, remarks: p.remarks,
    });
    setSaveError(null);
    setModalOpen(true);
    setDetailPart(null);
  };

  const handleSave = async () => {
    if (!form.partNo.trim() || !form.partDescription.trim()) {
      setSaveError('Part No. and Description are required.');
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const payload = { ...form, reorderStatus: computeReorderStatus(form.stockQty, form.minimumStock) };
      let res: Response;
      if (editPart) {
        res = await fetch(`/api/parts/${editPart.partId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/parts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Server error ${res.status}`);
      }
      await fetchParts();
      setModalOpen(false);
    } catch (err: unknown) {
      setSaveError((err as Error).message || 'Failed to save part');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (part: SparePart) => {
    setDeleting(true);
    try {
      let res = await fetch(`/api/parts/${part.partId}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Server error ${res.status}`);
      }
      await fetchParts();
      setDeleteConfirm(null);
      if (detailPart?.partId === part.partId) setDetailPart(null);
    } catch (err: unknown) {
      alert((err as Error).message || 'Failed to delete part');
    } finally {
      setDeleting(false);
    }
  };

  const kpiOk = parts.filter(p => p.reorderStatus === 'OK').length;
  const kpiLow = parts.filter(p => p.reorderStatus === 'Low Stock').length;
  const kpiCritical = parts.filter(p => p.reorderStatus === 'Critical').length;
  const kpiOut = parts.filter(p => p.reorderStatus === 'Out of Stock').length;

  const statusColor: Record<ReorderStatus, string> = {
    'OK': 'text-emerald-600 bg-emerald-50 border-emerald-200',
    'Low Stock': 'text-amber-600 bg-amber-50 border-amber-200',
    'Critical': 'text-orange-600 bg-orange-50 border-orange-200',
    'Out of Stock': 'text-red-600 bg-red-50 border-red-200',
  };

  const rowBg: Record<ReorderStatus, string> = {
    'OK': '',
    'Low Stock': 'bg-amber-50/30',
    'Critical': 'bg-orange-50/40',
    'Out of Stock': 'bg-red-50/40',
  };

  const modalFooter = (
    <div className="flex items-center justify-end gap-3 w-full">
      <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-muted transition-colors">Cancel</button>
      <button type="button" onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-primary text-primary-foreground text-sm font-500 px-5 py-2 rounded-lg hover:bg-primary/90 active:scale-95 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed">
        {saving ? <><Icon name="ArrowPathIcon" size={15} className="animate-spin" />Saving...</> : <><Icon name="CheckIcon" size={15} />{editPart ? 'Update Part' : 'Add Part'}</>}
      </button>
    </div>
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Icon name="ArrowPathIcon" size={32} className="animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading parts inventory...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Icon name="ExclamationCircleIcon" size={40} className="text-red-500" />
        <p className="text-base font-600 text-foreground">Failed to load parts inventory</p>
        <p className="text-sm text-muted-foreground">{error}</p>
        <button onClick={fetchParts} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-500 hover:bg-primary/90 transition-colors">
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
          <h1 className="text-2xl font-600 text-foreground">Parts Inventory</h1>
          <p className="text-xs text-muted-foreground mt-1">{parts.length} parts registered</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-primary text-primary-foreground text-sm font-500 px-4 py-2 rounded-lg hover:bg-primary/90 active:scale-95 transition-all duration-150 flex-shrink-0">
          <Icon name="PlusIcon" size={16} />Add Part
        </button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'In Stock (OK)', value: kpiOk, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: 'CheckCircleIcon' },
          { label: 'Low Stock', value: kpiLow, color: 'text-amber-600', bg: 'bg-amber-50', icon: 'ExclamationTriangleIcon' },
          { label: 'Critical', value: kpiCritical, color: 'text-orange-600', bg: 'bg-orange-50', icon: 'ExclamationCircleIcon' },
          { label: 'Out of Stock', value: kpiOut, color: 'text-red-600', bg: 'bg-red-50', icon: 'XCircleIcon' },
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
          <input type="text" placeholder="Search part no., description, brand, engine..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-muted/40 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="text-sm bg-muted/40 border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground">
          <option value="">All Statuses</option>
          <option>OK</option>
          <option>Low Stock</option>
          <option>Critical</option>
          <option>Out of Stock</option>
        </select>
        <select value={filterBrand} onChange={e => setFilterBrand(e.target.value)} className="text-sm bg-muted/40 border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground">
          <option value="">All Brands</option>
          {brands.map(b => <option key={b}>{b}</option>)}
        </select>
        {(search || filterStatus || filterBrand) && (
          <button onClick={() => { setSearch(''); setFilterStatus(''); setFilterBrand(''); }} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-muted transition-colors">
            <Icon name="XMarkIcon" size={13} /> Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full min-w-[1100px]">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {([
                  { key: 'partNo', label: 'Part No.' },
                  { key: 'partDescription', label: 'Description' },
                  { key: 'brand', label: 'Brand' },
                  { key: 'applicableEngine', label: 'Applicable Engine' },
                  { key: 'unit', label: 'Unit' },
                  { key: 'unitCost', label: 'Unit Cost' },
                  { key: 'sellingPrice', label: 'Selling Price' },
                  { key: 'stockQty', label: 'Stock Qty' },
                  { key: 'minimumStock', label: 'Min. Stock' },
                  { key: 'storageLocation', label: 'Location' },
                  { key: 'reorderStatus', label: 'Status' },
                ] as { key: keyof SparePart; label: string }[]).map(col => (
                  <th key={col.key} onClick={() => handleSort(col.key)} className="text-left px-3 py-3 text-2xs font-600 uppercase tracking-wider text-muted-foreground cursor-pointer hover:text-foreground select-none whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      {col.label}
                      {sortCol === col.key
                        ? <Icon name={sortDir === 'asc' ? 'ChevronUpIcon' : 'ChevronDownIcon'} size={11} className="text-primary" />
                        : <Icon name="ChevronUpDownIcon" size={11} className="text-muted-foreground/40" />}
                    </div>
                  </th>
                ))}
                <th className="px-3 py-3 text-right text-2xs font-600 uppercase tracking-wider text-muted-foreground w-20">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr><td colSpan={12}>
                  <EmptyState icon="ArchiveBoxIcon" title="No parts found" description="No parts match your filters, or no parts have been added yet."
                    action={{ label: 'Add Part', onClick: openCreate }} />
                </td></tr>
              ) : sorted.map((p, idx) => (
                <tr key={p.partId} className={`border-b border-border last:border-0 hover:bg-muted/40 transition-colors group ${rowBg[p.reorderStatus]} ${idx % 2 === 0 ? '' : ''}`}>
                  <td className="px-3 py-2.5">
                    <button onClick={() => setDetailPart(p)} className="text-xs font-600 text-primary hover:underline">{p.partNo}</button>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-foreground max-w-[200px] truncate">{p.partDescription}</td>
                  <td className="px-3 py-2.5 text-xs text-foreground">{p.brand}</td>
                  <td className="px-3 py-2.5 text-xs text-foreground max-w-[160px] truncate">{p.applicableEngine}</td>
                  <td className="px-3 py-2.5 text-xs text-foreground">{p.unit}</td>
                  <td className="px-3 py-2.5 text-xs text-foreground tabular-nums">₱{p.unitCost.toLocaleString()}</td>
                  <td className="px-3 py-2.5 text-xs text-foreground tabular-nums">₱{p.sellingPrice.toLocaleString()}</td>
                  <td className="px-3 py-2.5 text-xs font-600 text-foreground tabular-nums">{p.stockQty}</td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground tabular-nums">{p.minimumStock}</td>
                  <td className="px-3 py-2.5 text-xs text-foreground">{p.storageLocation}</td>
                  <td className="px-3 py-2.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-500 border ${statusColor[p.reorderStatus]}`}>{p.reorderStatus}</span>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(p)} title="Edit" className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"><Icon name="PencilSquareIcon" size={14} /></button>
                      <button onClick={() => setDeleteConfirm(p)} title="Delete" className="p-1.5 rounded-md hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors"><Icon name="TrashIcon" size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Panel */}
      {detailPart && (
        <div className="fixed inset-y-0 right-0 w-96 bg-card border-l border-border shadow-xl z-40 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h2 className="font-600 text-sm text-foreground">{detailPart.partNo}</h2>
            <button onClick={() => setDetailPart(null)} className="p-1 rounded hover:bg-muted text-muted-foreground"><Icon name="XMarkIcon" size={16} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <p className="text-sm font-500 text-foreground">{detailPart.partDescription}</p>
            <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-500 border ${statusColor[detailPart.reorderStatus]}`}>{detailPart.reorderStatus}</div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              {[
                { label: 'Brand', value: detailPart.brand },
                { label: 'Unit', value: detailPart.unit },
                { label: 'Unit Cost', value: `₱${detailPart.unitCost.toLocaleString()}` },
                { label: 'Selling Price', value: `₱${detailPart.sellingPrice.toLocaleString()}` },
                { label: 'Stock Qty', value: String(detailPart.stockQty) },
                { label: 'Min. Stock', value: String(detailPart.minimumStock) },
                { label: 'Location', value: detailPart.storageLocation },
                { label: 'Supplier', value: detailPart.supplier },
              ].map(row => (
                <div key={row.label}>
                  <p className="text-2xs font-600 uppercase tracking-wider text-muted-foreground">{row.label}</p>
                  <p className="text-xs text-foreground mt-0.5">{row.value || '—'}</p>
                </div>
              ))}
            </div>
            {detailPart.applicableEngine && (
              <div>
                <p className="text-2xs font-600 uppercase tracking-wider text-muted-foreground">Applicable Engine</p>
                <p className="text-xs text-foreground mt-0.5">{detailPart.applicableEngine}</p>
              </div>
            )}
            {detailPart.remarks && (
              <div>
                <p className="text-2xs font-600 uppercase tracking-wider text-muted-foreground">Remarks</p>
                <p className="text-xs text-foreground mt-0.5">{detailPart.remarks}</p>
              </div>
            )}
          </div>
          <div className="border-t border-border p-3 flex gap-2">
            <button onClick={() => openEdit(detailPart)} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-500 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
              <Icon name="PencilSquareIcon" size={13} />Edit
            </button>
            <button onClick={() => setDeleteConfirm(detailPart)} className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-500 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors">
              <Icon name="TrashIcon" size={13} />Delete
            </button>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}
        title={editPart ? `Edit Part — ${editPart.partNo}` : 'Add New Part'}
        subtitle={editPart ? 'Update part details and inventory quantities' : 'Enter part details to add to inventory'}
        size="lg" footer={modalFooter}>
        <div className="space-y-4">
          {saveError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 text-sm text-red-700">
              <Icon name="ExclamationCircleIcon" size={16} className="flex-shrink-0" />{saveError}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-500 text-foreground mb-1.5">Part No. <span className="text-red-500">*</span></label>
              <input value={form.partNo} onChange={e => setForm(p => ({ ...p, partNo: e.target.value }))} placeholder="e.g. CUM-3401544"
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="block text-xs font-500 text-foreground mb-1.5">Brand</label>
              <input value={form.brand} onChange={e => setForm(p => ({ ...p, brand: e.target.value }))} placeholder="e.g. Cummins"
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-500 text-foreground mb-1.5">Description <span className="text-red-500">*</span></label>
              <input value={form.partDescription} onChange={e => setForm(p => ({ ...p, partDescription: e.target.value }))} placeholder="e.g. Engine Oil Filter"
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-500 text-foreground mb-1.5">Applicable Engine</label>
              <input value={form.applicableEngine} onChange={e => setForm(p => ({ ...p, applicableEngine: e.target.value }))} placeholder="e.g. Cummins 6BT / 6CT"
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="block text-xs font-500 text-foreground mb-1.5">Supplier</label>
              <input value={form.supplier} onChange={e => setForm(p => ({ ...p, supplier: e.target.value }))} placeholder="Supplier name"
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="block text-xs font-500 text-foreground mb-1.5">Unit</label>
              <select value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30">
                {['pc', 'set', 'pail', 'drum', 'gal', 'liter', 'kg', 'box', 'roll'].map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-500 text-foreground mb-1.5">Unit Cost (₱)</label>
              <input type="number" min="0" value={form.unitCost} onChange={e => setForm(p => ({ ...p, unitCost: Number(e.target.value) }))}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="block text-xs font-500 text-foreground mb-1.5">Selling Price (₱)</label>
              <input type="number" min="0" value={form.sellingPrice} onChange={e => setForm(p => ({ ...p, sellingPrice: Number(e.target.value) }))}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="block text-xs font-500 text-foreground mb-1.5">Stock Qty</label>
              <input type="number" min="0" value={form.stockQty} onChange={e => setForm(p => ({ ...p, stockQty: Number(e.target.value) }))}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="block text-xs font-500 text-foreground mb-1.5">Minimum Stock</label>
              <input type="number" min="0" value={form.minimumStock} onChange={e => setForm(p => ({ ...p, minimumStock: Number(e.target.value) }))}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="block text-xs font-500 text-foreground mb-1.5">Storage Location</label>
              <input value={form.storageLocation} onChange={e => setForm(p => ({ ...p, storageLocation: e.target.value }))} placeholder="e.g. Shelf A-1"
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-500 text-foreground mb-1.5">Remarks</label>
              <input value={form.remarks} onChange={e => setForm(p => ({ ...p, remarks: e.target.value }))} placeholder="Optional notes"
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>
          <div className="bg-muted/30 rounded-lg px-3 py-2 text-xs text-muted-foreground">
            Reorder status will be automatically calculated based on stock qty vs minimum stock.
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
                <h3 className="text-base font-700 text-foreground mb-1">Delete Part</h3>
                <p className="text-sm text-muted-foreground">Delete <span className="font-600 text-foreground">{deleteConfirm.partNo} — {deleteConfirm.partDescription}</span>? This cannot be undone.</p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3">
              <button onClick={() => setDeleteConfirm(null)} disabled={deleting} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} disabled={deleting}
                className="flex items-center gap-2 bg-red-600 text-white text-sm font-500 px-5 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-60">
                {deleting ? <><Icon name="ArrowPathIcon" size={14} className="animate-spin" />Deleting...</> : 'Delete Part'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
