'use client';

import React, { useState, useMemo } from 'react';
import Icon from '@/components/ui/AppIcon';
import StatusBadge from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';

export type ClientStatus = 'Active' | 'Inactive';
export type AccountType = 'Corporate' | 'Individual' | 'Government' | 'SME';
export type Industry =
  | 'Banking & Finance' |'Real Estate' |'Telecommunications' |'Retail & Commercial' |'Logistics & Ports' |'Food & Beverage' |'Healthcare' |'Manufacturing' |'Data Centers' |'Other';

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
  clientName: string;
  accountType: AccountType;
  industry: Industry;
  primaryContact: string;
  contactNo: string;
  email: string;
  billingAddress: string;
  remarks: string;
  status: ClientStatus;
  sites: SiteLocation[];
  serviceHistory: ServiceHistoryEntry[];
}

const mockClients: Client[] = [
  {
    id: 'cli-001',
    clientName: 'BDO Unibank Inc.',
    accountType: 'Corporate',
    industry: 'Banking & Finance',
    primaryContact: 'Atty. Maria Lim',
    contactNo: '0917-555-1234',
    email: 'facilities@bdo.com.ph',
    billingAddress: '7899 Makati Ave., Makati City, Metro Manila',
    remarks: 'Priority client — SLA response within 2 hours',
    status: 'Active',
    sites: [
      { siteId: 'site-001', siteName: 'Makati Main Branch', address: '7899 Makati Ave., Makati City', generatorCount: 2 },
      { siteId: 'site-002', siteName: 'BGC Branch', address: '32nd St., BGC, Taguig City', generatorCount: 1 },
    ],
    serviceHistory: [
      { jobOrderNo: 'JO-2026-0094', date: '09 Sep 2026', serviceType: 'Emergency Call', status: 'In Progress', technician: 'Rodrigo Dela Cruz', billingStatus: 'Pending' },
      { jobOrderNo: 'JO-2026-0081', date: '15 Aug 2026', serviceType: 'PMS', status: 'Completed', technician: 'Mario Santos', billingStatus: 'Paid' },
      { jobOrderNo: 'JO-2026-0065', date: '02 Jul 2026', serviceType: 'Repair', status: 'Completed', technician: 'Jose Villanueva', billingStatus: 'Paid' },
    ],
  },
  {
    id: 'cli-002',
    clientName: 'SM Prime Holdings',
    accountType: 'Corporate',
    industry: 'Retail & Commercial',
    primaryContact: 'Engr. Ramon Cruz',
    contactNo: '0918-222-5678',
    email: 'engineering@smprime.com',
    billingAddress: 'SM Mall of Asia Complex, Pasay City, Metro Manila',
    remarks: 'Multiple mall locations — coordinate with facilities team',
    status: 'Active',
    sites: [
      { siteId: 'site-003', siteName: 'SM Aura Premier', address: 'McKinley Pkwy., BGC, Taguig', generatorCount: 3 },
      { siteId: 'site-004', siteName: 'SM Mall of Asia', address: 'MOA Complex, Pasay City', generatorCount: 4 },
    ],
    serviceHistory: [
      { jobOrderNo: 'JO-2026-0093', date: '07 Sep 2026', serviceType: 'PMS', status: 'Open', technician: 'Mario Santos', billingStatus: 'Pending' },
      { jobOrderNo: 'JO-2026-0078', date: '10 Aug 2026', serviceType: 'Inspection', status: 'Completed', technician: 'Danilo Fernandez', billingStatus: 'Invoiced' },
    ],
  },
  {
    id: 'cli-003',
    clientName: 'Ayala Land Inc.',
    accountType: 'Corporate',
    industry: 'Real Estate',
    primaryContact: 'Engr. Paulo Santos',
    contactNo: '0918-444-9876',
    email: 'maintenance@ayalaland.com',
    billingAddress: 'Tower One, Ayala Triangle, Makati City',
    remarks: 'Annual contract — PMS every 250 hours',
    status: 'Active',
    sites: [
      { siteId: 'site-005', siteName: 'BGC Corporate Center', address: '30th St., BGC, Taguig City', generatorCount: 2 },
      { siteId: 'site-006', siteName: 'Ayala Triangle Gardens', address: 'Ayala Ave., Makati City', generatorCount: 1 },
    ],
    serviceHistory: [
      { jobOrderNo: 'JO-2026-0092', date: '05 Sep 2026', serviceType: 'Repair', status: 'In Progress', technician: 'Jose Villanueva', billingStatus: 'Quoted' },
      { jobOrderNo: 'JO-2026-0074', date: '01 Aug 2026', serviceType: 'PMS', status: 'Completed', technician: 'Carlos Bautista', billingStatus: 'Paid' },
    ],
  },
  {
    id: 'cli-004',
    clientName: 'PLDT Inc.',
    accountType: 'Corporate',
    industry: 'Telecommunications',
    primaryContact: 'Engr. Dennis Tan',
    contactNo: '0919-333-4567',
    email: 'facilities@pldt.com',
    billingAddress: 'PLDT Tower, Makati Ave., Makati City',
    remarks: 'Data center — 24/7 uptime critical',
    status: 'Active',
    sites: [
      { siteId: 'site-007', siteName: 'Mandaluyong Data Center', address: 'Shaw Blvd., Mandaluyong City', generatorCount: 3 },
      { siteId: 'site-008', siteName: 'Makati Exchange', address: 'Makati Ave., Makati City', generatorCount: 2 },
    ],
    serviceHistory: [
      { jobOrderNo: 'JO-2026-0091', date: '03 Sep 2026', serviceType: 'Load Test', status: 'Completed', technician: 'Rodrigo Dela Cruz', billingStatus: 'Invoiced' },
      { jobOrderNo: 'JO-2026-0070', date: '25 Jul 2026', serviceType: 'PMS', status: 'Completed', technician: 'Eduardo Reyes', billingStatus: 'Paid' },
    ],
  },
  {
    id: 'cli-005',
    clientName: 'Robinsons Land Corp.',
    accountType: 'Corporate',
    industry: 'Retail & Commercial',
    primaryContact: 'Engr. Liza Reyes',
    contactNo: '0920-111-2345',
    email: 'engineering@robinsonsland.com',
    billingAddress: 'Robinsons Galleria, Ortigas Ave., Pasig City',
    remarks: 'Quarterly PMS contract',
    status: 'Active',
    sites: [
      { siteId: 'site-009', siteName: 'Galleria Mall Ortigas', address: 'Ortigas Ave., Pasig City', generatorCount: 2 },
      { siteId: 'site-010', siteName: 'Robinsons Magnolia', address: 'New Manila, Quezon City', generatorCount: 1 },
    ],
    serviceHistory: [
      { jobOrderNo: 'JO-2026-0090', date: '06 Sep 2026', serviceType: 'Troubleshooting', status: 'Open', technician: 'Danilo Fernandez', billingStatus: 'Pending' },
    ],
  },
  {
    id: 'cli-006',
    clientName: 'Megaworld Corp.',
    accountType: 'Corporate',
    industry: 'Real Estate',
    primaryContact: 'Engr. Carlo Mendoza',
    contactNo: '0917-777-8901',
    email: 'facilities@megaworld.com.ph',
    billingAddress: 'Eastwood City, Libis, Quezon City',
    remarks: 'Multiple tower locations in Eastwood and McKinley',
    status: 'Active',
    sites: [
      { siteId: 'site-011', siteName: 'Eastwood City Tower 1', address: 'Eastwood Ave., Libis, QC', generatorCount: 1 },
      { siteId: 'site-012', siteName: 'McKinley Hill', address: 'McKinley Hill, Taguig City', generatorCount: 2 },
    ],
    serviceHistory: [
      { jobOrderNo: 'JO-2026-0089', date: '01 Sep 2026', serviceType: 'PMS', status: 'Completed', technician: 'Antonio Garcia', billingStatus: 'Invoiced' },
    ],
  },
  {
    id: 'cli-007',
    clientName: 'ICTSI Ports',
    accountType: 'Corporate',
    industry: 'Logistics & Ports',
    primaryContact: 'Engr. Bong Villanueva',
    contactNo: '0916-888-3456',
    email: 'maintenance@ictsi.com',
    billingAddress: 'South Harbor, Port Area, Manila',
    remarks: 'Heavy industrial — specialized technicians required',
    status: 'Active',
    sites: [
      { siteId: 'site-013', siteName: 'MICT South Harbor', address: 'South Harbor, Port Area, Manila', generatorCount: 2 },
    ],
    serviceHistory: [
      { jobOrderNo: 'JO-2026-0085', date: '20 Aug 2026', serviceType: 'Repair', status: 'Completed', technician: 'Rodrigo Dela Cruz', billingStatus: 'Paid' },
    ],
  },
  {
    id: 'cli-008',
    clientName: 'Jollibee Foods Corp.',
    accountType: 'Corporate',
    industry: 'Food & Beverage',
    primaryContact: 'Engr. Ana Flores',
    contactNo: '0915-999-6789',
    email: 'facilities@jollibee.com.ph',
    billingAddress: '10 F. Ortigas Jr. Road, Ortigas Center, Pasig City',
    remarks: 'Commissary and plant — food safety compliance required',
    status: 'Active',
    sites: [
      { siteId: 'site-014', siteName: 'Ortigas Commissary', address: 'Ortigas Center, Pasig City', generatorCount: 2 },
      { siteId: 'site-015', siteName: 'Canlubang Plant', address: 'Canlubang, Calamba, Laguna', generatorCount: 3 },
    ],
    serviceHistory: [
      { jobOrderNo: 'JO-2026-0082', date: '18 Aug 2026', serviceType: 'PMS', status: 'Completed', technician: 'Renato Cruz', billingStatus: 'Paid' },
    ],
  },
];

const accountTypes: AccountType[] = ['Corporate', 'Individual', 'Government', 'SME'];
const industries: Industry[] = [
  'Banking & Finance', 'Real Estate', 'Telecommunications', 'Retail & Commercial',
  'Logistics & Ports', 'Food & Beverage', 'Healthcare', 'Manufacturing', 'Data Centers', 'Other',
];

const emptyClient: Omit<Client, 'id' | 'sites' | 'serviceHistory'> = {
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
  const [clients, setClients] = useState<Client[]>(mockClients);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [detailClient, setDetailClient] = useState<Client | null>(null);
  const [form, setForm] = useState<Omit<Client, 'id' | 'sites' | 'serviceHistory'>>(emptyClient);
  const [activeTab, setActiveTab] = useState<'info' | 'sites' | 'history'>('info');

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
    setModalOpen(true);
  };

  const openEdit = (client: Client) => {
    setEditingClient(client);
    setForm({
      clientName: client.clientName,
      accountType: client.accountType,
      industry: client.industry,
      primaryContact: client.primaryContact,
      contactNo: client.contactNo,
      email: client.email,
      billingAddress: client.billingAddress,
      remarks: client.remarks,
      status: client.status,
    });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!form.clientName.trim()) return;
    if (editingClient) {
      setClients(prev => prev.map(c => c.id === editingClient.id ? { ...c, ...form } : c));
    } else {
      const newClient: Client = {
        ...form,
        id: `cli-${String(clients.length + 1).padStart(3, '0')}`,
        sites: [],
        serviceHistory: [],
      };
      setClients(prev => [newClient, ...prev]);
    }
    setModalOpen(false);
  };

  const openDetail = (client: Client) => {
    setDetailClient(client);
    setActiveTab('info');
  };

  const totalGenerators = (client: Client) => client.sites.reduce((sum, s) => sum + s.generatorCount, 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-600 text-foreground">Clients</h1>
          <p className="text-xs text-muted-foreground mt-1">
            {clients.length} registered clients · {clients.filter(c => c.status === 'Active').length} active
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-500 hover:bg-primary/90 transition-colors"
        >
          <Icon name="PlusIcon" size={16} />
          Add Client
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Icon name="MagnifyingGlassIcon" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search clients, contacts, email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30 text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30 text-foreground"
        >
          <option value="">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
        <select
          value={industryFilter}
          onChange={e => setIndustryFilter(e.target.value)}
          className="px-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30 text-foreground"
        >
          <option value="">All Industries</option>
          {industries.map(i => <option key={i} value={i}>{i}</option>)}
        </select>
        {(search || statusFilter || industryFilter) && (
          <button
            onClick={() => { setSearch(''); setStatusFilter(''); setIndustryFilter(''); }}
            className="flex items-center gap-1.5 px-3 py-2 text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg bg-card transition-colors"
          >
            <Icon name="XMarkIcon" size={13} /> Clear
          </button>
        )}
        <span className="ml-auto text-xs text-muted-foreground">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon="BuildingOffice2Icon"
          title="No clients found"
          description="Try adjusting your filters or add a new client."
        />
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left px-4 py-3 text-xs font-600 text-muted-foreground uppercase tracking-wide">Client / Company</th>
                  <th className="text-left px-4 py-3 text-xs font-600 text-muted-foreground uppercase tracking-wide">Account Type</th>
                  <th className="text-left px-4 py-3 text-xs font-600 text-muted-foreground uppercase tracking-wide">Industry</th>
                  <th className="text-left px-4 py-3 text-xs font-600 text-muted-foreground uppercase tracking-wide">Primary Contact</th>
                  <th className="text-left px-4 py-3 text-xs font-600 text-muted-foreground uppercase tracking-wide">Contact No.</th>
                  <th className="text-left px-4 py-3 text-xs font-600 text-muted-foreground uppercase tracking-wide">Sites</th>
                  <th className="text-left px-4 py-3 text-xs font-600 text-muted-foreground uppercase tracking-wide">Generators</th>
                  <th className="text-left px-4 py-3 text-xs font-600 text-muted-foreground uppercase tracking-wide">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-600 text-muted-foreground uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((client) => (
                  <tr key={client.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openDetail(client)}
                        className="text-left"
                      >
                        <p className="font-500 text-foreground group-hover:text-primary transition-colors">{client.clientName}</p>
                        <p className="text-2xs text-muted-foreground mt-0.5">{client.id}</p>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-secondary-foreground">{client.accountType}</td>
                    <td className="px-4 py-3 text-secondary-foreground">{client.industry}</td>
                    <td className="px-4 py-3 text-secondary-foreground">{client.primaryContact}</td>
                    <td className="px-4 py-3 text-secondary-foreground tabular-nums">{client.contactNo}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-xs font-500 text-secondary-foreground">
                        <Icon name="MapPinIcon" size={12} className="text-muted-foreground" />
                        {client.sites.length}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-xs font-500 text-secondary-foreground">
                        <Icon name="BoltIcon" size={12} className="text-muted-foreground" />
                        {totalGenerators(client)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={client.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openDetail(client)}
                          className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                          title="View details"
                        >
                          <Icon name="EyeIcon" size={15} />
                        </button>
                        <button
                          onClick={() => openEdit(client)}
                          className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                          title="Edit client"
                        >
                          <Icon name="PencilSquareIcon" size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingClient ? `Edit Client — ${editingClient.clientName}` : 'Add New Client'}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-500 text-muted-foreground mb-1">Client / Company Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={form.clientName}
                onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))}
                placeholder="e.g. BDO Unibank Inc."
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30 text-foreground"
              />
            </div>
            <div>
              <label className="block text-xs font-500 text-muted-foreground mb-1">Account Type</label>
              <select
                value={form.accountType}
                onChange={e => setForm(f => ({ ...f, accountType: e.target.value as AccountType }))}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30 text-foreground"
              >
                {accountTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-500 text-muted-foreground mb-1">Industry</label>
              <select
                value={form.industry}
                onChange={e => setForm(f => ({ ...f, industry: e.target.value as Industry }))}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30 text-foreground"
              >
                {industries.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-500 text-muted-foreground mb-1">Primary Contact</label>
              <input
                type="text"
                value={form.primaryContact}
                onChange={e => setForm(f => ({ ...f, primaryContact: e.target.value }))}
                placeholder="Full name"
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30 text-foreground"
              />
            </div>
            <div>
              <label className="block text-xs font-500 text-muted-foreground mb-1">Contact No.</label>
              <input
                type="text"
                value={form.contactNo}
                onChange={e => setForm(f => ({ ...f, contactNo: e.target.value }))}
                placeholder="0917-XXX-XXXX"
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30 text-foreground"
              />
            </div>
            <div>
              <label className="block text-xs font-500 text-muted-foreground mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="email@company.com"
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30 text-foreground"
              />
            </div>
            <div>
              <label className="block text-xs font-500 text-muted-foreground mb-1">Status</label>
              <select
                value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value as ClientStatus }))}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30 text-foreground"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-500 text-muted-foreground mb-1">Billing Address</label>
              <input
                type="text"
                value={form.billingAddress}
                onChange={e => setForm(f => ({ ...f, billingAddress: e.target.value }))}
                placeholder="Full billing address"
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30 text-foreground"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-500 text-muted-foreground mb-1">Remarks</label>
              <textarea
                value={form.remarks}
                onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))}
                rows={2}
                placeholder="Additional notes…"
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30 text-foreground resize-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-border">
            <button
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-sm text-secondary-foreground border border-border rounded-lg hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!form.clientName.trim()}
              className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {editingClient ? 'Save Changes' : 'Add Client'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Detail Drawer */}
      {detailClient && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-foreground/30 fade-in" onClick={() => setDetailClient(null)} />
          <aside className="relative w-full max-w-xl bg-card border-l border-border h-full overflow-y-auto scrollbar-thin shadow-2xl slide-up flex flex-col">
            {/* Drawer header */}
            <div className="flex items-start justify-between px-6 py-4 border-b border-border sticky top-0 bg-card z-10">
              <div>
                <h2 className="text-base font-600 text-foreground">{detailClient.clientName}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{detailClient.id} · {detailClient.accountType} · {detailClient.industry}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={detailClient.status} />
                <button
                  onClick={() => { openEdit(detailClient); setDetailClient(null); }}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                  title="Edit"
                >
                  <Icon name="PencilSquareIcon" size={16} />
                </button>
                <button
                  onClick={() => setDetailClient(null)}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <Icon name="XMarkIcon" size={16} />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border px-6">
              {(['info', 'sites', 'history'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-3 text-sm font-500 border-b-2 transition-colors capitalize ${
                    activeTab === tab
                      ? 'border-primary text-primary' :'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab === 'info' ? 'Contact Info' : tab === 'sites' ? `Sites (${detailClient.sites.length})` : `Service History (${detailClient.serviceHistory.length})`}
                </button>
              ))}
            </div>

            <div className="flex-1 px-6 py-5 space-y-4">
              {activeTab === 'info' && (
                <div className="space-y-4">
                  <InfoRow label="Primary Contact" value={detailClient.primaryContact} icon="UserIcon" />
                  <InfoRow label="Contact No." value={detailClient.contactNo} icon="PhoneIcon" />
                  <InfoRow label="Email" value={detailClient.email} icon="EnvelopeIcon" />
                  <InfoRow label="Billing Address" value={detailClient.billingAddress} icon="MapPinIcon" />
                  {detailClient.remarks && (
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-xs font-500 text-muted-foreground mb-1">Remarks</p>
                      <p className="text-sm text-foreground">{detailClient.remarks}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="bg-primary/5 border border-primary/10 rounded-lg p-3 text-center">
                      <p className="text-xl font-700 text-primary">{detailClient.sites.length}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Site Locations</p>
                    </div>
                    <div className="bg-accent/5 border border-accent/10 rounded-lg p-3 text-center">
                      <p className="text-xl font-700 text-accent">{totalGenerators(detailClient)}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Generator Units</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'sites' && (
                <div className="space-y-3">
                  {detailClient.sites.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">No sites registered for this client.</p>
                  ) : (
                    detailClient.sites.map((site) => (
                      <div key={site.siteId} className="border border-border rounded-lg p-4 hover:bg-muted/30 transition-colors">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-500 text-foreground text-sm">{site.siteName}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{site.siteId}</p>
                          </div>
                          <span className="flex items-center gap-1 text-xs text-secondary-foreground bg-muted px-2 py-1 rounded-full">
                            <Icon name="BoltIcon" size={11} />
                            {site.generatorCount} unit{site.generatorCount !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                          <Icon name="MapPinIcon" size={12} />
                          {site.address}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'history' && (
                <div className="space-y-2">
                  {detailClient.serviceHistory.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">No service history available.</p>
                  ) : (
                    detailClient.serviceHistory.map((entry) => (
                      <div key={entry.jobOrderNo} className="border border-border rounded-lg p-3 hover:bg-muted/30 transition-colors">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-600 text-primary">{entry.jobOrderNo}</span>
                          <StatusBadge status={entry.status} />
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Icon name="CalendarDaysIcon" size={11} />{entry.date}</span>
                          <span className="flex items-center gap-1"><Icon name="WrenchScrewdriverIcon" size={11} />{entry.serviceType}</span>
                          <span className="flex items-center gap-1"><Icon name="UserIcon" size={11} />{entry.technician}</span>
                          <span className="flex items-center gap-1"><Icon name="BanknotesIcon" size={11} />{entry.billingStatus}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon name={icon as Parameters<typeof Icon>[0]['name']} size={14} className="text-muted-foreground" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm text-foreground font-500 mt-0.5">{value || '—'}</p>
      </div>
    </div>
  );
}
