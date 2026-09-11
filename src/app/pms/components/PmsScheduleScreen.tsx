'use client';

import React, { useState, useMemo } from 'react';
import Icon from '@/components/ui/AppIcon';
import EmptyState from '@/components/ui/EmptyState';
import Modal from '@/components/ui/Modal';
import { technicians } from '@/app/service-job-management/components/mockData';

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
  generatorName: string;
  clientName: string;
  siteName: string;
  pmsType: PmsType;
  pmsDate: string;
  runningHours: number;
  nextPmsDate: string;
  nextPmsHours: number;
  technicianId: string;
  technicianName: string;
  pmsScope: string;
  pmsStatus: PmsStatus;
  checklist: ChecklistState;
  generalCondition: string;
  recommendations: string;
  remarks: string;
}

const emptyForm: Omit<PmsRecord, 'id'> = {
  pmsRecordId: '', generatorId: '', generatorName: '', clientName: '', siteName: '',
  pmsType: '250-Hour', pmsDate: '', runningHours: 0, nextPmsDate: '', nextPmsHours: 0,
  technicianId: '', technicianName: '', pmsScope: '', pmsStatus: 'Scheduled',
  checklist: { ...emptyChecklist }, generalCondition: '', recommendations: '', remarks: '',
};

const mockPms: PmsRecord[] = [
  {
    id: 'pms-001', pmsRecordId: 'PMS-2026-0041', generatorId: 'gen-047', generatorName: 'GEN-047 / Cummins C550',
    clientName: 'BDO Unibank Inc.', siteName: 'Makati Main Branch', pmsType: '250-Hour',
    pmsDate: '15 Aug 2026', runningHours: 8250, nextPmsDate: '15 Nov 2026', nextPmsHours: 8500,
    technicianId: 'tech-001', technicianName: 'Rodrigo Dela Cruz', pmsScope: 'Oil change, filter replacement, belt inspection, battery check',
    pmsStatus: 'Completed',
    checklist: { engineOil: 'Replaced', oilFilter: 'Replaced', fuelFilter: 'Replaced', waterSeparator: 'OK', airFilter: 'OK', coolant: 'OK', belts: 'OK', hoses: 'OK', battery: 'OK', batteryCharger: 'OK', radiatorCooling: 'OK', fuelSystem: 'OK', exhaust: 'OK', turbocharger: 'OK', alternator: 'OK', avr: 'OK', controller: 'OK', breakerAts: 'OK', emergencyStop: 'OK', loadTest: 'OK' },
    generalCondition: 'Good — unit running within normal parameters', recommendations: 'Monitor coolant level at next PMS', remarks: '',
  },
  {
    id: 'pms-002', pmsRecordId: 'PMS-2026-0042', generatorId: 'gen-031', generatorName: 'GEN-031 / Mitsubishi S12R',
    clientName: 'SM Prime Holdings', siteName: 'SM Aura Premier', pmsType: '250-Hour',
    pmsDate: '10 Sep 2026', runningHours: 6420, nextPmsDate: '10 Dec 2026', nextPmsHours: 6670,
    technicianId: 'tech-002', technicianName: 'Mario Santos', pmsScope: 'Full 250-hour PMS per OEM schedule',
    pmsStatus: 'Scheduled',
    checklist: { ...emptyChecklist },
    generalCondition: '', recommendations: '', remarks: 'Scheduled per client request',
  },
  {
    id: 'pms-003', pmsRecordId: 'PMS-2026-0040', generatorId: 'gen-022', generatorName: 'GEN-022 / Cummins KTA38',
    clientName: 'Ayala Land Inc.', siteName: 'BGC Corporate Center', pmsType: '500-Hour',
    pmsDate: '01 Sep 2026', runningHours: 12000, nextPmsDate: '01 Mar 2027', nextPmsHours: 12500,
    technicianId: 'tech-003', technicianName: 'Jose Villanueva', pmsScope: '500-hour major PMS including injector check and turbo inspection',
    pmsStatus: 'In Progress',
    checklist: { engineOil: 'Replaced', oilFilter: 'Replaced', fuelFilter: 'Replaced', waterSeparator: 'Replaced', airFilter: 'Replaced', coolant: 'OK', belts: 'Needs Attention', hoses: 'OK', battery: 'OK', batteryCharger: 'OK', radiatorCooling: 'OK', fuelSystem: 'OK', exhaust: 'OK', turbocharger: 'Needs Attention', alternator: 'OK', avr: 'OK', controller: 'OK', breakerAts: 'OK', emergencyStop: 'OK', loadTest: '' },
    generalCondition: 'Fair — belt wear noted, turbo inspection pending', recommendations: 'Replace fan belt at next visit', remarks: '',
  },
  {
    id: 'pms-004', pmsRecordId: 'PMS-2026-0039', generatorId: 'gen-015', generatorName: 'GEN-015 / Cummins QSK78',
    clientName: 'PLDT Inc.', siteName: 'Mandaluyong Data Center', pmsType: '1000-Hour',
    pmsDate: '20 Jul 2026', runningHours: 19000, nextPmsDate: '20 Jul 2027', nextPmsHours: 20000,
    technicianId: 'tech-001', technicianName: 'Rodrigo Dela Cruz', pmsScope: '1000-hour major overhaul inspection',
    pmsStatus: 'Completed',
    checklist: { engineOil: 'Replaced', oilFilter: 'Replaced', fuelFilter: 'Replaced', waterSeparator: 'Replaced', airFilter: 'Replaced', coolant: 'Replaced', belts: 'Replaced', hoses: 'OK', battery: 'Replaced', batteryCharger: 'OK', radiatorCooling: 'OK', fuelSystem: 'OK', exhaust: 'OK', turbocharger: 'OK', alternator: 'OK', avr: 'OK', controller: 'OK', breakerAts: 'OK', emergencyStop: 'OK', loadTest: 'OK' },
    generalCondition: 'Excellent — all parameters within spec', recommendations: 'Next 1000-hour PMS due Jul 2027', remarks: '',
  },
  {
    id: 'pms-005', pmsRecordId: 'PMS-2026-0038', generatorId: 'gen-039', generatorName: 'GEN-039 / Mitsubishi S16R',
    clientName: 'Robinsons Land Corp.', siteName: 'Galleria Mall Ortigas', pmsType: '250-Hour',
    pmsDate: '01 Aug 2026', runningHours: 5800, nextPmsDate: '01 Nov 2026', nextPmsHours: 6050,
    technicianId: 'tech-004', technicianName: 'Danilo Fernandez', pmsScope: '250-hour routine PMS',
    pmsStatus: 'Overdue',
    checklist: { ...emptyChecklist },
    generalCondition: '', recommendations: 'Reschedule immediately', remarks: 'Client postponed — follow up required',
  },
  {
    id: 'pms-006', pmsRecordId: 'PMS-2026-0043', generatorId: 'gen-028', generatorName: 'GEN-028 / Cummins 6CTA',
    clientName: 'Megaworld Corp.', siteName: 'Eastwood City Tower 1', pmsType: '250-Hour',
    pmsDate: '20 Sep 2026', runningHours: 7100, nextPmsDate: '20 Dec 2026', nextPmsHours: 7350,
    technicianId: 'tech-005', technicianName: 'Antonio Garcia', pmsScope: 'Routine 250-hour PMS',
    pmsStatus: 'Scheduled',
    checklist: { ...emptyChecklist },
    generalCondition: '', recommendations: '', remarks: '',
  },
];

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

export default function PmsScheduleScreen() {
  const [records, setRecords] = useState<PmsRecord[]>(mockPms);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<PmsRecord | null>(null);
  const [detailRecord, setDetailRecord] = useState<PmsRecord | null>(null);
  const [form, setForm] = useState<Omit<PmsRecord, 'id'>>(emptyForm);
  const [activeTab, setActiveTab] = useState<'info' | 'checklist'>('info');

  const filtered = useMemo(() => {
    return records.filter(r => {
      if (search) {
        const q = search.toLowerCase();
        if (!r.pmsRecordId.toLowerCase().includes(q) && !r.generatorName.toLowerCase().includes(q) && !r.clientName.toLowerCase().includes(q) && !r.siteName.toLowerCase().includes(q) && !r.technicianName.toLowerCase().includes(q)) return false;
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

  const openCreate = () => {
    setEditRecord(null);
    setForm({ ...emptyForm, checklist: { ...emptyChecklist } });
    setModalOpen(true);
  };

  const openEdit = (r: PmsRecord) => {
    setEditRecord(r);
    setForm({ ...r });
    setModalOpen(true);
    setDetailRecord(null);
  };

  const handleSave = () => {
    if (editRecord) {
      setRecords(prev => prev.map(r => r.id === editRecord.id ? { ...form, id: editRecord.id } : r));
      setDetailRecord({ ...form, id: editRecord.id });
    } else {
      const newRec: PmsRecord = { ...form, id: `pms-${Date.now()}`, pmsRecordId: `PMS-2026-${String(records.length + 44).padStart(4, '0')}` };
      setRecords(prev => [newRec, ...prev]);
    }
    setModalOpen(false);
  };

  const handleDelete = (id: string) => {
    setRecords(prev => prev.filter(r => r.id !== id));
    if (detailRecord?.id === id) setDetailRecord(null);
  };

  const handleStatusChange = (id: string, status: PmsStatus) => {
    setRecords(prev => prev.map(r => r.id === id ? { ...r, pmsStatus: status } : r));
    if (detailRecord?.id === id) setDetailRecord(prev => prev ? { ...prev, pmsStatus: status } : prev);
  };

  const modalFooter = (
    <div className="flex items-center justify-end gap-3 w-full">
      <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-muted transition-colors">Cancel</button>
      <button type="button" onClick={handleSave} className="flex items-center gap-2 bg-primary text-primary-foreground text-sm font-500 px-5 py-2 rounded-lg hover:bg-primary/90 active:scale-95 transition-all duration-150">
        <Icon name="CheckIcon" size={15} />
        {editRecord ? 'Update PMS' : 'Create PMS'}
      </button>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-600 text-foreground">PMS Schedule</h1>
          <p className="text-xs text-muted-foreground mt-1">{records.length} PMS records · Updated 11 Sep 2026</p>
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
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full min-w-[1000px]">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {['PMS Record ID', 'Generator', 'Client / Site', 'PMS Type', 'PMS Date', 'Running Hrs', 'Next PMS Date', 'Technician', 'Status'].map(h => (
                  <th key={h} className="text-left px-3 py-3 text-2xs font-600 uppercase tracking-wider text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
                <th className="px-3 py-3 text-right text-2xs font-600 uppercase tracking-wider text-muted-foreground w-20">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={10}><EmptyState icon="CalendarDaysIcon" title="No PMS records found" description="Try adjusting your search or filters." /></td></tr>
              ) : filtered.map(r => (
                <tr key={r.id} onClick={() => { setDetailRecord(r); setActiveTab('info'); }} className={`border-b border-border/50 hover:bg-muted/30 cursor-pointer transition-colors ${r.pmsStatus === 'Overdue' ? 'bg-red-50/30' : ''}`}>
                  <td className="px-3 py-3 text-xs font-600 text-foreground font-mono">{r.pmsRecordId}</td>
                  <td className="px-3 py-3 text-xs text-foreground font-500 max-w-[160px]"><p className="truncate">{r.generatorName}</p></td>
                  <td className="px-3 py-3 text-xs text-muted-foreground max-w-[160px]">
                    <p className="truncate font-500 text-foreground">{r.clientName}</p>
                    <p className="truncate text-2xs">{r.siteName}</p>
                  </td>
                  <td className="px-3 py-3"><span className="text-xs bg-muted/60 text-foreground px-2 py-0.5 rounded-full font-500">{r.pmsType}</span></td>
                  <td className="px-3 py-3 text-xs text-foreground">{r.pmsDate || '—'}</td>
                  <td className="px-3 py-3 text-xs font-mono text-foreground">{r.runningHours ? r.runningHours.toLocaleString() : '—'}</td>
                  <td className="px-3 py-3 text-xs text-foreground">{r.nextPmsDate || '—'}</td>
                  <td className="px-3 py-3 text-xs text-foreground">{r.technicianName || '—'}</td>
                  <td className="px-3 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-600 border ${statusColors[r.pmsStatus]}`}>{r.pmsStatus}</span>
                  </td>
                  <td className="px-3 py-3 text-right" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(r)} className="p-1.5 rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors" title="Edit"><Icon name="PencilSquareIcon" size={14} /></button>
                      <button onClick={() => handleDelete(r.id)} className="p-1.5 rounded-md hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors" title="Delete"><Icon name="TrashIcon" size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
                <p className="text-xs text-muted-foreground">{detailRecord.generatorName} · {detailRecord.clientName}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => openEdit(detailRecord)} className="flex items-center gap-1.5 text-xs font-500 text-primary hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors">
                  <Icon name="PencilSquareIcon" size={14} /> Edit
                </button>
                <button onClick={() => setDetailRecord(null)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-colors"><Icon name="XMarkIcon" size={18} /></button>
              </div>
            </div>

            {/* Status change */}
            <div className="px-6 py-3 border-b border-border bg-muted/20 flex-shrink-0">
              <p className="text-2xs font-600 uppercase tracking-wider text-muted-foreground mb-2">Change Status</p>
              <div className="flex gap-2 flex-wrap">
                {(['Scheduled', 'In Progress', 'Completed', 'Overdue', 'Cancelled'] as PmsStatus[]).map(s => (
                  <button key={s} onClick={() => handleStatusChange(detailRecord.id, s)} className={`text-xs px-3 py-1.5 rounded-lg border font-500 transition-all duration-150 active:scale-95 ${detailRecord.pmsStatus === s ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-foreground hover:border-primary/40 hover:bg-primary/5'}`}>{s}</button>
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
                        { label: 'Technician', value: detailRecord.technicianName || '—' },
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
                        { label: 'Generator', value: detailRecord.generatorName },
                        { label: 'Client', value: detailRecord.clientName },
                        { label: 'Site', value: detailRecord.siteName },
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
                    {CHECKLIST_KEYS.map(key => (
                      <div key={key} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                        <span className="text-xs text-foreground font-500">{CHECKLIST_LABELS[key]}</span>
                        <span className={`text-2xs font-600 px-2 py-0.5 rounded-full ${checklistColors[detailRecord.checklist[key] || '']}`}>
                          {detailRecord.checklist[key] || 'Not Checked'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editRecord ? `Edit PMS — ${editRecord.pmsRecordId}` : 'New PMS Record'} subtitle="Fill in all PMS details and checklist items" size="xl" footer={modalFooter}>
        <div className="space-y-5">
          <div>
            <p className="text-xs font-600 text-muted-foreground uppercase tracking-wider mb-3">Schedule Information</p>
            <div className="grid grid-cols-2 gap-4">
              <PmsFormField label="Generator ID" value={form.generatorId} onChange={v => setForm(f => ({ ...f, generatorId: v }))} placeholder="e.g. gen-047" />
              <PmsFormField label="Generator Name" value={form.generatorName} onChange={v => setForm(f => ({ ...f, generatorName: v }))} placeholder="e.g. GEN-047 / Cummins C550" />
              <PmsFormField label="Client Name" value={form.clientName} onChange={v => setForm(f => ({ ...f, clientName: v }))} placeholder="e.g. BDO Unibank Inc." />
              <PmsFormField label="Site Name" value={form.siteName} onChange={v => setForm(f => ({ ...f, siteName: v }))} placeholder="e.g. Makati Main Branch" />
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
              <PmsFormField label="PMS Date" value={form.pmsDate} onChange={v => setForm(f => ({ ...f, pmsDate: v }))} placeholder="e.g. 15 Aug 2026" />
              <PmsFormField label="Running Hours" value={String(form.runningHours)} onChange={v => setForm(f => ({ ...f, runningHours: Number(v) || 0 }))} type="number" placeholder="0" />
              <PmsFormField label="Next PMS Date" value={form.nextPmsDate} onChange={v => setForm(f => ({ ...f, nextPmsDate: v }))} placeholder="e.g. 15 Nov 2026" />
              <PmsFormField label="Next PMS Hours" value={String(form.nextPmsHours)} onChange={v => setForm(f => ({ ...f, nextPmsHours: Number(v) || 0 }))} type="number" placeholder="0" />
              <div>
                <label className="block text-xs font-500 text-muted-foreground mb-1.5">Technician</label>
                <select value={form.technicianId} onChange={e => { const t = technicians.find(t => t.id === e.target.value); setForm(f => ({ ...f, technicianId: e.target.value, technicianName: t?.name || '' })); }} className="w-full text-sm bg-muted/40 border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground">
                  <option value="">Select Technician</option>
                  {technicians.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-500 text-muted-foreground mb-1.5">PMS Checklist / Scope</label>
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
