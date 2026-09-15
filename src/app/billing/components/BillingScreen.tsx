'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Icon from '@/components/ui/AppIcon';

import EmptyState from '@/components/ui/EmptyState';
import Modal from '@/components/ui/Modal';

export type BillingStatus = 'Unpaid' | 'Partial' | 'Paid' | 'Cancelled';

export interface BillingRecord {
  id: string;
  transactionId: string;
  jobOrderNo: string;
  clientId: string;
  quotationNo: string;
  quotationDate: string;
  invoiceNo: string;
  invoiceDate: string;
  labor: number;
  parts: number;
  transportation: number;
  accommodation: number;
  otherCharges: number;
  discount: number;
  totalAmount: number;
  billingStatus: BillingStatus;
  paymentDate: string;
  remarks: string;
}

const emptyRecord: Omit<BillingRecord, 'id' | 'transactionId'> = {
  jobOrderNo: '', clientId: '', quotationNo: '', quotationDate: '',
  invoiceNo: '', invoiceDate: '', labor: 0, parts: 0, transportation: 0,
  accommodation: 0, otherCharges: 0, discount: 0, totalAmount: 0,
  billingStatus: 'Unpaid', paymentDate: '', remarks: '',
};

const statusColors: Record<BillingStatus, string> = {
  Unpaid: 'bg-red-100 text-red-700 border-red-200',
  Partial: 'bg-amber-100 text-amber-700 border-amber-200',
  Paid: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Cancelled: 'bg-gray-100 text-gray-500 border-gray-200',
};

function fmt(n: number) {
  return `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
}

export default function BillingScreen() {
  const [records, setRecords] = useState<BillingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<BillingRecord | null>(null);
  const [detailRecord, setDetailRecord] = useState<BillingRecord | null>(null);
  const [form, setForm] = useState(emptyRecord);
  const [saving, setSaving] = useState(false);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      setError(null);
      let res = await fetch('/api/billing');
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Server error ${res.status}`);
      }
      const data = await res.json();
      setRecords(data);
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to load billing records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRecords(); }, []);

  const filtered = useMemo(() => {
    return records.filter(r => {
      if (search) {
        const q = search.toLowerCase();
        if (!r.jobOrderNo.toLowerCase().includes(q) &&
            !r.invoiceNo.toLowerCase().includes(q) &&
            !r.quotationNo.toLowerCase().includes(q) &&
            !r.clientId.toLowerCase().includes(q)) return false;
      }
      if (filterStatus && r.billingStatus !== filterStatus) return false;
      return true;
    });
  }, [records, search, filterStatus]);

  const kpis = useMemo(() => {
    const total = records.reduce((s, r) => s + r.totalAmount, 0);
    const paid = records.filter(r => r.billingStatus === 'Paid').reduce((s, r) => s + r.totalAmount, 0);
    const unpaid = records.filter(r => r.billingStatus === 'Unpaid').reduce((s, r) => s + r.totalAmount, 0);
    const partial = records.filter(r => r.billingStatus === 'Partial').reduce((s, r) => s + r.totalAmount, 0);
    return { total, paid, unpaid, partial, count: records.length };
  }, [records]);

  const computeTotal = (f: typeof form) =>
    (f.labor || 0) + (f.parts || 0) + (f.transportation || 0) +
    (f.accommodation || 0) + (f.otherCharges || 0) - (f.discount || 0);

  const openCreate = () => {
    setEditRecord(null);
    setForm(emptyRecord);
    setModalOpen(true);
  };

  const openEdit = (r: BillingRecord) => {
    setEditRecord(r);
    setForm({ ...r });
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...form, totalAmount: computeTotal(form) };
      let res: Response;
      if (editRecord) {
        res = await fetch(`/api/billing/${editRecord.transactionId}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/billing', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
        });
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Server error ${res.status}`);
      }
      await fetchRecords();
      setModalOpen(false);
    } catch (err: unknown) {
      alert((err as Error).message || 'Failed to save billing record');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (transactionId: string) => {
    if (!confirm('Delete this billing record?')) return;
    await fetch(`/api/billing/${transactionId}`, { method: 'DELETE' });
    await fetchRecords();
    if (detailRecord?.transactionId === transactionId) setDetailRecord(null);
  };

  const handleStatusChange = async (r: BillingRecord, status: BillingStatus) => {
    await fetch(`/api/billing/${r.transactionId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...r, billingStatus: status }),
    });
    await fetchRecords();
  };

  return (
    <div className="flex h-full">
      {/* Main panel */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-200 ${detailRecord ? 'mr-0' : ''}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
          <div>
            <h1 className="text-lg font-600 text-foreground">Billing & Invoicing</h1>
            <p className="text-xs text-muted-foreground mt-0.5">{records.length} transaction{records.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-500 hover:bg-primary/90 transition-colors">
            <Icon name="PlusIcon" size={16} />
            New Invoice
          </button>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 px-6 py-4 border-b border-border bg-muted/30">
          {[
            { label: 'Total Billed', value: fmt(kpis.total), icon: 'DocumentTextIcon', color: 'text-primary' },
            { label: 'Collected', value: fmt(kpis.paid), icon: 'CheckCircleIcon', color: 'text-emerald-600' },
            { label: 'Outstanding', value: fmt(kpis.unpaid), icon: 'ExclamationCircleIcon', color: 'text-red-600' },
            { label: 'Partial', value: fmt(kpis.partial), icon: 'ClockIcon', color: 'text-amber-600' },
          ].map(k => (
            <div key={k.label} className="bg-card rounded-lg border border-border px-4 py-3 flex items-center gap-3">
              <Icon name={k.icon as Parameters<typeof Icon>[0]['name']} size={20} className={k.color} />
              <div>
                <p className="text-xs text-muted-foreground">{k.label}</p>
                <p className={`text-sm font-600 ${k.color}`}>{k.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 px-6 py-3 border-b border-border bg-card">
          <div className="relative flex-1 max-w-xs">
            <Icon name="MagnifyingGlassIcon" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search invoice, job, client..."
              className="w-full pl-8 pr-3 py-1.5 text-sm bg-muted border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="text-sm bg-muted border border-border rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary">
            <option value="">All Statuses</option>
            {(['Unpaid', 'Partial', 'Paid', 'Cancelled'] as BillingStatus[]).map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">Loading...</div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3">
              <Icon name="ExclamationCircleIcon" size={32} className="text-red-500" />
              <p className="text-sm font-500 text-foreground">{error}</p>
              <button onClick={fetchRecords} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-500 hover:bg-primary/90 transition-colors">
                <Icon name="ArrowPathIcon" size={14} />Retry
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState icon="DocumentCurrencyDollarIcon" title="No billing records" description="Create your first invoice to get started." />
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm border-b border-border">
                <tr>
                  {['Invoice No.', 'Job Order', 'Quotation No.', 'Invoice Date', 'Total Amount', 'Status', 'Payment Date', ''].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-600 text-muted-foreground whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(r => (
                  <tr key={r.transactionId} onClick={() => setDetailRecord(r)}
                    className="hover:bg-muted/50 cursor-pointer transition-colors">
                    <td className="px-4 py-3 font-500 text-foreground whitespace-nowrap">
                      {r.invoiceNo || <span className="text-muted-foreground italic">No invoice yet</span>}
                    </td>
                    <td className="px-4 py-3 text-primary font-500 whitespace-nowrap">{r.jobOrderNo}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{r.quotationNo || '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{r.invoiceDate || '—'}</td>
                    <td className="px-4 py-3 font-600 text-foreground whitespace-nowrap">{fmt(r.totalAmount)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-500 border ${statusColors[r.billingStatus]}`}>
                        {r.billingStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{r.paymentDate || '—'}</td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(r)} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                          <Icon name="PencilIcon" size={14} />
                        </button>
                        <button onClick={() => handleDelete(r.transactionId)} className="p-1.5 rounded hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors">
                          <Icon name="TrashIcon" size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Detail Drawer */}
      {detailRecord && (
        <div className="w-96 border-l border-border bg-card flex flex-col flex-shrink-0">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h2 className="font-600 text-sm text-foreground">Invoice Detail</h2>
            <button onClick={() => setDetailRecord(null)} className="p-1 rounded hover:bg-muted text-muted-foreground">
              <Icon name="XMarkIcon" size={16} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-500 border ${statusColors[detailRecord.billingStatus]}`}>
                {detailRecord.billingStatus}
              </span>
              <div className="flex gap-1">
                {(['Unpaid', 'Partial', 'Paid'] as BillingStatus[]).map(s => (
                  <button key={s} onClick={() => { handleStatusChange(detailRecord, s); setDetailRecord({ ...detailRecord, billingStatus: s }); }}
                    className={`px-2 py-1 text-xs rounded border transition-colors ${detailRecord.billingStatus === s ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Row label="Invoice No." value={detailRecord.invoiceNo || '—'} />
              <Row label="Invoice Date" value={detailRecord.invoiceDate || '—'} />
              <Row label="Quotation No." value={detailRecord.quotationNo || '—'} />
              <Row label="Quotation Date" value={detailRecord.quotationDate || '—'} />
              <Row label="Job Order" value={detailRecord.jobOrderNo} />
              <Row label="Payment Date" value={detailRecord.paymentDate || '—'} />
            </div>

            <div className="border border-border rounded-lg overflow-hidden">
              <div className="bg-muted px-3 py-2 text-xs font-600 text-muted-foreground uppercase tracking-wide">Breakdown</div>
              <div className="divide-y divide-border">
                {[
                  { label: 'Labor', value: detailRecord.labor },
                  { label: 'Parts', value: detailRecord.parts },
                  { label: 'Transportation', value: detailRecord.transportation },
                  { label: 'Accommodation', value: detailRecord.accommodation },
                  { label: 'Other Charges', value: detailRecord.otherCharges },
                  { label: 'Discount', value: -detailRecord.discount },
                ].map(item => (
                  <div key={item.label} className="flex justify-between px-3 py-2 text-sm">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className={item.value < 0 ? 'text-red-600' : 'text-foreground'}>{fmt(Math.abs(item.value))}</span>
                  </div>
                ))}
                <div className="flex justify-between px-3 py-2.5 bg-muted/50 font-600">
                  <span className="text-foreground">Total</span>
                  <span className="text-primary text-base">{fmt(detailRecord.totalAmount)}</span>
                </div>
              </div>
            </div>

            {detailRecord.remarks && (
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs font-600 text-muted-foreground mb-1">Remarks</p>
                <p className="text-sm text-foreground">{detailRecord.remarks}</p>
              </div>
            )}
          </div>
          <div className="border-t border-border p-3 flex gap-2">
            <button onClick={() => openEdit(detailRecord)} className="flex-1 flex items-center justify-center gap-2 py-2 border border-border rounded-lg text-sm hover:bg-muted transition-colors">
              <Icon name="PencilIcon" size={14} /> Edit
            </button>
            <button onClick={() => handleDelete(detailRecord.transactionId)} className="flex items-center justify-center gap-2 px-3 py-2 border border-red-200 text-red-600 rounded-lg text-sm hover:bg-red-50 transition-colors">
              <Icon name="TrashIcon" size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editRecord ? 'Edit Billing Record' : 'New Invoice / Quotation'} size="lg">
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Job Order No. *" value={form.jobOrderNo} onChange={v => setForm(f => ({ ...f, jobOrderNo: v }))} placeholder="JO-2026-0001" />
            <Field label="Client ID" value={form.clientId} onChange={v => setForm(f => ({ ...f, clientId: v }))} placeholder="cli-001" />
            <Field label="Quotation No." value={form.quotationNo} onChange={v => setForm(f => ({ ...f, quotationNo: v }))} placeholder="QT-2026-0001" />
            <Field label="Quotation Date" value={form.quotationDate} onChange={v => setForm(f => ({ ...f, quotationDate: v }))} type="date" />
            <Field label="Invoice No." value={form.invoiceNo} onChange={v => setForm(f => ({ ...f, invoiceNo: v }))} placeholder="INV-2026-0001" />
            <Field label="Invoice Date" value={form.invoiceDate} onChange={v => setForm(f => ({ ...f, invoiceDate: v }))} type="date" />
          </div>

          <div className="border-t border-border pt-3">
            <p className="text-xs font-600 text-muted-foreground uppercase tracking-wide mb-3">Cost Breakdown (₱)</p>
            <div className="grid grid-cols-2 gap-3">
              <NumField label="Labor" value={form.labor} onChange={v => setForm(f => ({ ...f, labor: v }))} />
              <NumField label="Parts" value={form.parts} onChange={v => setForm(f => ({ ...f, parts: v }))} />
              <NumField label="Transportation" value={form.transportation} onChange={v => setForm(f => ({ ...f, transportation: v }))} />
              <NumField label="Accommodation" value={form.accommodation} onChange={v => setForm(f => ({ ...f, accommodation: v }))} />
              <NumField label="Other Charges" value={form.otherCharges} onChange={v => setForm(f => ({ ...f, otherCharges: v }))} />
              <NumField label="Discount" value={form.discount} onChange={v => setForm(f => ({ ...f, discount: v }))} />
            </div>
            <div className="mt-3 flex justify-between items-center bg-muted rounded-lg px-4 py-2.5">
              <span className="text-sm font-600 text-foreground">Total Amount</span>
              <span className="text-base font-700 text-primary">{fmt(computeTotal(form))}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-500 text-muted-foreground mb-1">Billing Status</label>
              <select value={form.billingStatus} onChange={e => setForm(f => ({ ...f, billingStatus: e.target.value as BillingStatus }))}
                className="w-full text-sm bg-background border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary">
                {(['Unpaid', 'Partial', 'Paid', 'Cancelled'] as BillingStatus[]).map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <Field label="Payment Date" value={form.paymentDate} onChange={v => setForm(f => ({ ...f, paymentDate: v }))} type="date" />
          </div>

          <div>
            <label className="block text-xs font-500 text-muted-foreground mb-1">Remarks</label>
            <textarea value={form.remarks} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))}
              rows={2} className="w-full text-sm bg-background border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary resize-none" />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-border">
          <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving || !form.jobOrderNo}
            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50">
            {saving ? 'Saving...' : editRecord ? 'Update' : 'Create'}
          </button>
        </div>
      </Modal>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-500 text-foreground text-right">{value}</span>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <div>
      <label className="block text-xs font-500 text-muted-foreground mb-1">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full text-sm bg-background border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary" />
    </div>
  );
}

function NumField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="block text-xs font-500 text-muted-foreground mb-1">{label}</label>
      <input type="number" value={value} onChange={e => onChange(parseFloat(e.target.value) || 0)} min={0}
        className="w-full text-sm bg-background border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary" />
    </div>
  );
}
