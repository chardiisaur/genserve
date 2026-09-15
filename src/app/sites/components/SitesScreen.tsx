'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Icon from '@/components/ui/AppIcon';
import EmptyState from '@/components/ui/EmptyState';
import Modal from '@/components/ui/Modal';
import StatusBadge from '@/components/ui/StatusBadge';

export interface Site {
  id: string;
  siteId: string;
  clientId: string;
  siteName: string;
  siteAddress: string;
  siteContact: string;
  contactNo: string;
  operatingHours: string;
  accessRequirements: string;
  generatorRoomNotes: string;
  remarks: string;
}

export interface ClientOption {
  clientId: string;
  clientName: string;
}

const emptyForm: Omit<Site, 'id' | 'siteId'> = {
  clientId: '', siteName: '', siteAddress: '', siteContact: '',
  contactNo: '', operatingHours: '', accessRequirements: '',
  generatorRoomNotes: '', remarks: '',
};

export default function SitesScreen() {
  const [sites, setSites] = useState<Site[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterClient, setFilterClient] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editSite, setEditSite] = useState<Site | null>(null);
  const [detailSite, setDetailSite] = useState<Site | null>(null);
  const [form, setForm] = useState<Omit<Site, 'id' | 'siteId'>>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Site | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [generators, setGenerators] = useState<{ generatorId: string; assetNo: string; brand: string; model: string; status: string }[]>([]);
  const [loadingGenerators, setLoadingGenerators] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sitesRes, clientsRes] = await Promise.all([
        fetch('/api/sites'),
        fetch('/api/clients'),
      ]);
      if (!sitesRes.ok) {
        const d = await sitesRes.json().catch(() => ({}));
        throw new Error(d.error || `Server error ${sitesRes.status}`);
      }
      const sitesData = await sitesRes.json();
      setSites(sitesData);
      if (clientsRes.ok) {
        const clientsData = await clientsRes.json();
        setClients(clientsData.map((c: Record<string, unknown>) => ({ clientId: c.clientId as string, clientName: c.clientName as string })));
      }
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to load sites');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const fetchSiteGenerators = useCallback(async (siteId: string) => {
    setLoadingGenerators(true);
    setGenerators([]);
    try {
      let res = await fetch(`/api/generators?siteId=${siteId}`);
      if (res.ok) {
        const data = await res.json();
        setGenerators(data.map((g: Record<string, unknown>) => ({
          generatorId: g.generatorId as string,
          assetNo: (g.assetNo as string) || '',
          brand: (g.brand as string) || '',
          model: (g.model as string) || '',
          status: (g.status as string) || '',
        })));
      }
    } catch {
      // non-critical
    } finally {
      setLoadingGenerators(false);
    }
  }, []);

  const filtered = useMemo(() => {
    return sites.filter(s => {
      if (search) {
        const q = search.toLowerCase();
        if (!s.siteName.toLowerCase().includes(q) && !s.siteAddress.toLowerCase().includes(q) && !s.siteContact.toLowerCase().includes(q)) return false;
      }
      if (filterClient && s.clientId !== filterClient) return false;
      return true;
    });
  }, [sites, search, filterClient]);

  const getClientName = (clientId: string) => clients.find(c => c.clientId === clientId)?.clientName || clientId;

  const openCreate = () => {
    setEditSite(null);
    setForm(emptyForm);
    setSaveError(null);
    setModalOpen(true);
  };

  const openEdit = (s: Site) => {
    setEditSite(s);
    setForm({
      clientId: s.clientId, siteName: s.siteName, siteAddress: s.siteAddress,
      siteContact: s.siteContact, contactNo: s.contactNo, operatingHours: s.operatingHours,
      accessRequirements: s.accessRequirements, generatorRoomNotes: s.generatorRoomNotes, remarks: s.remarks,
    });
    setSaveError(null);
    setModalOpen(true);
    setDetailSite(null);
  };

  const handleSave = async () => {
    if (!form.clientId || !form.siteName.trim()) { setSaveError('Client and Site Name are required.'); return; }
    setSaving(true);
    setSaveError(null);
    try {
      let res: Response;
      if (editSite) {
        res = await fetch(`/api/sites/${editSite.siteId}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
        });
      } else {
        res = await fetch('/api/sites', {
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
      setSaveError((err as Error).message || 'Failed to save site');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (site: Site) => {
    setDeleting(true);
    try {
      let res = await fetch(`/api/sites/${site.siteId}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Server error ${res.status}`);
      }
      await fetchAll();
      setDeleteConfirm(null);
      if (detailSite?.siteId === site.siteId) setDetailSite(null);
    } catch (err: unknown) {
      alert((err as Error).message || 'Failed to delete site');
    } finally {
      setDeleting(false);
    }
  };

  const openDetail = (s: Site) => {
    setDetailSite(s);
    fetchSiteGenerators(s.siteId);
  };

  const f = (key: keyof typeof emptyForm, val: string) => setForm(prev => ({ ...prev, [key]: val }));

  const modalFooter = (
    <div className="flex items-center justify-end gap-3 w-full">
      <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-muted transition-colors">Cancel</button>
      <button type="button" onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-primary text-primary-foreground text-sm font-500 px-5 py-2 rounded-lg hover:bg-primary/90 active:scale-95 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed">
        {saving ? <><Icon name="ArrowPathIcon" size={15} className="animate-spin" />Saving...</> : <><Icon name="CheckIcon" size={15} />{editSite ? 'Update Site' : 'Add Site'}</>}
      </button>
    </div>
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Icon name="ArrowPathIcon" size={32} className="animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading sites...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Icon name="ExclamationCircleIcon" size={40} className="text-red-500" />
        <p className="text-base font-600 text-foreground">Failed to load sites</p>
        <p className="text-sm text-muted-foreground">{error}</p>
        <button onClick={fetchAll} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-500 hover:bg-primary/90 transition-colors">
          <Icon name="ArrowPathIcon" size={15} />Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full gap-0">
      <div className="flex-1 flex flex-col min-w-0 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-600 text-foreground">Sites</h1>
            <p className="text-xs text-muted-foreground mt-1">{sites.length} site{sites.length !== 1 ? 's' : ''} registered</p>
          </div>
          <button onClick={openCreate} className="flex items-center gap-2 bg-primary text-primary-foreground text-sm font-500 px-4 py-2 rounded-lg hover:bg-primary/90 active:scale-95 transition-all duration-150 flex-shrink-0">
            <Icon name="PlusIcon" size={16} />Add Site
          </button>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { label: 'Total Sites', value: sites.length, color: 'text-foreground', bg: 'bg-card', icon: 'MapPinIcon' },
            { label: 'Clients Covered', value: new Set(sites.map(s => s.clientId)).size, color: 'text-blue-600', bg: 'bg-blue-50', icon: 'BuildingOffice2Icon' },
            { label: 'Filtered', value: filtered.length, color: 'text-primary', bg: 'bg-primary/10', icon: 'FunnelIcon' },
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
            <input type="text" placeholder="Search site name, address, contact..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-muted/40 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <select value={filterClient} onChange={e => setFilterClient(e.target.value)} className="text-sm bg-muted/40 border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground">
            <option value="">All Clients</option>
            {clients.map(c => <option key={c.clientId} value={c.clientId}>{c.clientName}</option>)}
          </select>
          {(search || filterClient) && (
            <button onClick={() => { setSearch(''); setFilterClient(''); }} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-muted transition-colors">
              <Icon name="XMarkIcon" size={13} /> Clear
            </button>
          )}
        </div>

        {/* Table */}
        <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {['Site Name', 'Client', 'Address', 'Site Contact', 'Contact No.', 'Operating Hours', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-2xs font-600 uppercase tracking-wider text-muted-foreground whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7}>
                    <EmptyState icon="MapPinIcon" title="No sites found" description="No sites match your filters, or no sites have been added yet."
                      action={{ label: 'Add Site', onClick: openCreate }} />
                  </td></tr>
                ) : filtered.map((s, idx) => (
                  <tr key={s.siteId} className={`border-b border-border last:border-0 hover:bg-muted/40 transition-colors group ${idx % 2 === 0 ? '' : 'bg-muted/10'}`}>
                    <td className="px-4 py-3">
                      <button onClick={() => openDetail(s)} className="text-sm font-600 text-primary hover:underline text-left">{s.siteName}</button>
                      <p className="text-2xs text-muted-foreground">{s.siteId}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-foreground">{getClientName(s.clientId)}</td>
                    <td className="px-4 py-3 text-xs text-foreground max-w-[180px] truncate">{s.siteAddress}</td>
                    <td className="px-4 py-3 text-xs text-foreground">{s.siteContact}</td>
                    <td className="px-4 py-3 text-xs text-foreground">{s.contactNo}</td>
                    <td className="px-4 py-3 text-xs text-foreground">{s.operatingHours}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openDetail(s)} title="View" className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"><Icon name="EyeIcon" size={14} /></button>
                        <button onClick={() => openEdit(s)} title="Edit" className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"><Icon name="PencilSquareIcon" size={14} /></button>
                        <button onClick={() => setDeleteConfirm(s)} title="Delete" className="p-1.5 rounded-md hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors"><Icon name="TrashIcon" size={14} /></button>
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
      {detailSite && (
        <div className="w-96 border-l border-border bg-card flex flex-col flex-shrink-0 ml-4">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h2 className="font-600 text-sm text-foreground truncate">{detailSite.siteName}</h2>
            <button onClick={() => setDetailSite(null)} className="p-1 rounded hover:bg-muted text-muted-foreground"><Icon name="XMarkIcon" size={16} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <div className="space-y-2">
              {[
                { label: 'Site ID', value: detailSite.siteId },
                { label: 'Client', value: getClientName(detailSite.clientId) },
                { label: 'Address', value: detailSite.siteAddress },
                { label: 'Site Contact', value: detailSite.siteContact },
                { label: 'Contact No.', value: detailSite.contactNo },
                { label: 'Operating Hours', value: detailSite.operatingHours },
                { label: 'Access Requirements', value: detailSite.accessRequirements },
                { label: 'Generator Room Notes', value: detailSite.generatorRoomNotes },
                { label: 'Remarks', value: detailSite.remarks },
              ].map(row => row.value ? (
                <div key={row.label}>
                  <p className="text-2xs font-600 uppercase tracking-wider text-muted-foreground">{row.label}</p>
                  <p className="text-xs text-foreground mt-0.5">{row.value}</p>
                </div>
              ) : null)}
            </div>
            <div className="border-t border-border pt-3">
              <p className="text-xs font-600 text-foreground mb-2">Generators at this site</p>
              {loadingGenerators ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground"><Icon name="ArrowPathIcon" size={12} className="animate-spin" />Loading...</div>
              ) : generators.length === 0 ? (
                <p className="text-xs text-muted-foreground">No generators assigned.</p>
              ) : generators.map(g => (
                <div key={g.generatorId} className="border border-border rounded-lg p-2.5 mb-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-500 text-foreground">{g.assetNo} — {g.brand} {g.model}</span>
                    <StatusBadge status={g.status} size="sm" />
                  </div>
                  <p className="text-2xs text-muted-foreground mt-0.5">{g.generatorId}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="border-t border-border p-3 flex gap-2">
            <button onClick={() => openEdit(detailSite)} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-500 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
              <Icon name="PencilSquareIcon" size={13} />Edit
            </button>
            <button onClick={() => setDeleteConfirm(detailSite)} className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-500 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors">
              <Icon name="TrashIcon" size={13} />Delete
            </button>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}
        title={editSite ? `Edit Site — ${editSite.siteName}` : 'Add New Site'}
        subtitle={editSite ? 'Update site information' : 'Enter site details to register a new site'}
        size="lg" footer={modalFooter}>
        <div className="space-y-4">
          {saveError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 text-sm text-red-700">
              <Icon name="ExclamationCircleIcon" size={16} className="flex-shrink-0" />{saveError}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-500 text-foreground mb-1.5">Client <span className="text-red-500">*</span></label>
              <select value={form.clientId} onChange={e => f('clientId', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30">
                <option value="">Select client...</option>
                {clients.map(c => <option key={c.clientId} value={c.clientId}>{c.clientName}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-500 text-foreground mb-1.5">Site Name <span className="text-red-500">*</span></label>
              <input value={form.siteName} onChange={e => f('siteName', e.target.value)} placeholder="e.g. Makati Main Branch"
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-500 text-foreground mb-1.5">Site Address</label>
              <input value={form.siteAddress} onChange={e => f('siteAddress', e.target.value)} placeholder="Full address"
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="block text-xs font-500 text-foreground mb-1.5">Site Contact</label>
              <input value={form.siteContact} onChange={e => f('siteContact', e.target.value)} placeholder="Contact person"
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="block text-xs font-500 text-foreground mb-1.5">Contact No.</label>
              <input value={form.contactNo} onChange={e => f('contactNo', e.target.value)} placeholder="0917-xxx-xxxx"
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="block text-xs font-500 text-foreground mb-1.5">Operating Hours</label>
              <input value={form.operatingHours} onChange={e => f('operatingHours', e.target.value)} placeholder="e.g. 24/7 or 8AM-5PM"
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="block text-xs font-500 text-foreground mb-1.5">Access Requirements</label>
              <input value={form.accessRequirements} onChange={e => f('accessRequirements', e.target.value)} placeholder="e.g. Security clearance required"
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-500 text-foreground mb-1.5">Generator Room Notes</label>
              <input value={form.generatorRoomNotes} onChange={e => f('generatorRoomNotes', e.target.value)} placeholder="Notes about generator room access or conditions"
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30" />
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
                <h3 className="text-base font-700 text-foreground mb-1">Delete Site</h3>
                <p className="text-sm text-muted-foreground">Delete <span className="font-600 text-foreground">{deleteConfirm.siteName}</span>? Sites with generators or service history cannot be deleted.</p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3">
              <button onClick={() => setDeleteConfirm(null)} disabled={deleting} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} disabled={deleting}
                className="flex items-center gap-2 bg-red-600 text-white text-sm font-500 px-5 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-60">
                {deleting ? <><Icon name="ArrowPathIcon" size={14} className="animate-spin" />Deleting...</> : 'Delete Site'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
