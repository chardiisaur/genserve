'use client';

import React, { useState, useMemo } from 'react';
import Icon from '@/components/ui/AppIcon';


import EmptyState from '@/components/ui/EmptyState';

export type GeneratorStatus = 'Active' | 'In Repair' | 'Standby' | 'Decommissioned';
export type FuelType = 'Diesel' | 'Natural Gas' | 'Dual Fuel';
export type Phase = 'Single-Phase' | 'Three-Phase';

export interface MaintenanceRecord {
  pmsNo: string;
  date: string;
  type: string;
  runningHours: number;
  technician: string;
  findings: string;
  nextDue: string;
}

export interface SparePartAllocation {
  partNo: string;
  partName: string;
  qty: number;
  unit: string;
  lastUsed: string;
}

export interface GeneratorAsset {
  id: string;
  clientId: string;
  clientName: string;
  siteId: string;
  siteName: string;
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
  syncCapable: boolean;
  status: GeneratorStatus;
  remarks: string;
  maintenanceHistory: MaintenanceRecord[];
  spareParts: SparePartAllocation[];
}

const mockGenerators: GeneratorAsset[] = [
  {
    id: 'gen-047',
    clientId: 'cli-001',
    clientName: 'BDO Unibank Inc.',
    siteId: 'site-001',
    siteName: 'Makati Main Branch',
    assetNo: 'GEN-047',
    brand: 'Cummins',
    model: 'C550 D5',
    ratedKw: 440,
    ratedKva: 550,
    voltage: 400,
    phase: 'Three-Phase',
    frequencyHz: 60,
    rpm: 1800,
    engineBrand: 'Cummins',
    engineModel: 'QSX15-G9',
    engineSerialNo: 'CUM-QSX15-20210847',
    alternatorBrand: 'Stamford',
    alternatorModel: 'HCI544D',
    alternatorSerialNo: 'STM-HCI544D-20210847',
    controllerBrand: 'Deep Sea',
    controllerModel: 'DSE7320',
    atsBrandModel: 'Socomec ATYS 3S 630A',
    breakerRatingA: 800,
    fuelType: 'Diesel',
    installationDate: '15 Mar 2021',
    warrantyExpiry: '15 Mar 2024',
    currentRunningHours: 8420,
    pmsIntervalHours: 250,
    lastPmsDate: '15 Aug 2026',
    nextPmsDueDate: '15 Nov 2026',
    syncCapable: false,
    status: 'Active',
    remarks: 'Primary standby unit — banking facility',
    maintenanceHistory: [
      { pmsNo: 'PMS-2026-0081', date: '15 Aug 2026', type: 'PMS 250hr', runningHours: 8250, technician: 'Mario Santos', findings: 'Normal wear. Oil and filters replaced.', nextDue: '15 Nov 2026' },
      { pmsNo: 'PMS-2026-0055', date: '10 May 2026', type: 'PMS 250hr', runningHours: 8000, technician: 'Rodrigo Dela Cruz', findings: 'Coolant level low — topped up. Belts inspected.', nextDue: '15 Aug 2026' },
      { pmsNo: 'PMS-2025-0112', date: '20 Nov 2025', type: 'PMS 500hr', runningHours: 7750, technician: 'Mario Santos', findings: 'Air filter replaced. Injectors cleaned.', nextDue: '10 May 2026' },
    ],
    spareParts: [
      { partNo: 'CUM-OIL-15W40-20L', partName: 'Engine Oil 15W40 (20L)', qty: 4, unit: 'pail', lastUsed: '15 Aug 2026' },
      { partNo: 'CUM-OF-QSX15', partName: 'Oil Filter QSX15', qty: 2, unit: 'pc', lastUsed: '15 Aug 2026' },
      { partNo: 'CUM-FF-QSX15', partName: 'Fuel Filter QSX15', qty: 2, unit: 'pc', lastUsed: '15 Aug 2026' },
      { partNo: 'CUM-AF-QSX15', partName: 'Air Filter QSX15', qty: 1, unit: 'pc', lastUsed: '20 Nov 2025' },
    ],
  },
  {
    id: 'gen-048',
    clientId: 'cli-001',
    clientName: 'BDO Unibank Inc.',
    siteId: 'site-001',
    siteName: 'Makati Main Branch',
    assetNo: 'GEN-048',
    brand: 'Cummins',
    model: 'C275 D5',
    ratedKw: 220,
    ratedKva: 275,
    voltage: 400,
    phase: 'Three-Phase',
    frequencyHz: 60,
    rpm: 1800,
    engineBrand: 'Cummins',
    engineModel: '6CTA8.3-G2',
    engineSerialNo: 'CUM-6CTA-20190234',
    alternatorBrand: 'Stamford',
    alternatorModel: 'UCI274H',
    alternatorSerialNo: 'STM-UCI274H-20190234',
    controllerBrand: 'Deep Sea',
    controllerModel: 'DSE6020',
    atsBrandModel: 'Socomec ATYS 3S 400A',
    breakerRatingA: 400,
    fuelType: 'Diesel',
    installationDate: '10 Jun 2019',
    warrantyExpiry: '10 Jun 2022',
    currentRunningHours: 14200,
    pmsIntervalHours: 250,
    lastPmsDate: '01 Jul 2026',
    nextPmsDueDate: '01 Oct 2026',
    syncCapable: false,
    status: 'Active',
    remarks: 'Secondary unit — BGC branch backup',
    maintenanceHistory: [
      { pmsNo: 'PMS-2026-0068', date: '01 Jul 2026', type: 'PMS 250hr', runningHours: 14000, technician: 'Jose Villanueva', findings: 'All parameters normal. Filters replaced.', nextDue: '01 Oct 2026' },
    ],
    spareParts: [
      { partNo: 'CUM-OIL-15W40-20L', partName: 'Engine Oil 15W40 (20L)', qty: 3, unit: 'pail', lastUsed: '01 Jul 2026' },
      { partNo: 'CUM-OF-6CTA', partName: 'Oil Filter 6CTA', qty: 2, unit: 'pc', lastUsed: '01 Jul 2026' },
    ],
  },
  {
    id: 'gen-031',
    clientId: 'cli-002',
    clientName: 'SM Prime Holdings',
    siteId: 'site-003',
    siteName: 'SM Aura Premier',
    assetNo: 'GEN-031',
    brand: 'Mitsubishi',
    model: 'S12R-PTA2',
    ratedKw: 1000,
    ratedKva: 1250,
    voltage: 400,
    phase: 'Three-Phase',
    frequencyHz: 60,
    rpm: 1500,
    engineBrand: 'Mitsubishi',
    engineModel: 'S12R-PTA2',
    engineSerialNo: 'MIT-S12R-20180512',
    alternatorBrand: 'Leroy Somer',
    alternatorModel: 'LSA 47.2 L10',
    alternatorSerialNo: 'LS-LSA47-20180512',
    controllerBrand: 'ComAp',
    controllerModel: 'InteliGen NT',
    atsBrandModel: 'ABB OTM 1600A',
    breakerRatingA: 1600,
    fuelType: 'Diesel',
    installationDate: '20 Jan 2018',
    warrantyExpiry: '20 Jan 2021',
    currentRunningHours: 22800,
    pmsIntervalHours: 500,
    lastPmsDate: '05 Jun 2026',
    nextPmsDueDate: '05 Dec 2026',
    syncCapable: true,
    status: 'Active',
    remarks: 'Mall primary — sync-capable with GEN-032',
    maintenanceHistory: [
      { pmsNo: 'PMS-2026-0058', date: '05 Jun 2026', type: 'PMS 500hr', runningHours: 22500, technician: 'Danilo Fernandez', findings: 'Injector #4 replaced. Turbocharger inspected.', nextDue: '05 Dec 2026' },
      { pmsNo: 'PMS-2025-0098', date: '10 Dec 2025', type: 'PMS 500hr', runningHours: 22000, technician: 'Danilo Fernandez', findings: 'All normal. Coolant flushed and replaced.', nextDue: '05 Jun 2026' },
    ],
    spareParts: [
      { partNo: 'MIT-OIL-15W40-20L', partName: 'Engine Oil 15W40 (20L)', qty: 8, unit: 'pail', lastUsed: '05 Jun 2026' },
      { partNo: 'MIT-INJ-S12R', partName: 'Fuel Injector S12R', qty: 2, unit: 'pc', lastUsed: '05 Jun 2026' },
      { partNo: 'MIT-OF-S12R', partName: 'Oil Filter S12R', qty: 4, unit: 'pc', lastUsed: '05 Jun 2026' },
    ],
  },
  {
    id: 'gen-022',
    clientId: 'cli-003',
    clientName: 'Ayala Land Inc.',
    siteId: 'site-005',
    siteName: 'BGC Corporate Center',
    assetNo: 'GEN-022',
    brand: 'Cummins',
    model: 'KTA38-G2A',
    ratedKw: 800,
    ratedKva: 1000,
    voltage: 400,
    phase: 'Three-Phase',
    frequencyHz: 60,
    rpm: 1500,
    engineBrand: 'Cummins',
    engineModel: 'KTA38-G2A',
    engineSerialNo: 'CUM-KTA38-20160789',
    alternatorBrand: 'Stamford',
    alternatorModel: 'HCI634H',
    alternatorSerialNo: 'STM-HCI634H-20160789',
    controllerBrand: 'Deep Sea',
    controllerModel: 'DSE8610',
    atsBrandModel: 'Socomec ATYS 3S 1600A',
    breakerRatingA: 1600,
    fuelType: 'Diesel',
    installationDate: '05 Aug 2016',
    warrantyExpiry: '05 Aug 2019',
    currentRunningHours: 12380,
    pmsIntervalHours: 250,
    lastPmsDate: '01 Aug 2026',
    nextPmsDueDate: '01 Nov 2026',
    syncCapable: true,
    status: 'In Repair',
    remarks: 'Coolant leak repair in progress — JO-2026-0092',
    maintenanceHistory: [
      { pmsNo: 'PMS-2026-0074', date: '01 Aug 2026', type: 'PMS 250hr', runningHours: 12250, technician: 'Carlos Bautista', findings: 'Minor coolant seep at upper hose — flagged for repair.', nextDue: '01 Nov 2026' },
    ],
    spareParts: [
      { partNo: 'CUM-HOSE-KTA38-UP', partName: 'Upper Radiator Hose KTA38', qty: 1, unit: 'pc', lastUsed: '08 Sep 2026' },
      { partNo: 'CUM-COOLANT-50L', partName: 'Coolant Concentrate (50L)', qty: 2, unit: 'drum', lastUsed: '08 Sep 2026' },
    ],
  },
  {
    id: 'gen-015',
    clientId: 'cli-004',
    clientName: 'PLDT Inc.',
    siteId: 'site-007',
    siteName: 'Mandaluyong Data Center',
    assetNo: 'GEN-015',
    brand: 'Cummins',
    model: 'QSK78-G3',
    ratedKw: 2000,
    ratedKva: 2500,
    voltage: 400,
    phase: 'Three-Phase',
    frequencyHz: 60,
    rpm: 1500,
    engineBrand: 'Cummins',
    engineModel: 'QSK78-G3',
    engineSerialNo: 'CUM-QSK78-20140321',
    alternatorBrand: 'Stamford',
    alternatorModel: 'HCI734F',
    alternatorSerialNo: 'STM-HCI734F-20140321',
    controllerBrand: 'ComAp',
    controllerModel: 'InteliGen NT BaseBox',
    atsBrandModel: 'ABB OTM 3200A',
    breakerRatingA: 3200,
    fuelType: 'Diesel',
    installationDate: '12 Feb 2014',
    warrantyExpiry: '12 Feb 2017',
    currentRunningHours: 19240,
    pmsIntervalHours: 500,
    lastPmsDate: '25 Jul 2026',
    nextPmsDueDate: '25 Jan 2027',
    syncCapable: true,
    status: 'Active',
    remarks: 'Data center critical — N+1 redundancy with GEN-016',
    maintenanceHistory: [
      { pmsNo: 'PMS-2026-0070', date: '25 Jul 2026', type: 'PMS 500hr', runningHours: 19000, technician: 'Eduardo Reyes', findings: 'All parameters within spec. Turbo oil lines inspected.', nextDue: '25 Jan 2027' },
      { pmsNo: 'PMS-2026-0040', date: '15 Jan 2026', type: 'PMS 500hr', runningHours: 18500, technician: 'Rodrigo Dela Cruz', findings: 'Injector calibration done. Belts replaced.', nextDue: '25 Jul 2026' },
    ],
    spareParts: [
      { partNo: 'CUM-OIL-15W40-20L', partName: 'Engine Oil 15W40 (20L)', qty: 12, unit: 'pail', lastUsed: '25 Jul 2026' },
      { partNo: 'CUM-OF-QSK78', partName: 'Oil Filter QSK78', qty: 4, unit: 'pc', lastUsed: '25 Jul 2026' },
      { partNo: 'CUM-FF-QSK78', partName: 'Fuel Filter QSK78', qty: 4, unit: 'pc', lastUsed: '25 Jul 2026' },
      { partNo: 'CUM-BELT-QSK78', partName: 'Drive Belt Set QSK78', qty: 1, unit: 'set', lastUsed: '15 Jan 2026' },
    ],
  },
  {
    id: 'gen-039',
    clientId: 'cli-005',
    clientName: 'Robinsons Land Corp.',
    siteId: 'site-009',
    siteName: 'Galleria Mall Ortigas',
    assetNo: 'GEN-039',
    brand: 'Mitsubishi',
    model: 'S16R-PTA2',
    ratedKw: 1400,
    ratedKva: 1750,
    voltage: 400,
    phase: 'Three-Phase',
    frequencyHz: 60,
    rpm: 1500,
    engineBrand: 'Mitsubishi',
    engineModel: 'S16R-PTA2',
    engineSerialNo: 'MIT-S16R-20170654',
    alternatorBrand: 'Leroy Somer',
    alternatorModel: 'LSA 50.2 L10',
    alternatorSerialNo: 'LS-LSA50-20170654',
    controllerBrand: 'ComAp',
    controllerModel: 'InteliGen NT',
    atsBrandModel: 'ABB OTM 2500A',
    breakerRatingA: 2500,
    fuelType: 'Diesel',
    installationDate: '18 Sep 2017',
    warrantyExpiry: '18 Sep 2020',
    currentRunningHours: 16500,
    pmsIntervalHours: 500,
    lastPmsDate: '10 Apr 2026',
    nextPmsDueDate: '10 Oct 2026',
    syncCapable: true,
    status: 'Active',
    remarks: 'Overload fault under investigation — JO-2026-0090',
    maintenanceHistory: [
      { pmsNo: 'PMS-2026-0042', date: '10 Apr 2026', type: 'PMS 500hr', runningHours: 16000, technician: 'Danilo Fernandez', findings: 'Circuit breaker contacts inspected. No abnormalities found.', nextDue: '10 Oct 2026' },
    ],
    spareParts: [
      { partNo: 'MIT-OIL-15W40-20L', partName: 'Engine Oil 15W40 (20L)', qty: 10, unit: 'pail', lastUsed: '10 Apr 2026' },
      { partNo: 'MIT-CB-S16R-2500A', partName: 'Circuit Breaker 2500A', qty: 1, unit: 'pc', lastUsed: '10 Apr 2026' },
    ],
  },
  {
    id: 'gen-028',
    clientId: 'cli-006',
    clientName: 'Megaworld Corp.',
    siteId: 'site-011',
    siteName: 'Eastwood City Tower 1',
    assetNo: 'GEN-028',
    brand: 'Cummins',
    model: '6CTA8.3-G2',
    ratedKw: 160,
    ratedKva: 200,
    voltage: 400,
    phase: 'Three-Phase',
    frequencyHz: 60,
    rpm: 1500,
    engineBrand: 'Cummins',
    engineModel: '6CTA8.3-G2',
    engineSerialNo: 'CUM-6CTA-20150432',
    alternatorBrand: 'Stamford',
    alternatorModel: 'UCI274E',
    alternatorSerialNo: 'STM-UCI274E-20150432',
    controllerBrand: 'Deep Sea',
    controllerModel: 'DSE6020',
    atsBrandModel: 'Socomec ATYS 3S 250A',
    breakerRatingA: 250,
    fuelType: 'Diesel',
    installationDate: '22 Nov 2015',
    warrantyExpiry: '22 Nov 2018',
    currentRunningHours: 9800,
    pmsIntervalHours: 250,
    lastPmsDate: '05 Sep 2026',
    nextPmsDueDate: '05 Dec 2026',
    syncCapable: false,
    status: 'Active',
    remarks: 'Tower lobby and common area backup',
    maintenanceHistory: [
      { pmsNo: 'PMS-2026-0089', date: '05 Sep 2026', type: 'PMS 250hr', runningHours: 9750, technician: 'Antonio Garcia', findings: 'All normal. Filters replaced. Battery load tested.', nextDue: '05 Dec 2026' },
    ],
    spareParts: [
      { partNo: 'CUM-OIL-15W40-20L', partName: 'Engine Oil 15W40 (20L)', qty: 3, unit: 'pail', lastUsed: '05 Sep 2026' },
      { partNo: 'CUM-OF-6CTA', partName: 'Oil Filter 6CTA', qty: 2, unit: 'pc', lastUsed: '05 Sep 2026' },
      { partNo: 'BAT-12V-100AH', partName: 'Battery 12V 100Ah', qty: 2, unit: 'pc', lastUsed: '05 Sep 2026' },
    ],
  },
  {
    id: 'gen-011',
    clientId: 'cli-007',
    clientName: 'ICTSI Ports',
    siteId: 'site-013',
    siteName: 'MICT South Harbor',
    assetNo: 'GEN-011',
    brand: 'Cummins',
    model: 'KTA50-G3',
    ratedKw: 1400,
    ratedKva: 1750,
    voltage: 400,
    phase: 'Three-Phase',
    frequencyHz: 60,
    rpm: 1500,
    engineBrand: 'Cummins',
    engineModel: 'KTA50-G3',
    engineSerialNo: 'CUM-KTA50-20120198',
    alternatorBrand: 'Stamford',
    alternatorModel: 'HCI634J',
    alternatorSerialNo: 'STM-HCI634J-20120198',
    controllerBrand: 'ComAp',
    controllerModel: 'InteliGen NT',
    atsBrandModel: 'ABB OTM 2500A',
    breakerRatingA: 2500,
    fuelType: 'Diesel',
    installationDate: '08 Mar 2012',
    warrantyExpiry: '08 Mar 2015',
    currentRunningHours: 31200,
    pmsIntervalHours: 500,
    lastPmsDate: '20 Aug 2026',
    nextPmsDueDate: '20 Feb 2027',
    syncCapable: true,
    status: 'Active',
    remarks: 'Port operations critical — high runtime unit',
    maintenanceHistory: [
      { pmsNo: 'PMS-2026-0085', date: '20 Aug 2026', type: 'PMS 500hr', runningHours: 31000, technician: 'Rodrigo Dela Cruz', findings: 'Injectors cleaned. Turbo oil seals replaced.', nextDue: '20 Feb 2027' },
    ],
    spareParts: [
      { partNo: 'CUM-OIL-15W40-20L', partName: 'Engine Oil 15W40 (20L)', qty: 14, unit: 'pail', lastUsed: '20 Aug 2026' },
      { partNo: 'CUM-TURBO-SEAL-KTA50', partName: 'Turbo Oil Seal KTA50', qty: 2, unit: 'pc', lastUsed: '20 Aug 2026' },
    ],
  },
];

const statusColors: Record<GeneratorStatus, string> = {
  'Active': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'In Repair': 'bg-amber-50 text-amber-700 border-amber-200',
  'Standby': 'bg-blue-50 text-blue-700 border-blue-200',
  'Decommissioned': 'bg-gray-100 text-gray-500 border-gray-200',
};

export default function GeneratorsScreen() {
  const [generators] = useState<GeneratorAsset[]>(mockGenerators);
  const [search, setSearch] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [detailGen, setDetailGen] = useState<GeneratorAsset | null>(null);
  const [activeTab, setActiveTab] = useState<'specs' | 'maintenance' | 'parts'>('specs');

  const uniqueClients = useMemo(() => {
    const map = new Map<string, string>();
    generators.forEach(g => map.set(g.clientId, g.clientName));
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [generators]);

  const filtered = useMemo(() => {
    return generators.filter((g) => {
      if (search) {
        const q = search.toLowerCase();
        if (
          !g.assetNo.toLowerCase().includes(q) &&
          !g.brand.toLowerCase().includes(q) &&
          !g.model.toLowerCase().includes(q) &&
          !g.clientName.toLowerCase().includes(q) &&
          !g.siteName.toLowerCase().includes(q) &&
          !g.engineModel.toLowerCase().includes(q)
        ) return false;
      }
      if (clientFilter && g.clientId !== clientFilter) return false;
      if (statusFilter && g.status !== statusFilter) return false;
      return true;
    });
  }, [generators, search, clientFilter, statusFilter]);

  const openDetail = (gen: GeneratorAsset) => {
    setDetailGen(gen);
    setActiveTab('specs');
  };

  const hoursUntilPms = (gen: GeneratorAsset) => {
    const lastPmsHours = gen.currentRunningHours - (gen.currentRunningHours % gen.pmsIntervalHours);
    return lastPmsHours + gen.pmsIntervalHours - gen.currentRunningHours;
  };

  const pmsUrgency = (gen: GeneratorAsset) => {
    const remaining = hoursUntilPms(gen);
    if (remaining <= 50) return 'critical';
    if (remaining <= 100) return 'warning';
    return 'ok';
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-600 text-foreground">Generator Assets</h1>
          <p className="text-xs text-muted-foreground mt-1">
            {generators.length} registered units · {generators.filter(g => g.status === 'Active').length} active · {generators.filter(g => g.status === 'In Repair').length} in repair
          </p>
        </div>
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
          <input
            type="text"
            placeholder="Search asset no., brand, model, client…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30 text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <select
          value={clientFilter}
          onChange={e => setClientFilter(e.target.value)}
          className="px-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30 text-foreground"
        >
          <option value="">All Clients</option>
          {uniqueClients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30 text-foreground"
        >
          <option value="">All Statuses</option>
          {(['Active', 'In Repair', 'Standby', 'Decommissioned'] as GeneratorStatus[]).map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        {(search || clientFilter || statusFilter) && (
          <button
            onClick={() => { setSearch(''); setClientFilter(''); setStatusFilter(''); }}
            className="flex items-center gap-1.5 px-3 py-2 text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg bg-card transition-colors"
          >
            <Icon name="XMarkIcon" size={13} /> Clear
          </button>
        )}
        <span className="ml-auto text-xs text-muted-foreground">{filtered.length} unit{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon="BoltIcon"
          title="No generators found"
          description="Try adjusting your filters."
        />
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left px-4 py-3 text-xs font-600 text-muted-foreground uppercase tracking-wide">Asset / Unit</th>
                  <th className="text-left px-4 py-3 text-xs font-600 text-muted-foreground uppercase tracking-wide">Client</th>
                  <th className="text-left px-4 py-3 text-xs font-600 text-muted-foreground uppercase tracking-wide">Site</th>
                  <th className="text-left px-4 py-3 text-xs font-600 text-muted-foreground uppercase tracking-wide">Brand / Model</th>
                  <th className="text-right px-4 py-3 text-xs font-600 text-muted-foreground uppercase tracking-wide">kVA</th>
                  <th className="text-right px-4 py-3 text-xs font-600 text-muted-foreground uppercase tracking-wide">Run Hrs</th>
                  <th className="text-left px-4 py-3 text-xs font-600 text-muted-foreground uppercase tracking-wide">Next PMS</th>
                  <th className="text-left px-4 py-3 text-xs font-600 text-muted-foreground uppercase tracking-wide">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-600 text-muted-foreground uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((gen) => {
                  const urgency = pmsUrgency(gen);
                  const remaining = hoursUntilPms(gen);
                  return (
                    <tr key={gen.id} className="hover:bg-muted/30 transition-colors group">
                      <td className="px-4 py-3">
                        <button onClick={() => openDetail(gen)} className="text-left">
                          <p className="font-600 text-foreground group-hover:text-primary transition-colors">{gen.assetNo}</p>
                          <p className="text-2xs text-muted-foreground mt-0.5">{gen.id}</p>
                        </button>
                      </td>
                      <td className="px-4 py-3 text-secondary-foreground text-xs">{gen.clientName}</td>
                      <td className="px-4 py-3 text-secondary-foreground text-xs">{gen.siteName}</td>
                      <td className="px-4 py-3">
                        <p className="font-500 text-foreground">{gen.brand}</p>
                        <p className="text-2xs text-muted-foreground">{gen.model}</p>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-secondary-foreground font-500">{gen.ratedKva.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-secondary-foreground font-500">{gen.currentRunningHours.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-xs text-foreground">{gen.nextPmsDueDate}</p>
                          <p className={`text-2xs mt-0.5 font-500 ${urgency === 'critical' ? 'text-red-600' : urgency === 'warning' ? 'text-amber-600' : 'text-muted-foreground'}`}>
                            {remaining}h remaining
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-500 border ${statusColors[gen.status]}`}>
                          {gen.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end">
                          <button
                            onClick={() => openDetail(gen)}
                            className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                            title="View details"
                          >
                            <Icon name="EyeIcon" size={15} />
                          </button>
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
          <div className="fixed inset-0 bg-foreground/30 fade-in" onClick={() => setDetailGen(null)} />
          <aside className="relative w-full max-w-2xl bg-card border-l border-border h-full overflow-y-auto scrollbar-thin shadow-2xl flex flex-col">
            {/* Header */}
            <div className="flex items-start justify-between px-6 py-4 border-b border-border sticky top-0 bg-card z-10">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-600 text-foreground">{detailGen.assetNo}</h2>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-500 border ${statusColors[detailGen.status]}`}>
                    {detailGen.status}
                  </span>
                  {detailGen.syncCapable && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-500 bg-blue-50 text-blue-700 border border-blue-200">
                      <Icon name="ArrowsRightLeftIcon" size={11} /> Sync
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{detailGen.brand} {detailGen.model} · {detailGen.ratedKva} kVA · {detailGen.clientName} — {detailGen.siteName}</p>
              </div>
              <button
                onClick={() => setDetailGen(null)}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <Icon name="XMarkIcon" size={16} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border px-6">
              {(['specs', 'maintenance', 'parts'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-3 text-sm font-500 border-b-2 transition-colors ${
                    activeTab === tab
                      ? 'border-primary text-primary' :'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab === 'specs' ? 'Asset Details' : tab === 'maintenance' ? `Maintenance (${detailGen.maintenanceHistory.length})` : `Spare Parts (${detailGen.spareParts.length})`}
                </button>
              ))}
            </div>

            <div className="flex-1 px-6 py-5">
              {activeTab === 'specs' && (
                <div className="space-y-5">
                  {/* Running hours bar */}
                  <div className="bg-muted/50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-500 text-muted-foreground">Running Hours Progress</span>
                      <span className="text-sm font-700 text-foreground tabular-nums">{detailGen.currentRunningHours.toLocaleString()} h</span>
                    </div>
                    <div className="h-2 bg-border rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${pmsUrgency(detailGen) === 'critical' ? 'bg-red-500' : pmsUrgency(detailGen) === 'warning' ? 'bg-amber-500' : 'bg-primary'}`}
                        style={{ width: `${Math.min(100, ((detailGen.currentRunningHours % detailGen.pmsIntervalHours) / detailGen.pmsIntervalHours) * 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-1.5 text-2xs text-muted-foreground">
                      <span>Last PMS: {detailGen.lastPmsDate}</span>
                      <span>Next PMS: {detailGen.nextPmsDueDate} ({hoursUntilPms(detailGen)}h left)</span>
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
                      <SpecRow label="Sync Capable" value={detailGen.syncCapable ? 'Yes' : 'No'} />
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

              {activeTab === 'maintenance' && (
                <div className="space-y-3">
                  {detailGen.maintenanceHistory.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">No maintenance records available.</p>
                  ) : (
                    detailGen.maintenanceHistory.map((rec) => (
                      <div key={rec.pmsNo} className="border border-border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-600 text-primary">{rec.pmsNo}</span>
                          <span className="text-xs text-muted-foreground">{rec.date}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mb-2">
                          <span className="text-muted-foreground">Type: <span className="text-foreground font-500">{rec.type}</span></span>
                          <span className="text-muted-foreground">Running Hrs: <span className="text-foreground font-500 tabular-nums">{rec.runningHours.toLocaleString()}</span></span>
                          <span className="text-muted-foreground">Technician: <span className="text-foreground font-500">{rec.technician}</span></span>
                          <span className="text-muted-foreground">Next Due: <span className="text-foreground font-500">{rec.nextDue}</span></span>
                        </div>
                        <div className="bg-muted/50 rounded p-2 text-xs text-secondary-foreground">
                          <span className="font-500 text-muted-foreground">Findings: </span>{rec.findings}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'parts' && (
                <div>
                  {detailGen.spareParts.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">No spare parts allocated.</p>
                  ) : (
                    <div className="border border-border rounded-xl overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border bg-muted/40">
                            <th className="text-left px-4 py-2.5 text-xs font-600 text-muted-foreground">Part No.</th>
                            <th className="text-left px-4 py-2.5 text-xs font-600 text-muted-foreground">Part Name</th>
                            <th className="text-right px-4 py-2.5 text-xs font-600 text-muted-foreground">Qty</th>
                            <th className="text-left px-4 py-2.5 text-xs font-600 text-muted-foreground">Unit</th>
                            <th className="text-left px-4 py-2.5 text-xs font-600 text-muted-foreground">Last Used</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {detailGen.spareParts.map((part) => (
                            <tr key={part.partNo} className="hover:bg-muted/30 transition-colors">
                              <td className="px-4 py-2.5 text-xs font-500 text-primary">{part.partNo}</td>
                              <td className="px-4 py-2.5 text-xs text-foreground">{part.partName}</td>
                              <td className="px-4 py-2.5 text-xs text-right tabular-nums font-600 text-foreground">{part.qty}</td>
                              <td className="px-4 py-2.5 text-xs text-muted-foreground">{part.unit}</td>
                              <td className="px-4 py-2.5 text-xs text-muted-foreground">{part.lastUsed}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
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
