'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Icon from '@/components/ui/AppIcon';
import StatusBadge from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';

export type ClientStatus = 'Active' | 'Inactive';
export type AccountType = 'Corporate' | 'Individual' | 'Government' | 'SME';
export type Industry =
  | 'Banking & Finance' | 'Real Estate' | 'Telecommunications' | 'Retail & Commercial' | 'Logistics & Ports' | 'Food & Beverage' | 'Healthcare' | 'Manufacturing' | 'Data Centers' | 'Other';

export interface SiteLocation {
  siteId: string;
  siteName: string;
  address: string;
  generatorCount: number;
}

export interface ServiceHistoryEntry {
  jobOrderNo: string;
  date: string;
  serviceType: string;
  status: string;
  technician: string;
  billingStatus: string;
}

export interface Client {
  id: string;
  clientId: string;
  clientName: string;
  accountType: AccountType;
  industry: Industry;
  primaryContact: string;
  contactNo: string;
  email: string;
  billingAddress: string;
  remarks: string;
  status: ClientStatus;
}

const accountTypes: AccountType[] = ['Corporate', 'Individual', 'Government', 'SME'];
const industries: Industry[] = [
  'Banking & Finance', 'Real Estate', 'Telecommunications', 'Retail & Commercial',
  'Logistics & Ports', 'Food & Beverage', 'Healthcare', 'Manufacturing', 'Data Centers', 'Other',
];

const emptyClient: Omit<Client, 'id' | 'clientId'> = {
  clientName: '',
  accountType: 'Corporate',
  industry: 'Other',
  primaryContact: '',
  contactNo: '',
  email: '',
  billingAddress: '',
  remarks: '',
  status: 'Active',
};

export default function ClientsScreen() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [detailClient, setDetailClient] = useState<Client | null>(null);
  const [form, setForm] = useState<Omit<Client, 'id' | 'clientId'>>(emptyClient);
  const [activeTab, setActiveTab] = useState<'info' | 'sites' | 'history'>('info');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Client | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [sites, setSites] = useState<SiteLocation[]>([]);
  const [serviceHistory, setServiceHistory] = useState<ServiceHistoryEntry[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let res = await fetch('/api/clients');
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Server error ${res.status}`);
      }
      const data = await res.json();
      setClients(data);
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to load clients');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  const fetchClientDetail = useCallback(async (client: Client) => {
    setLoadingDetail(true);
    setSites([]);
    setServiceHistory([]);
    try {
      const [sitesRes, jobsRes] = await Promise.all([
        fetch(`/api/sites?clientId=${client.clientId}`),
        fetch(`/api/service-jobs?clientId=${client.clientId}`),
      ]);
      if (sitesRes.ok) {
        const sitesData = await sitesRes.json();
        setSites(sitesData.map((s: Record<string, unknown>) => ({
          siteId: s.siteId as string,
          siteName: s.siteName as string,
          address: (s.siteAddress as string) || '',
          generatorCount: 0,
        })));
      }
      if (jobsRes.ok) {
        const jobsData = await jobsRes.json();
        setServiceHistory(jobsData.slice(0, 10).map((j: Record<string, unknown>) => ({
          jobOrderNo: j.jobOrderNo as string,
          date: j.requestDate as string,
          serviceType: j.serviceType as string,
          status: j.status as string,
          technician: (j.leadTechnicianId as string) || '',
          billingStatus: (j.billingStatus as string) || '',
        })));
      }
    } catch {
      // non-critical — detail tabs may be empty
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  const filtered = useMemo(() => {
    return clients.filter((c) => {
      if (search) {
        const q = search.toLowerCase();
        if (!c.clientName.toLowerCase().includes(q) && !c.primaryContact.toLowerCase().includes(q) && !c.email.toLowerCase().includes(q)) return false;
      }
      if (statusFilter && c.status !== statusFilter) return false;
      if (industryFilter && c.industry !== industryFilter) return false;
      return true;
    });
  }, [clients, search, statusFilter, industryFilter]);

  const openCreate = () => {
    setEditingClient(null);
    setForm(emptyClient);
    setSaveError(null);
    setModalOpen(true);
  };

  const openEdit = (c: Client) => {
    setEditingClient(c);
    setForm({
      clientName: c.clientName,
      accountType: c.accountType,
      industry: c.industry,
      primaryContact: c.primaryContact,
      contactNo: c.contactNo,
      email: c.email,
      billingAddress: c.billingAddress,
      remarks: c.remarks,
      status: c.status,
    });
    setSaveError(null);
    setModalOpen(true);
    setDetailClient(null);
  };

  const handleSave = async () => {
    if (!form.clientName.trim()) { setSaveError('Client name is required.'); return; }
    setSaving(true);
    setSaveError(null);
    try {
      let res: Response;
      if (editingClient) {
        res = await fetch(`/api/clients/${editingClient.clientId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
      } else {
        res = await fetch('/api/clients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Server error ${res.status}`);
      }
      await fetchClients();
      setModalOpen(false);
    } catch (err: unknown) {
      setSaveError((err as Error).message || 'Failed to save client');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (client: Client) => {
    setDeleting(true);
    try {
      let res = await fetch(`/api/clients/${client.clientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: client.status === 'Active' ? 'Inactive' : 'Active' }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Server error ${res.status}`);
      }
      await fetchClients();
      setDeleteConfirm(null);
      if (detailClient?.clientId === client.clientId) setDetailClient(null);
    } catch (err: unknown) {
      alert((err as Error).message || 'Failed to update client status');
    } finally {
      setDeleting(false);
    }
  };

  const handleDelete = async (client: Client) => {
    setDeleting(true);
    try {
      let res = await fetch(`/api/clients/${client.clientId}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Server error ${res.status}`);
      }
      await fetchClients();
      setDeleteConfirm(null);
      if (detailClient?.clientId === client.clientId) setDetailClient(null);
    } catch (err: unknown) {
      alert((err as Error).message || 'Failed to delete client');
    } finally {
      setDeleting(false);
    }
  };

  const openDetail = (c: Client) => {
    setDetailClient(c);
    setActiveTab('info');
    fetchClientDetail(c);
  };

  const f = (key: keyof typeof emptyClient, val: string) =>
    setForm(prev => ({ ...prev, [key]: val }));

  const modalFooter = (
    <div className="flex items-center justify-end gap-3 w-full">
      <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-muted transition-colors">Cancel</button>
      <button type="button" onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-primary text-primary-foreground text-sm font-500 px-5 py-2 rounded-lg hover:bg-primary/90 active:scale-95 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed">
        {saving ? <><Icon name="ArrowPathIcon" size={15} className="animate-spin" />Saving...</> : <><Icon name="CheckIcon" size={15} />{editingClient ? 'Update Client' : 'Add Client'}</>}
      </button>
    </div>
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Icon name="ArrowPathIcon" size={32} className="animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading clients...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Icon name="ExclamationCircleIcon" size={40} className="text-red-500" />
        <p className="text-base font-600 text-foreground">Failed to load clients</p>
        <p className="text-sm text-muted-foreground">{error}</p>
        <button onClick={fetchClients} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-500 hover:bg-primary/90 transition-colors">
          <Icon name="ArrowPathIcon" size={15} />Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full gap-0">
      {/* Main panel */}
      <div className={`flex-1 flex flex-col min-w-0 space-y-5 ${detailClient ? 'pr-0' : ''}`}>
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-600 text-foreground">Clients</h1>
            <p className="text-xs text-muted-foreground mt-1">{clients.length} client{clients.length !== 1 ? 's' : ''} registered</p>
          </div>
          <button onClick={openCreate} className="flex items-center gap-2 bg-primary text-primary-foreground text-sm font-500 px-4 py-2 rounded-lg hover:bg-primary/90 active:scale-95 transition-all duration-150 flex-shrink-0">
            <Icon name="PlusIcon" size={16} />Add Client
          </button>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Clients', value: clients.length, color: 'text-foreground', bg: 'bg-card', icon: 'BuildingOffice2Icon' },
            { label: 'Active', value: clients.filter(c => c.status === 'Active').length, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: 'CheckCircleIcon' },
            { label: 'Inactive', value: clients.filter(c => c.status === 'Inactive').length, color: 'text-gray-500', bg: 'bg-gray-50', icon: 'MinusCircleIcon' },
            { label: 'Corporate', value: clients.filter(c => c.accountType === 'Corporate').length, color: 'text-blue-600', bg: 'bg-blue-50', icon: 'BriefcaseIcon' },
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
            <input type="text" placeholder="Search clients..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-muted/40 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="text-sm bg-muted/40 border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground">
            <option value="">All Statuses</option>
            <option>Active</option>
            <option>Inactive</option>
          </select>
          <select value={industryFilter} onChange={e => setIndustryFilter(e.target.value)} className="text-sm bg-muted/40 border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground">
            <option value="">All Industries</option>
            {industries.map(i => <option key={i}>{i}</option>)}
          </select>
          {(search || statusFilter || industryFilter) && (
            <button onClick={() => { setSearch(''); setStatusFilter(''); setIndustryFilter(''); }} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-muted transition-colors">
              <Icon name="XMarkIcon" size={13} /> Clear
            </button>
          )}
        </div>

        {/* Table */}
        <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {['Client Name', 'Account Type', 'Industry', 'Primary Contact', 'Contact No.', 'Email', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-2xs font-600 uppercase tracking-wider text-muted-foreground whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={8}>
                    <EmptyState icon="BuildingOffice2Icon" title="No clients found" description="No clients match your filters, or no clients have been added yet."
                      action={{ label: 'Add Client', onClick: openCreate }} />
                  </td></tr>
                ) : filtered.map((c, idx) => (
                  <tr key={c.clientId} className={`border-b border-border last:border-0 hover:bg-muted/40 transition-colors group ${idx % 2 === 0 ? '' : 'bg-muted/10'}`}>
                    <td className="px-4 py-3">
                      <button onClick={() => openDetail(c)} className="text-sm font-600 text-primary hover:underline text-left">{c.clientName}</button>
                    </td>
                    <td className="px-4 py-3 text-xs text-foreground">{c.accountType}</td>
                    <td className="px-4 py-3 text-xs text-foreground">{c.industry}</td>
                    <td className="px-4 py-3 text-xs text-foreground">{c.primaryContact}</td>
                    <td className="px-4 py-3 text-xs text-foreground">{c.contactNo}</td>
                    <td className="px-4 py-3 text-xs text-foreground">{c.email}</td>
                    <td className="px-4 py-3"><StatusBadge status={c.status} size="sm" /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openDetail(c)} title="View details" className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"><Icon name="EyeIcon" size={14} /></button>
                        <button onClick={() => openEdit(c)} title="Edit client" className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"><Icon name="PencilSquareIcon" size={14} /></button>
                        <button onClick={() => setDeleteConfirm(c)} title={c.status === 'Active' ? 'Deactivate' : 'Delete'} className="p-1.5 rounded-md hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors"><Icon name="TrashIcon" size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Detail Panel */}
      {detailClient && (
        <div className="w-96 border-l border-border bg-card flex flex-col flex-shrink-0 ml-4">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h2 className="font-600 text-sm text-foreground truncate">{detailClient.clientName}</h2>
            <button onClick={() => setDetailClient(null)} className="p-1 rounded hover:bg-muted text-muted-foreground transition-colors"><Icon name="XMarkIcon" size={16} /></button>
          </div>
          <div className="flex border-b border-border">
            {(['info', 'sites', 'history'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2.5 text-xs font-500 capitalize transition-colors ${activeTab === tab ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                {tab === 'info' ? 'Info' : tab === 'sites' ? 'Sites' : 'History'}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {activeTab === 'info' && (
              <>
                <DetailRow label="Client ID" value={detailClient.clientId} />
                <DetailRow label="Account Type" value={detailClient.accountType} />
                <DetailRow label="Industry" value={detailClient.industry} />
                <DetailRow label="Primary Contact" value={detailClient.primaryContact} />
                <DetailRow label="Contact No." value={detailClient.contactNo} />
                <DetailRow label="Email" value={detailClient.email} />
                <DetailRow label="Billing Address" value={detailClient.billingAddress} />
                <DetailRow label="Status" value={<StatusBadge status={detailClient.status} size="sm" />} />
                {detailClient.remarks && <DetailRow label="Remarks" value={detailClient.remarks} />}
              </>
            )}
            {activeTab === 'sites' && (
              loadingDetail ? (
                <div className="flex items-center justify-center h-20 text-muted-foreground text-xs"><Icon name="ArrowPathIcon" size={14} className="animate-spin mr-2" />Loading...</div>
              ) : sites.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">No sites found for this client.</p>
              ) : sites.map(s => (
                <div key={s.siteId} className="border border-border rounded-lg p-3">
                  <p className="text-xs font-600 text-foreground">{s.siteName}</p>
                  <p className="text-2xs text-muted-foreground mt-0.5">{s.address}</p>
                  <p className="text-2xs text-muted-foreground">{s.siteId}</p>
                </div>
              ))
            )}
            {activeTab === 'history' && (
              loadingDetail ? (
                <div className="flex items-center justify-center h-20 text-muted-foreground text-xs"><Icon name="ArrowPathIcon" size={14} className="animate-spin mr-2" />Loading...</div>
              ) : serviceHistory.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">No service history found.</p>
              ) : serviceHistory.map(h => (
                <div key={h.jobOrderNo} className="border border-border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-600 text-primary">{h.jobOrderNo}</span>
                    <StatusBadge status={h.status} size="sm" />
                  </div>
                  <p className="text-2xs text-muted-foreground">{h.serviceType} · {h.date}</p>
                  <p className="text-2xs text-muted-foreground">Billing: {h.billingStatus}</p>
                </div>
              ))
            )}
          </div>
          <div className="border-t border-border p-3 flex gap-2">
            <button onClick={() => openEdit(detailClient)} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-500 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
              <Icon name="PencilSquareIcon" size={13} />Edit
            </button>
            <button onClick={() => setDeleteConfirm(detailClient)} className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-500 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors">
              <Icon name="TrashIcon" size={13} />{detailClient.status === 'Active' ? 'Deactivate' : 'Delete'}
            </button>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}
        title={editingClient ? `Edit Client — ${editingClient.clientName}` : 'Add New Client'}
        subtitle={editingClient ? 'Update client information' : 'Enter client details to register a new client'}
        size="lg" footer={modalFooter}>
        <div className="space-y-4">
          {saveError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 text-sm text-red-700">
              <Icon name="ExclamationCircleIcon" size={16} className="flex-shrink-0" />
              {saveError}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-500 text-foreground mb-1.5">Client Name <span className="text-red-500">*</span></label>
              <input value={form.clientName} onChange={e => f('clientName', e.target.value)} placeholder="e.g. BDO Unibank Inc."
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="block text-xs font-500 text-foreground mb-1.5">Account Type</label>
              <select value={form.accountType} onChange={e => f('accountType', e.target.value as AccountType)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30">
                {accountTypes.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-500 text-foreground mb-1.5">Industry</label>
              <select value={form.industry} onChange={e => f('industry', e.target.value as Industry)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30">
                {industries.map(i => <option key={i}>{i}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-500 text-foreground mb-1.5">Primary Contact</label>
              <input value={form.primaryContact} onChange={e => f('primaryContact', e.target.value)} placeholder="Contact person name"
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="block text-xs font-500 text-foreground mb-1.5">Contact No.</label>
              <input value={form.contactNo} onChange={e => f('contactNo', e.target.value)} placeholder="0917-xxx-xxxx"
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-500 text-foreground mb-1.5">Email</label>
              <input type="email" value={form.email} onChange={e => f('email', e.target.value)} placeholder="email@company.com"
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-500 text-foreground mb-1.5">Billing Address</label>
              <input value={form.billingAddress} onChange={e => f('billingAddress', e.target.value)} placeholder="Full billing address"
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="block text-xs font-500 text-foreground mb-1.5">Status</label>
              <select value={form.status} onChange={e => f('status', e.target.value as ClientStatus)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30">
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-500 text-foreground mb-1.5">Remarks</label>
              <input value={form.remarks} onChange={e => f('remarks', e.target.value)} placeholder="Optional notes"
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>
        </div>
      </Modal>

      {/* Delete/Deactivate Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center">
          <div className="absolute inset-0 bg-foreground/40" onClick={!deleting ? () => setDeleteConfirm(null) : undefined} />
          <div className="relative bg-card border border-border rounded-2xl shadow-modal w-full max-w-md mx-4 p-6">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <Icon name="TrashIcon" size={20} className="text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-700 text-foreground mb-1">
                  {deleteConfirm.status === 'Active' ? 'Deactivate Client' : 'Delete Client'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {deleteConfirm.status === 'Active'
                    ? `Deactivate "${deleteConfirm.clientName}"? This will mark them as inactive but preserve all service history.`
                    : `Permanently delete "${deleteConfirm.clientName}"? This cannot be undone. Clients with service history cannot be deleted.`}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3">
              <button onClick={() => setDeleteConfirm(null)} disabled={deleting} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50">Cancel</button>
              {deleteConfirm.status === 'Active' ? (
                <button onClick={() => handleDeactivate(deleteConfirm)} disabled={deleting}
                  className="flex items-center gap-2 bg-amber-600 text-white text-sm font-500 px-5 py-2 rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-60">
                  {deleting ? <><Icon name="ArrowPathIcon" size={14} className="animate-spin" />Saving...</> : 'Deactivate'}
                </button>
              ) : (
                <button onClick={() => handleDelete(deleteConfirm)} disabled={deleting}
                  className="flex items-center gap-2 bg-red-600 text-white text-sm font-500 px-5 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-60">
                  {deleting ? <><Icon name="ArrowPathIcon" size={14} className="animate-spin" />Deleting...</> : 'Delete'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-2xs font-600 uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="text-xs text-foreground">{value || <span className="text-muted-foreground italic">—</span>}</span>
    </div>
  );
}
