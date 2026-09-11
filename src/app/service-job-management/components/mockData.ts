export type JobStatus = 'Open' | 'In Progress' | 'Completed' | 'Closed' | 'Cancelled';
export type Priority = 'Normal' | 'High' | 'Critical';
export type BillingStatus = 'Pending' | 'Quoted' | 'Approved' | 'Invoiced' | 'Paid' | 'Cancelled';

export interface ServiceJob {
  id: string;
  jobOrderNo: string;
  requestDate: string;
  clientId: string;
  clientName: string;
  siteId: string;
  siteName: string;
  generatorId: string;
  generatorName: string;
  serviceType: string;
  problem: string;
  priority: Priority;
  scheduledDate: string;
  status: JobStatus;
  leadTechnicianId: string;
  leadTechnicianName: string;
  additionalTechnicianName?: string;
  startDate?: string;
  completionDate?: string;
  runningHours?: number;
  findings?: string;
  workPerformed?: string;
  testingResults?: string;
  recommendations?: string;
  partsMaterialsSummary?: string;
  customerRepresentative?: string;
  customerContact?: string;
  serviceReportNo?: string;
  quotationNo?: string;
  billingStatus: BillingStatus;
  remarks?: string;
}

export const clients = [
  { id: 'cli-001', name: 'BDO Unibank Inc.' },
  { id: 'cli-002', name: 'SM Prime Holdings' },
  { id: 'cli-003', name: 'Ayala Land Inc.' },
  { id: 'cli-004', name: 'PLDT Inc.' },
  { id: 'cli-005', name: 'Robinsons Land Corp.' },
  { id: 'cli-006', name: 'Megaworld Corp.' },
  { id: 'cli-007', name: 'ICTSI Ports' },
  { id: 'cli-008', name: 'Jollibee Foods Corp.' },
];

export const sitesByClient: Record<string, { id: string; name: string }[]> = {
  'cli-001': [
    { id: 'site-001', name: 'Makati Main Branch' },
    { id: 'site-002', name: 'BGC Branch' },
  ],
  'cli-002': [
    { id: 'site-003', name: 'SM Aura Premier' },
    { id: 'site-004', name: 'SM Mall of Asia' },
  ],
  'cli-003': [
    { id: 'site-005', name: 'BGC Corporate Center' },
    { id: 'site-006', name: 'Ayala Triangle Gardens' },
  ],
  'cli-004': [
    { id: 'site-007', name: 'Mandaluyong Data Center' },
    { id: 'site-008', name: 'Makati Exchange' },
  ],
  'cli-005': [
    { id: 'site-009', name: 'Galleria Mall Ortigas' },
    { id: 'site-010', name: 'Robinsons Magnolia' },
  ],
  'cli-006': [
    { id: 'site-011', name: 'Eastwood City Tower 1' },
    { id: 'site-012', name: 'McKinley Hill' },
  ],
  'cli-007': [
    { id: 'site-013', name: 'MICT South Harbor' },
  ],
  'cli-008': [
    { id: 'site-014', name: 'Ortigas Commissary' },
    { id: 'site-015', name: 'Canlubang Plant' },
  ],
};

export const generatorsBySite: Record<string, { id: string; name: string }[]> = {
  'site-001': [{ id: 'gen-047', name: 'GEN-047 / Cummins C550' }, { id: 'gen-048', name: 'GEN-048 / Cummins C275' }],
  'site-003': [{ id: 'gen-031', name: 'GEN-031 / Mitsubishi S12R' }],
  'site-005': [{ id: 'gen-022', name: 'GEN-022 / Cummins KTA38' }],
  'site-007': [{ id: 'gen-015', name: 'GEN-015 / Cummins QSK78' }, { id: 'gen-016', name: 'GEN-016 / Cummins QST30' }],
  'site-009': [{ id: 'gen-039', name: 'GEN-039 / Mitsubishi S16R' }],
  'site-011': [{ id: 'gen-028', name: 'GEN-028 / Cummins 6CTA' }],
  'site-013': [{ id: 'gen-011', name: 'GEN-011 / Cummins KTA50' }],
  'site-014': [{ id: 'gen-003', name: 'GEN-003 / Mitsubishi S6A3' }],
};

export const technicians = [
  { id: 'tech-001', name: 'Rodrigo Dela Cruz' },
  { id: 'tech-002', name: 'Mario Santos' },
  { id: 'tech-003', name: 'Jose Villanueva' },
  { id: 'tech-004', name: 'Danilo Fernandez' },
  { id: 'tech-005', name: 'Antonio Garcia' },
  { id: 'tech-006', name: 'Eduardo Reyes' },
  { id: 'tech-007', name: 'Carlos Bautista' },
  { id: 'tech-008', name: 'Renato Cruz' },
];

export const serviceTypes = [
  { id: 'st-001', name: 'PMS', defaultPriority: 'Normal' },
  { id: 'st-002', name: 'Troubleshooting', defaultPriority: 'High' },
  { id: 'st-003', name: 'Repair', defaultPriority: 'High' },
  { id: 'st-004', name: 'Commissioning', defaultPriority: 'High' },
  { id: 'st-005', name: 'Synchronization', defaultPriority: 'Critical' },
  { id: 'st-006', name: 'Inspection', defaultPriority: 'Normal' },
  { id: 'st-007', name: 'Load Test', defaultPriority: 'High' },
  { id: 'st-008', name: 'Emergency Call', defaultPriority: 'Critical' },
];

export const mockJobs: ServiceJob[] = [
  {
    id: 'job-2026-0094',
    jobOrderNo: 'JO-2026-0094',
    requestDate: '09 Sep 2026',
    clientId: 'cli-001',
    clientName: 'BDO Unibank Inc.',
    siteId: 'site-001',
    siteName: 'Makati Main Branch',
    generatorId: 'gen-047',
    generatorName: 'GEN-047 / Cummins C550',
    serviceType: 'Emergency Call',
    problem: 'Generator failed to start during power outage. No-crank condition reported.',
    priority: 'Critical',
    scheduledDate: '09 Sep 2026',
    status: 'In Progress',
    leadTechnicianId: 'tech-001',
    leadTechnicianName: 'Rodrigo Dela Cruz',
    additionalTechnicianName: 'Jose Villanueva',
    startDate: '09 Sep 2026',
    runningHours: 8420,
    billingStatus: 'Pending',
    customerRepresentative: 'Atty. Maria Lim',
    customerContact: '0917-555-1234',
    remarks: 'High priority — client is a banking institution',
  },
  {
    id: 'job-2026-0093',
    jobOrderNo: 'JO-2026-0093',
    requestDate: '07 Sep 2026',
    clientId: 'cli-002',
    clientName: 'SM Prime Holdings',
    siteId: 'site-003',
    siteName: 'SM Aura Premier',
    generatorId: 'gen-031',
    generatorName: 'GEN-031 / Mitsubishi S12R',
    serviceType: 'PMS',
    problem: 'Scheduled 250-hour preventive maintenance service.',
    priority: 'Normal',
    scheduledDate: '10 Sep 2026',
    status: 'Open',
    leadTechnicianId: 'tech-002',
    leadTechnicianName: 'Mario Santos',
    billingStatus: 'Pending',
  },
  {
    id: 'job-2026-0092',
    jobOrderNo: 'JO-2026-0092',
    requestDate: '05 Sep 2026',
    clientId: 'cli-003',
    clientName: 'Ayala Land Inc.',
    siteId: 'site-005',
    siteName: 'BGC Corporate Center',
    generatorId: 'gen-022',
    generatorName: 'GEN-022 / Cummins KTA38',
    serviceType: 'Repair',
    problem: 'Coolant leak detected in upper radiator hose. Engine temperature warning active.',
    priority: 'High',
    scheduledDate: '08 Sep 2026',
    status: 'In Progress',
    leadTechnicianId: 'tech-003',
    leadTechnicianName: 'Jose Villanueva',
    startDate: '08 Sep 2026',
    runningHours: 12380,
    findings: 'Upper radiator hose cracked near clamp fitting. Coolant level critically low.',
    workPerformed: 'Replaced upper radiator hose. Refilled coolant to full capacity.',
    billingStatus: 'Quoted',
    quotationNo: 'QT-2026-0087',
    customerRepresentative: 'Engr. Paulo Santos',
    customerContact: '0918-444-9876',
  },
  {
    id: 'job-2026-0091',
    jobOrderNo: 'JO-2026-0091',
    requestDate: '03 Sep 2026',
    clientId: 'cli-004',
    clientName: 'PLDT Inc.',
    siteId: 'site-007',
    siteName: 'Mandaluyong Data Center',
    generatorId: 'gen-015',
    generatorName: 'GEN-015 / Cummins QSK78',
    serviceType: 'Load Test',
    problem: 'Annual load bank test required per facility maintenance protocol.',
    priority: 'High',
    scheduledDate: '07 Sep 2026',
    status: 'Completed',
    leadTechnicianId: 'tech-001',
    leadTechnicianName: 'Rodrigo Dela Cruz',
    startDate: '07 Sep 2026',
    completionDate: '07 Sep 2026',
    runningHours: 19240,
    findings: 'Generator performed within specifications at 100% rated load.',
    workPerformed: 'Conducted 4-hour load bank test at 25%, 50%, 75%, and 100% rated load.',
    testingResults: 'All parameters within OEM specifications. No anomalies detected.',
    recommendations: 'Next load test due Sep 2027.',
    serviceReportNo: 'SR-2026-0091',
    billingStatus: 'Invoiced',
    quotationNo: 'QT-2026-0085',
  },
  {
    id: 'job-2026-0090',
    jobOrderNo: 'JO-2026-0090',
    requestDate: '06 Sep 2026',
    clientId: 'cli-005',
    clientName: 'Robinsons Land Corp.',
    siteId: 'site-009',
    siteName: 'Galleria Mall Ortigas',
    generatorId: 'gen-039',
    generatorName: 'GEN-039 / Mitsubishi S16R',
    serviceType: 'Troubleshooting',
    problem: 'Generator trips on overload fault after 15 minutes of operation. Circuit breaker trips.',
    priority: 'High',
    scheduledDate: '09 Sep 2026',
    status: 'Open',
    leadTechnicianId: 'tech-004',
    leadTechnicianName: 'Danilo Fernandez',
    billingStatus: 'Pending',
  },
  {
    id: 'job-2026-0089',
    jobOrderNo: 'JO-2026-0089',
    requestDate: '01 Sep 2026',
    clientId: 'cli-006',
    clientName: 'Megaworld Corp.',
    siteId: 'site-011',
    siteName: 'Eastwood City Tower 1',
    generatorId: 'gen-028',
    generatorName: 'GEN-028 / Cummins 6CTA',
    serviceType: 'PMS',
    problem: 'Scheduled 250-hour preventive maintenance.',
    priority: 'Normal',
    scheduledDate: '05 Sep 2026',
    status: 'Completed',
    leadTechnicianId: 'tech-005',
    leadTechnicianName: 'Antonio Garcia',
    startDate: '05 Sep 2026',
    completionDate: '05 Sep 2026',
    runningHours: 7650,
    findings: 'Oil filter clogged. Belts showing minor wear.',
    workPerformed: 'Replaced oil filter, fuel filter, air filter. Changed engine oil. Adjusted belt tension.',
    testingResults: 'Generator started and ran at full load. All parameters normal.',
    serviceReportNo: 'SR-2026-0089',
    billingStatus: 'Paid',
    quotationNo: 'QT-2026-0083',
  },
  {
    id: 'job-2026-0088',
    jobOrderNo: 'JO-2026-0088',
    requestDate: '29 Aug 2026',
    clientId: 'cli-007',
    clientName: 'ICTSI Ports',
    siteId: 'site-013',
    siteName: 'MICT South Harbor',
    generatorId: 'gen-011',
    generatorName: 'GEN-011 / Cummins KTA50',
    serviceType: 'Inspection',
    problem: 'Routine annual technical inspection.',
    priority: 'Normal',
    scheduledDate: '03 Sep 2026',
    status: 'Closed',
    leadTechnicianId: 'tech-002',
    leadTechnicianName: 'Mario Santos',
    startDate: '03 Sep 2026',
    completionDate: '03 Sep 2026',
    runningHours: 24100,
    findings: 'Minor corrosion on exhaust manifold bolts. AVR output stable.',
    workPerformed: 'Cleaned and inspected all systems. Documented findings.',
    testingResults: 'Inspection passed. Corrosion flagged for follow-up.',
    serviceReportNo: 'SR-2026-0088',
    billingStatus: 'Paid',
    quotationNo: 'QT-2026-0081',
  },
  {
    id: 'job-2026-0087',
    jobOrderNo: 'JO-2026-0087',
    requestDate: '04 Sep 2026',
    clientId: 'cli-008',
    clientName: 'Jollibee Foods Corp.',
    siteId: 'site-014',
    siteName: 'Ortigas Commissary',
    generatorId: 'gen-003',
    generatorName: 'GEN-003 / Mitsubishi S6A3',
    serviceType: 'Repair',
    problem: 'AVR failure — output voltage unstable, fluctuating between 380V and 510V.',
    priority: 'High',
    scheduledDate: '10 Sep 2026',
    status: 'Open',
    leadTechnicianId: 'tech-003',
    leadTechnicianName: 'Jose Villanueva',
    billingStatus: 'Pending',
    remarks: 'Spare AVR unit to be sourced from Mitsubishi distributor',
  },
  {
    id: 'job-2026-0086',
    jobOrderNo: 'JO-2026-0086',
    requestDate: '28 Aug 2026',
    clientId: 'cli-001',
    clientName: 'BDO Unibank Inc.',
    siteId: 'site-002',
    siteName: 'BGC Branch',
    generatorId: 'gen-048',
    generatorName: 'GEN-048 / Cummins C275',
    serviceType: 'Commissioning',
    problem: 'New generator installation commissioning and testing.',
    priority: 'High',
    scheduledDate: '01 Sep 2026',
    status: 'Closed',
    leadTechnicianId: 'tech-005',
    leadTechnicianName: 'Antonio Garcia',
    additionalTechnicianName: 'Eduardo Reyes',
    startDate: '01 Sep 2026',
    completionDate: '02 Sep 2026',
    runningHours: 12,
    findings: 'New installation. All connections verified and tight.',
    workPerformed: 'Commissioning per OEM startup procedure. ATS transfer test performed.',
    testingResults: 'Auto-start, ATS transfer, and load acceptance all passed.',
    serviceReportNo: 'SR-2026-0086',
    billingStatus: 'Paid',
    quotationNo: 'QT-2026-0079',
  },
  {
    id: 'job-2026-0085',
    jobOrderNo: 'JO-2026-0085',
    requestDate: '25 Aug 2026',
    clientId: 'cli-004',
    clientName: 'PLDT Inc.',
    siteId: 'site-008',
    siteName: 'Makati Exchange',
    generatorId: 'gen-016',
    generatorName: 'GEN-016 / Cummins QST30',
    serviceType: 'PMS',
    problem: 'Scheduled 500-hour major PMS service.',
    priority: 'Normal',
    scheduledDate: '28 Aug 2026',
    status: 'Completed',
    leadTechnicianId: 'tech-006',
    leadTechnicianName: 'Eduardo Reyes',
    startDate: '28 Aug 2026',
    completionDate: '28 Aug 2026',
    runningHours: 15500,
    findings: 'Turbocharger showing minor oil seepage. Belt tension within limits.',
    workPerformed: 'Full PMS per 500-hour checklist. All filters replaced. Oil changed.',
    testingResults: 'Generator operational. Turbocharger seepage noted for monitoring.',
    recommendations: 'Monitor turbocharger. Schedule replacement at next PMS if seepage increases.',
    serviceReportNo: 'SR-2026-0085',
    billingStatus: 'Invoiced',
    quotationNo: 'QT-2026-0077',
  },
];