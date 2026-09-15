'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Icon from '@/components/ui/AppIcon';
import EmptyState from '@/components/ui/EmptyState';
import Modal from '@/components/ui/Modal';
import Link from 'next/link';

export type DeploymentStatus = 'Planned' | 'Deployed' | 'Returned' | 'Cancelled';

export interface Deployment {
  id: string;
  deploymentId: string;
  jobOrderNo: string;
  clientId: string;
  siteId: string;
  destination: string;
  technicianId: string;
  departureDate: string;
  returnDate: string;
  transportation: string;
  accommodation: string;
  purpose: string;
  status: DeploymentStatus;
  remarks: string;
}

const emptyDeployment: Omit<Deployment, 'id' | 'deploymentId'> = {
  jobOrderNo: '', clientId: '', siteId: '', destination: '',
  technicianId: '', departureDate: '', returnDate: '',
  transportation: 'Company Vehicle', accommodation: 'N/A',
  purpose: '', status: 'Planned', remarks: '',
};

const statusColors: Record<DeploymentStatus, string> = {
  Planned: 'bg-blue-100 text-blue-700 border-blue-200',
  Deployed: 'bg-amber-100 text-amber-700 border-amber-200',
  Returned: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Cancelled: 'bg-gray-100 text-gray-500 border-gray-200',
};

const statusIcons: Record<DeploymentStatus, string> = {
  Planned: 'CalendarDaysIcon',
  Deployed: 'TruckIcon',
  Returned: 'CheckCircleIcon',
  Cancelled: 'XCircleIcon',
};

export default function DeploymentsScreen() {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [technicians, setTechnicians] = useState<{ technicianId: string; technicianName: string; availability: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editDep, setEditDep] = useState<Deployment | null>(null);
  const [detailDep, setDetailDep] = useState<Deployment | null>(null);
  const [form, setForm] = useState(emptyDeployment);
  const [saving, setSaving] = useState(false);

  const fetchAll = async () => {
    try {
      setLoading(true);
      setError(null);
      const [dRes, tRes] = await Promise.all([
        fetch('/api/deployments'),
        fetch('/api/technicians'),
      ]);
      if (!dRes.ok) {
        const d = await dRes.json().catch(() => ({}));
        throw new Error(d.error || `Server error ${dRes.status}`);
      }
      setDeployments(await dRes.json());
      if (tRes.ok) setTechnicians(await tRes.json());
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to load deployments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const filtered = useMemo(() => {
    return deployments.filter(d => {
      if (search) {
        const q = search.toLowerCase();
        if (!d.jobOrderNo.toLowerCase().includes(q) &&
            !d.destination.toLowerCase().includes(q) &&
            !d.technicianId.toLowerCase().includes(q) &&
            !d.purpose.toLowerCase().includes(q)) return false;
      }
      if (filterStatus && d.status !== filterStatus) return false;
      return true;
    });
  }, [deployments, search, filterStatus]);

  const kpis = useMemo(() => ({
    total: deployments.length,
    planned: deployments.filter(d => d.status === 'Planned').length,
    deployed: deployments.filter(d => d.status === 'Deployed').length,
    returned: deployments.filter(d => d.status === 'Returned').length,
  }), [deployments]);

  const openCreate = () => { setEditDep(null); setForm(emptyDeployment); setModalOpen(true); };
  const openEdit = (d: Deployment) => { setEditDep(d); setForm({ ...d }); setModalOpen(true); };

  const handleSave = async () => {
    setSaving(true);
    try {
      let res: Response;
      if (editDep) {
        res = await fetch(`/api/deployments/${editDep.deploymentId}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
        });
      } else {
        res = await fetch('/api/deployments', {
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
      alert((err as Error).message || 'Failed to save deployment');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (deploymentId: string) => {
    if (!confirm('Delete this deployment?')) return;
    await fetch(`/api/deployments/${deploymentId}`, { method: 'DELETE' });
    await fetchAll();
    if (detailDep?.deploymentId === deploymentId) setDetailDep(null);
  };

  const handleStatusChange = async (d: Deployment, status: DeploymentStatus) => {
    await fetch(`/api/deployments/${d.deploymentId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...d, status }),
    });
    await fetchAll();
    if (detailDep?.deploymentId === d.deploymentId) setDetailDep({ ...d, status });
  };

  const getTechName = (id: string) => technicians.find(t => t.technicianId === id)?.technicianName || id;

  return (
    <div className="flex h-full">
      {/* Main panel */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
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
            <h1 className="text-lg font-600 text-foreground">Technician Deployments</h1>
            <p className="text-xs text-muted-foreground mt-0.5">{deployments.length} deployment{deployments.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-500 hover:bg-primary/90 transition-colors">
            <Icon name="PlusIcon" size={16} />
            New Deployment
          </button>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 px-6 py-4 border-b border-border bg-muted/30">
          {[
            { label: 'Total', value: kpis.total, icon: 'TruckIcon', color: 'text-primary' },
            { label: 'Planned', value: kpis.planned, icon: 'CalendarDaysIcon', color: 'text-blue-600' },
            { label: 'In Field', value: kpis.deployed, icon: 'MapPinIcon', color: 'text-amber-600' },
            { label: 'Returned', value: kpis.returned, icon: 'CheckCircleIcon', color: 'text-emerald-600' },
          ].map(k => (
            <div key={k.label} className="bg-card rounded-lg border border-border px-4 py-3 flex items-center gap-3">
              <Icon name={k.icon as Parameters<typeof Icon>[0]['name']} size={20} className={k.color} />
              <div>
                <p className="text-xs text-muted-foreground">{k.label}</p>
                <p className={`text-lg font-700 ${k.color}`}>{k.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 px-6 py-3 border-b border-border bg-card">
          <div className="relative flex-1 max-w-xs">
            <Icon name="MagnifyingGlassIcon" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search job, destination, technician..."
              className="w-full pl-8 pr-3 py-1.5 text-sm bg-muted border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="text-sm bg-muted border border-border rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary">
            <option value="">All Statuses</option>
            {(['Planned', 'Deployed', 'Returned', 'Cancelled'] as DeploymentStatus[]).map(s => (
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
              <button onClick={fetchAll} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-500 hover:bg-primary/90 transition-colors">
                <Icon name="ArrowPathIcon" size={14} />Retry
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState icon="TruckIcon" title="No deployments found" description="Create a deployment to dispatch technicians to field jobs." />
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm border-b border-border">
                <tr>
                  {['Deployment ID', 'Job Order', 'Technician', 'Destination', 'Departure', 'Return', 'Transport', 'Status', ''].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-600 text-muted-foreground whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(d => (
                  <tr key={d.deploymentId} onClick={() => setDetailDep(d)}
                    className="hover:bg-muted/50 cursor-pointer transition-colors">
                    <td className="px-4 py-3 font-500 text-foreground whitespace-nowrap">{d.deploymentId}</td>
                    <td className="px-4 py-3 text-primary font-500 whitespace-nowrap">{d.jobOrderNo}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-600">
                          {getTechName(d.technicianId).charAt(0)}
                        </div>
                        <span className="text-foreground">{getTechName(d.technicianId)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground max-w-[180px] truncate">{d.destination}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{d.departureDate}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{d.returnDate || '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{d.transportation}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-500 border ${statusColors[d.status]}`}>
                        <Icon name={statusIcons[d.status] as Parameters<typeof Icon>[0]['name']} size={11} />
                        {d.status}
                      </span>
                    </td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(d)} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                          <Icon name="PencilIcon" size={14} />
                        </button>
                        <button onClick={() => handleDelete(d.deploymentId)} className="p-1.5 rounded hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors">
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
      {detailDep && (
        <div className="w-96 border-l border-border bg-card flex flex-col flex-shrink-0">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h2 className="font-600 text-sm text-foreground">Deployment Detail</h2>
            <button onClick={() => setDetailDep(null)} className="p-1 rounded hover:bg-muted text-muted-foreground">
              <Icon name="XMarkIcon" size={16} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-500 border ${statusColors[detailDep.status]}`}>
                <Icon name={statusIcons[detailDep.status] as Parameters<typeof Icon>[0]['name']} size={12} />
                {detailDep.status}
              </span>
              <div className="flex gap-1">
                {(['Planned', 'Deployed', 'Returned'] as DeploymentStatus[]).map(s => (
                  <button key={s} onClick={() => handleStatusChange(detailDep, s)}
                    className={`px-2 py-1 text-xs rounded border transition-colors ${detailDep.status === s ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-700 text-sm">
                {getTechName(detailDep.technicianId).charAt(0)}
              </div>
              <div>
                <p className="font-600 text-sm text-foreground">{getTechName(detailDep.technicianId)}</p>
                <p className="text-xs text-muted-foreground">Lead Technician</p>
              </div>
            </div>

            <div className="space-y-2">
              <DRow label="Deployment ID" value={detailDep.deploymentId} />
              <DRow label="Job Order" value={detailDep.jobOrderNo} />
              <DRow label="Destination" value={detailDep.destination} />
              <DRow label="Departure Date" value={detailDep.departureDate} />
              <DRow label="Return Date" value={detailDep.returnDate || '—'} />
              <DRow label="Transportation" value={detailDep.transportation} />
              <DRow label="Accommodation" value={detailDep.accommodation} />
            </div>

            {detailDep.purpose && (
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs font-600 text-muted-foreground mb-1">Purpose</p>
                <p className="text-sm text-foreground">{detailDep.purpose}</p>
              </div>
            )}
            {detailDep.remarks && (
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs font-600 text-muted-foreground mb-1">Remarks</p>
                <p className="text-sm text-foreground">{detailDep.remarks}</p>
              </div>
            )}
          </div>
          <div className="border-t border-border p-3 flex gap-2">
            <button onClick={() => openEdit(detailDep)} className="flex-1 flex items-center justify-center gap-2 py-2 border border-border rounded-lg text-sm hover:bg-muted transition-colors">
              <Icon name="PencilIcon" size={14} /> Edit
            </button>
            <button onClick={() => handleDelete(detailDep.deploymentId)} className="flex items-center justify-center gap-2 px-3 py-2 border border-red-200 text-red-600 rounded-lg text-sm hover:bg-red-50 transition-colors">
              <Icon name="TrashIcon" size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editDep ? 'Edit Deployment' : 'New Deployment'} size="lg">
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-3">
            <DField label="Job Order No. *" value={form.jobOrderNo} onChange={v => setForm(f => ({ ...f, jobOrderNo: v }))} placeholder="JO-2026-0001" />
            <div>
              <label className="block text-xs font-500 text-muted-foreground mb-1">Technician *</label>
              <select value={form.technicianId} onChange={e => setForm(f => ({ ...f, technicianId: e.target.value }))}
                className="w-full text-sm bg-background border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary">
                <option value="">Select technician...</option>
                {technicians.map(t => (
                  <option key={t.technicianId} value={t.technicianId}>{t.technicianName}</option>
                ))}
              </select>
            </div>
            <DField label="Client ID" value={form.clientId} onChange={v => setForm(f => ({ ...f, clientId: v }))} placeholder="cli-001" />
            <DField label="Site ID" value={form.siteId} onChange={v => setForm(f => ({ ...f, siteId: v }))} placeholder="site-001" />
          </div>

          <DField label="Destination *" value={form.destination} onChange={v => setForm(f => ({ ...f, destination: v }))} placeholder="Site name, City" />

          <div className="grid grid-cols-2 gap-3">
            <DField label="Departure Date *" value={form.departureDate} onChange={v => setForm(f => ({ ...f, departureDate: v }))} type="date" />
            <DField label="Return Date" value={form.returnDate} onChange={v => setForm(f => ({ ...f, returnDate: v }))} type="date" />
            <DField label="Transportation" value={form.transportation} onChange={v => setForm(f => ({ ...f, transportation: v }))} placeholder="Company Vehicle" />
            <DField label="Accommodation" value={form.accommodation} onChange={v => setForm(f => ({ ...f, accommodation: v }))} placeholder="N/A" />
          </div>

          <div>
            <label className="block text-xs font-500 text-muted-foreground mb-1">Status</label>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as DeploymentStatus }))}
              className="w-full text-sm bg-background border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary">
              {(['Planned', 'Deployed', 'Returned', 'Cancelled'] as DeploymentStatus[]).map(s => <option key={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-500 text-muted-foreground mb-1">Purpose</label>
            <input value={form.purpose} onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))} placeholder="Describe the deployment purpose..."
              className="w-full text-sm bg-background border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>

          <div>
            <label className="block text-xs font-500 text-muted-foreground mb-1">Remarks</label>
            <textarea value={form.remarks} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))} rows={2}
              className="w-full text-sm bg-background border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary resize-none" />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-border">
          <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving || !form.jobOrderNo || !form.technicianId || !form.departureDate}
            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50">
            {saving ? 'Saving...' : editDep ? 'Update' : 'Create'}
          </button>
        </div>
      </Modal>
    </div>
  );
}

function DRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-500 text-foreground text-right max-w-[200px] truncate">{value}</span>
    </div>
  );
}

function DField({ label, value, onChange, placeholder, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <div>
      <label className="block text-xs font-500 text-muted-foreground mb-1">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full text-sm bg-background border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary" />
    </div>
  );
}
