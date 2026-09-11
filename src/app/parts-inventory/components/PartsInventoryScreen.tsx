'use client';

import React, { useState, useMemo } from 'react';
import Icon from '@/components/ui/AppIcon';

import EmptyState from '@/components/ui/EmptyState';
import Modal from '@/components/ui/Modal';

export type ReorderStatus = 'OK' | 'Low Stock' | 'Critical' | 'Out of Stock';

export interface SparePart {
  id: string;
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

const mockParts: SparePart[] = [
  { id: 'pt-001', partNo: 'CUM-3401544', partDescription: 'Engine Oil Filter', brand: 'Cummins', applicableEngine: 'Cummins 6BT / 6CT / QSB', supplier: 'Cummins Philippines', unit: 'pc', unitCost: 850, sellingPrice: 1200, stockQty: 24, minimumStock: 10, storageLocation: 'Shelf A-1', reorderStatus: 'OK', remarks: '' },
  { id: 'pt-002', partNo: 'CUM-3315843', partDescription: 'Fuel Filter Primary', brand: 'Cummins', applicableEngine: 'Cummins KTA38 / QSK78', supplier: 'Cummins Philippines', unit: 'pc', unitCost: 1200, sellingPrice: 1800, stockQty: 6, minimumStock: 8, storageLocation: 'Shelf A-2', reorderStatus: 'Low Stock', remarks: 'Reorder ASAP' },
  { id: 'pt-003', partNo: 'MIT-ME013262', partDescription: 'Air Filter Element', brand: 'Mitsubishi', applicableEngine: 'Mitsubishi S12R / S16R', supplier: 'Mitsubishi Heavy Industries', unit: 'pc', unitCost: 2400, sellingPrice: 3500, stockQty: 3, minimumStock: 5, storageLocation: 'Shelf B-1', reorderStatus: 'Critical', remarks: 'Long lead time — 2 weeks' },
  { id: 'pt-004', partNo: 'CUM-3803619', partDescription: 'Water Pump Seal Kit', brand: 'Cummins', applicableEngine: 'Cummins QST30 / QSK78', supplier: 'Cummins Philippines', unit: 'set', unitCost: 3800, sellingPrice: 5500, stockQty: 12, minimumStock: 4, storageLocation: 'Shelf C-3', reorderStatus: 'OK', remarks: '' },
  { id: 'pt-005', partNo: 'GEN-BELT-001', partDescription: 'V-Belt Fan Drive', brand: 'Gates', applicableEngine: 'Universal / Multi-brand', supplier: 'Gates Philippines', unit: 'pc', unitCost: 650, sellingPrice: 950, stockQty: 0, minimumStock: 6, storageLocation: 'Shelf A-4', reorderStatus: 'Out of Stock', remarks: 'Ordered — ETA 3 days' },
  { id: 'pt-006', partNo: 'CUM-3803698', partDescription: 'Coolant Hose Upper Radiator', brand: 'Cummins', applicableEngine: 'Cummins C550 / KTA38', supplier: 'Cummins Philippines', unit: 'pc', unitCost: 1800, sellingPrice: 2600, stockQty: 8, minimumStock: 4, storageLocation: 'Shelf B-2', reorderStatus: 'OK', remarks: '' },
  { id: 'pt-007', partNo: 'MIT-ME013300', partDescription: 'Fuel Injection Nozzle', brand: 'Mitsubishi', applicableEngine: 'Mitsubishi S6A3 / S12R', supplier: 'Mitsubishi Heavy Industries', unit: 'pc', unitCost: 8500, sellingPrice: 12000, stockQty: 4, minimumStock: 2, storageLocation: 'Shelf D-1', reorderStatus: 'OK', remarks: 'High-value item' },
  { id: 'pt-008', partNo: 'BAT-12V-200AH', partDescription: 'Battery 12V 200AH', brand: 'Motolite', applicableEngine: 'Universal', supplier: 'Motolite Marketing Corp.', unit: 'pc', unitCost: 6500, sellingPrice: 9000, stockQty: 5, minimumStock: 4, storageLocation: 'Shelf E-1', reorderStatus: 'OK', remarks: '' },
  { id: 'pt-009', partNo: 'CUM-3803456', partDescription: 'Lube Oil (15W-40) 4L', brand: 'Cummins Valvoline', applicableEngine: 'Cummins All Models', supplier: 'Cummins Philippines', unit: 'gal', unitCost: 1100, sellingPrice: 1600, stockQty: 40, minimumStock: 20, storageLocation: 'Shelf A-5', reorderStatus: 'OK', remarks: '' },
  { id: 'pt-010', partNo: 'MIT-ME013400', partDescription: 'Turbocharger Gasket Set', brand: 'Mitsubishi', applicableEngine: 'Mitsubishi S16R', supplier: 'Mitsubishi Heavy Industries', unit: 'set', unitCost: 4200, sellingPrice: 6000, stockQty: 2, minimumStock: 2, storageLocation: 'Shelf D-2', reorderStatus: 'Low Stock', remarks: '' },
  { id: 'pt-011', partNo: 'AVR-SX460-001', partDescription: 'AVR Module SX460', brand: 'Stamford', applicableEngine: 'Stamford Alternator', supplier: 'Newage Stamford Philippines', unit: 'pc', unitCost: 12000, sellingPrice: 17500, stockQty: 3, minimumStock: 2, storageLocation: 'Shelf F-1', reorderStatus: 'OK', remarks: 'Sensitive electronic component' },
  { id: 'pt-012', partNo: 'CUM-3803700', partDescription: 'Fuel Filter Secondary', brand: 'Cummins', applicableEngine: 'Cummins QSB / QSC', supplier: 'Cummins Philippines', unit: 'pc', unitCost: 950, sellingPrice: 1400, stockQty: 15, minimumStock: 8, storageLocation: 'Shelf A-3', reorderStatus: 'OK', remarks: '' },
];

const emptyPart: Omit<SparePart, 'id'> = {
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
  const [parts, setParts] = useState<SparePart[]>(mockParts);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterBrand, setFilterBrand] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editPart, setEditPart] = useState<SparePart | null>(null);
  const [detailPart, setDetailPart] = useState<SparePart | null>(null);
  const [form, setForm] = useState<Omit<SparePart, 'id'>>(emptyPart);
  const [sortCol, setSortCol] = useState<keyof SparePart>('partNo');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

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
    setModalOpen(true);
  };

  const openEdit = (p: SparePart) => {
    setEditPart(p);
    setForm({ ...p });
    setModalOpen(true);
    setDetailPart(null);
  };

  const handleSave = () => {
    const reorderStatus = computeReorderStatus(form.stockQty, form.minimumStock);
    if (editPart) {
      setParts(prev => prev.map(p => p.id === editPart.id ? { ...form, id: editPart.id, reorderStatus } : p));
    } else {
      const newPart: SparePart = { ...form, id: `pt-${Date.now()}`, reorderStatus };
      setParts(prev => [newPart, ...prev]);
    }
    setModalOpen(false);
  };

  const handleDelete = (id: string) => {
    setParts(prev => prev.filter(p => p.id !== id));
    if (detailPart?.id === id) setDetailPart(null);
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
      <button type="button" onClick={handleSave} className="flex items-center gap-2 bg-primary text-primary-foreground text-sm font-500 px-5 py-2 rounded-lg hover:bg-primary/90 active:scale-95 transition-all duration-150">
        <Icon name="CheckIcon" size={15} />
        {editPart ? 'Update Part' : 'Add Part'}
      </button>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-600 text-foreground">Parts Inventory</h1>
          <p className="text-xs text-muted-foreground mt-1">{parts.length} parts registered · Updated 11 Sep 2026</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-primary text-primary-foreground text-sm font-500 px-4 py-2 rounded-lg hover:bg-primary/90 active:scale-95 transition-all duration-150 flex-shrink-0">
          <Icon name="PlusIcon" size={16} />
          Add Part
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
          <input
            type="text"
            placeholder="Search part no., description, brand, engine..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-muted/40 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
          />
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
                <tr><td colSpan={12}><EmptyState icon="ArchiveBoxIcon" title="No parts found" description="Try adjusting your search or filters." /></td></tr>
              ) : sorted.map(p => (
                <tr key={p.id} onClick={() => setDetailPart(p)} className={`border-b border-border/50 hover:bg-muted/30 cursor-pointer transition-colors ${rowBg[p.reorderStatus]}`}>
                  <td className="px-3 py-3 text-xs font-600 text-foreground font-mono">{p.partNo}</td>
                  <td className="px-3 py-3 text-xs text-foreground max-w-[200px]">
                    <p className="truncate font-500">{p.partDescription}</p>
                  </td>
                  <td className="px-3 py-3 text-xs text-foreground">{p.brand}</td>
                  <td className="px-3 py-3 text-xs text-muted-foreground max-w-[160px]"><p className="truncate">{p.applicableEngine}</p></td>
                  <td className="px-3 py-3 text-xs text-muted-foreground">{p.unit}</td>
                  <td className="px-3 py-3 text-xs text-foreground font-mono">₱{p.unitCost.toLocaleString()}</td>
                  <td className="px-3 py-3 text-xs text-foreground font-mono">₱{p.sellingPrice.toLocaleString()}</td>
                  <td className="px-3 py-3 text-xs font-700 text-foreground">{p.stockQty}</td>
                  <td className="px-3 py-3 text-xs text-muted-foreground">{p.minimumStock}</td>
                  <td className="px-3 py-3 text-xs text-muted-foreground">{p.storageLocation}</td>
                  <td className="px-3 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-600 border ${statusColor[p.reorderStatus]}`}>{p.reorderStatus}</span>
                  </td>
                  <td className="px-3 py-3 text-right" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(p)} className="p-1.5 rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors" title="Edit"><Icon name="PencilSquareIcon" size={14} /></button>
                      <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-md hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors" title="Delete"><Icon name="TrashIcon" size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2.5 border-t border-border bg-muted/20 flex items-center justify-between">
          <p className="text-2xs text-muted-foreground">{sorted.length} of {parts.length} parts</p>
          <p className="text-2xs text-muted-foreground">Click a row to view details</p>
        </div>
      </div>

      {/* Detail Drawer */}
      {detailPart && (
        <>
          <div className="fixed inset-0 bg-foreground/20 z-40 fade-in" onClick={() => setDetailPart(null)} />
          <div className="fixed right-0 top-0 h-full w-full max-w-md bg-card border-l border-border shadow-modal z-50 flex flex-col slide-up overflow-hidden">
            <div className="flex items-start justify-between px-6 py-4 border-b border-border flex-shrink-0">
              <div>
                <h2 className="text-base font-700 text-foreground">{detailPart.partDescription}</h2>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">{detailPart.partNo}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => openEdit(detailPart)} className="flex items-center gap-1.5 text-xs font-500 text-primary hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors">
                  <Icon name="PencilSquareIcon" size={14} /> Edit
                </button>
                <button onClick={() => setDetailPart(null)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-colors"><Icon name="XMarkIcon" size={18} /></button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-5 space-y-5">
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-600 border ${statusColor[detailPart.reorderStatus]}`}>{detailPart.reorderStatus}</span>
              </div>
              <div>
                <p className="text-2xs font-600 uppercase tracking-wider text-muted-foreground mb-2.5">Part Information</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  {[
                    { label: 'Brand', value: detailPart.brand },
                    { label: 'Unit', value: detailPart.unit },
                    { label: 'Applicable Engine', value: detailPart.applicableEngine },
                    { label: 'Supplier', value: detailPart.supplier },
                    { label: 'Storage Location', value: detailPart.storageLocation },
                  ].map(f => (
                    <div key={f.label}>
                      <p className="text-2xs text-muted-foreground font-500 mb-0.5">{f.label}</p>
                      <p className="text-xs text-foreground font-500">{f.value || '—'}</p>
                    </div>
                  ))}
                </div>
              </div>
              <hr className="border-border" />
              <div>
                <p className="text-2xs font-600 uppercase tracking-wider text-muted-foreground mb-2.5">Stock & Pricing</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted/40 rounded-xl p-3 text-center">
                    <p className="text-2xl font-700 text-foreground">{detailPart.stockQty}</p>
                    <p className="text-2xs text-muted-foreground mt-0.5">Current Stock</p>
                  </div>
                  <div className="bg-muted/40 rounded-xl p-3 text-center">
                    <p className="text-2xl font-700 text-muted-foreground">{detailPart.minimumStock}</p>
                    <p className="text-2xs text-muted-foreground mt-0.5">Minimum Stock</p>
                  </div>
                  <div className="bg-muted/40 rounded-xl p-3 text-center">
                    <p className="text-lg font-700 text-foreground">₱{detailPart.unitCost.toLocaleString()}</p>
                    <p className="text-2xs text-muted-foreground mt-0.5">Unit Cost</p>
                  </div>
                  <div className="bg-muted/40 rounded-xl p-3 text-center">
                    <p className="text-lg font-700 text-primary">₱{detailPart.sellingPrice.toLocaleString()}</p>
                    <p className="text-2xs text-muted-foreground mt-0.5">Selling Price</p>
                  </div>
                </div>
              </div>
              {detailPart.remarks && (
                <div>
                  <p className="text-2xs font-600 uppercase tracking-wider text-muted-foreground mb-2">Remarks</p>
                  <p className="text-xs text-foreground leading-relaxed bg-amber-50/50 border border-amber-100 rounded-lg p-3">{detailPart.remarks}</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editPart ? 'Edit Part' : 'Add New Part'} subtitle="Fill in all part details from the inventory record" size="lg" footer={modalFooter}>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Part No. *" value={form.partNo} onChange={v => setForm(f => ({ ...f, partNo: v }))} placeholder="e.g. CUM-3401544" />
          <FormField label="Part Description *" value={form.partDescription} onChange={v => setForm(f => ({ ...f, partDescription: v }))} placeholder="e.g. Engine Oil Filter" />
          <FormField label="Brand" value={form.brand} onChange={v => setForm(f => ({ ...f, brand: v }))} placeholder="e.g. Cummins" />
          <FormField label="Applicable Engine / Model" value={form.applicableEngine} onChange={v => setForm(f => ({ ...f, applicableEngine: v }))} placeholder="e.g. Cummins 6BT / 6CT" />
          <FormField label="Supplier" value={form.supplier} onChange={v => setForm(f => ({ ...f, supplier: v }))} placeholder="e.g. Cummins Philippines" />
          <div>
            <label className="block text-xs font-500 text-muted-foreground mb-1.5">Unit</label>
            <select value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} className="w-full text-sm bg-muted/40 border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground">
              {['pc', 'set', 'gal', 'ltr', 'kg', 'box', 'roll', 'pair'].map(u => <option key={u}>{u}</option>)}
            </select>
          </div>
          <FormField label="Unit Cost (₱)" value={String(form.unitCost)} onChange={v => setForm(f => ({ ...f, unitCost: Number(v) || 0 }))} type="number" placeholder="0" />
          <FormField label="Selling Price (₱)" value={String(form.sellingPrice)} onChange={v => setForm(f => ({ ...f, sellingPrice: Number(v) || 0 }))} type="number" placeholder="0" />
          <FormField label="Stock Qty" value={String(form.stockQty)} onChange={v => setForm(f => ({ ...f, stockQty: Number(v) || 0 }))} type="number" placeholder="0" />
          <FormField label="Minimum Stock" value={String(form.minimumStock)} onChange={v => setForm(f => ({ ...f, minimumStock: Number(v) || 0 }))} type="number" placeholder="0" />
          <FormField label="Storage Location" value={form.storageLocation} onChange={v => setForm(f => ({ ...f, storageLocation: v }))} placeholder="e.g. Shelf A-1" />
          <div className="col-span-2">
            <label className="block text-xs font-500 text-muted-foreground mb-1.5">Remarks</label>
            <textarea value={form.remarks} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))} rows={2} placeholder="Optional notes..." className="w-full text-sm bg-muted/40 border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none text-foreground" />
          </div>
        </div>
      </Modal>
    </div>
  );
}

function FormField({ label, value, onChange, placeholder, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <div>
      <label className="block text-xs font-500 text-muted-foreground mb-1.5">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full text-sm bg-muted/40 border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground" />
    </div>
  );
}
