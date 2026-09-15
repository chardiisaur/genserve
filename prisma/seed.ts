import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  const bcrypt = await import('bcryptjs');
  const bcryptModule = (bcrypt as any).default ?? bcrypt;
  return bcryptModule.hash(password, 12);
}

async function main() {
  console.log('🌱 Seeding GenServe GSMS database...');

  // ── Initial Admin User ─────────────────────────────────────────
  const userCount = await prisma.user.count();
  if (userCount === 0) {
    const adminEmail = process.env.INITIAL_ADMIN_EMAIL ?? 'admin@indentrade.com.ph';
    const adminPassword = process.env.INITIAL_ADMIN_PASSWORD ?? 'GSMSadmin@2026';
    const adminName = process.env.INITIAL_ADMIN_NAME ?? 'System Administrator';
    const passwordHash = await hashPassword(adminPassword);
    await prisma.user.create({
      data: { name: adminName, email: adminEmail.toLowerCase(), passwordHash, role: 'ADMIN', status: 'ACTIVE' },
    });
    console.log(`✅ Initial admin created: ${adminEmail}`);
  } else {
    console.log(`ℹ️  Users already exist — skipping admin seed`);
  }

  // ── Service Types ──────────────────────────────────────────────
  const serviceTypes = [
    { serviceTypeId: 'st-001', serviceType: 'PMS', description: 'Preventive Maintenance Service', defaultPriority: 'Normal', recommendedReport: 'PMS Report' },
    { serviceTypeId: 'st-002', serviceType: 'Troubleshooting', description: 'Fault diagnosis and troubleshooting', defaultPriority: 'High', recommendedReport: 'Service Report' },
    { serviceTypeId: 'st-003', serviceType: 'Repair', description: 'Component repair and replacement', defaultPriority: 'High', recommendedReport: 'Service Report' },
    { serviceTypeId: 'st-004', serviceType: 'Commissioning', description: 'New unit commissioning and startup', defaultPriority: 'High', recommendedReport: 'Commissioning Report' },
    { serviceTypeId: 'st-005', serviceType: 'Synchronization', description: 'Parallel synchronization setup', defaultPriority: 'Critical', recommendedReport: 'Sync Report' },
    { serviceTypeId: 'st-006', serviceType: 'Inspection', description: 'Routine inspection and assessment', defaultPriority: 'Normal', recommendedReport: 'Inspection Report' },
    { serviceTypeId: 'st-007', serviceType: 'Load Test', description: 'Load bank testing', defaultPriority: 'High', recommendedReport: 'Load Test Report' },
    { serviceTypeId: 'st-008', serviceType: 'Emergency Call', description: 'Emergency breakdown response', defaultPriority: 'Critical', recommendedReport: 'Emergency Report' },
  ];
  for (const st of serviceTypes) {
    await prisma.serviceType.upsert({ where: { serviceTypeId: st.serviceTypeId }, update: st, create: st });
  }
  console.log(`✅ Service types: ${serviceTypes.length}`);

  // ── Engine Models ──────────────────────────────────────────────
  const engineModels = [
    { modelId: 'em-001', brand: 'Cummins', engineModel: 'QSK78', cylinders: 16, displacement: '78L', typicalKwRange: '1800-2250 kW', typicalKvaRange: '2250-2813 kVA', oilCapacity: '120L', coolantCapacity: '200L', recommendedPmsInterval: 250, notes: 'High-output industrial engine' },
    { modelId: 'em-002', brand: 'Cummins', engineModel: 'KTA50', cylinders: 16, displacement: '50L', typicalKwRange: '1000-1500 kW', typicalKvaRange: '1250-1875 kVA', oilCapacity: '80L', coolantCapacity: '150L', recommendedPmsInterval: 250, notes: '' },
    { modelId: 'em-003', brand: 'Cummins', engineModel: 'KTA38', cylinders: 12, displacement: '38L', typicalKwRange: '700-1000 kW', typicalKvaRange: '875-1250 kVA', oilCapacity: '60L', coolantCapacity: '120L', recommendedPmsInterval: 250, notes: '' },
    { modelId: 'em-004', brand: 'Cummins', engineModel: 'QST30', cylinders: 12, displacement: '30L', typicalKwRange: '500-750 kW', typicalKvaRange: '625-938 kVA', oilCapacity: '45L', coolantCapacity: '90L', recommendedPmsInterval: 250, notes: '' },
    { modelId: 'em-005', brand: 'Cummins', engineModel: 'C550', cylinders: 6, displacement: '15L', typicalKwRange: '400-550 kW', typicalKvaRange: '500-688 kVA', oilCapacity: '28L', coolantCapacity: '55L', recommendedPmsInterval: 250, notes: '' },
    { modelId: 'em-006', brand: 'Cummins', engineModel: '6CTA', cylinders: 6, displacement: '8.3L', typicalKwRange: '150-250 kW', typicalKvaRange: '188-313 kVA', oilCapacity: '14L', coolantCapacity: '28L', recommendedPmsInterval: 250, notes: '' },
    { modelId: 'em-007', brand: 'Mitsubishi', engineModel: 'S16R', cylinders: 16, displacement: '65L', typicalKwRange: '1200-1600 kW', typicalKvaRange: '1500-2000 kVA', oilCapacity: '100L', coolantCapacity: '180L', recommendedPmsInterval: 250, notes: '' },
    { modelId: 'em-008', brand: 'Mitsubishi', engineModel: 'S12R', cylinders: 12, displacement: '49L', typicalKwRange: '800-1000 kW', typicalKvaRange: '1000-1250 kVA', oilCapacity: '75L', coolantCapacity: '140L', recommendedPmsInterval: 250, notes: '' },
    { modelId: 'em-009', brand: 'Mitsubishi', engineModel: 'S6A3', cylinders: 6, displacement: '11.9L', typicalKwRange: '150-200 kW', typicalKvaRange: '188-250 kVA', oilCapacity: '18L', coolantCapacity: '35L', recommendedPmsInterval: 250, notes: '' },
  ];
  for (const em of engineModels) {
    await prisma.engineModel.upsert({ where: { modelId: em.modelId }, update: em, create: em });
  }
  console.log(`✅ Engine models: ${engineModels.length}`);

  // ── Clients ────────────────────────────────────────────────────
  const clients = [
    { clientId: 'cli-001', clientName: 'BDO Unibank Inc.', accountType: 'Corporate', industry: 'Banking & Finance', primaryContact: 'Atty. Maria Lim', contactNo: '0917-555-1234', email: 'facilities@bdo.com.ph', billingAddress: '7899 Makati Ave., Makati City, Metro Manila', remarks: 'Priority client — SLA response within 2 hours', status: 'Active' },
    { clientId: 'cli-002', clientName: 'SM Prime Holdings', accountType: 'Corporate', industry: 'Real Estate', primaryContact: 'Engr. Roberto Cruz', contactNo: '0918-444-5678', email: 'facilities@smprime.com', billingAddress: 'SM Corporate Offices, Mall of Asia Complex, Pasay City', remarks: 'Multiple mall sites nationwide', status: 'Active' },
    { clientId: 'cli-003', clientName: 'Ayala Land Inc.', accountType: 'Corporate', industry: 'Real Estate', primaryContact: 'Engr. Paulo Santos', contactNo: '0918-444-9876', email: 'facilities@ayalaland.com.ph', billingAddress: 'Tower One, Ayala Triangle, Makati City', remarks: '', status: 'Active' },
    { clientId: 'cli-004', clientName: 'PLDT Inc.', accountType: 'Corporate', industry: 'Telecommunications', primaryContact: 'Engr. James Tan', contactNo: '0919-333-2468', email: 'facilities@pldt.com.ph', billingAddress: 'PLDT Head Office, Makati City', remarks: 'Data center — critical uptime requirement', status: 'Active' },
    { clientId: 'cli-005', clientName: 'Robinsons Land Corp.', accountType: 'Corporate', industry: 'Real Estate', primaryContact: 'Engr. Anna Reyes', contactNo: '0916-222-1357', email: 'facilities@robinsonsland.com', billingAddress: 'Robinsons Galleria, Ortigas Center, Pasig City', remarks: '', status: 'Active' },
    { clientId: 'cli-006', clientName: 'Megaworld Corp.', accountType: 'Corporate', industry: 'Real Estate', primaryContact: 'Engr. Luis Garcia', contactNo: '0917-111-9753', email: 'facilities@megaworld.com.ph', billingAddress: 'Eastwood City, Libis, Quezon City', remarks: '', status: 'Active' },
    { clientId: 'cli-007', clientName: 'ICTSI Ports', accountType: 'Corporate', industry: 'Logistics & Ports', primaryContact: 'Engr. Ramon Dela Torre', contactNo: '0920-888-6420', email: 'facilities@ictsi.com', billingAddress: 'South Harbor, Port Area, Manila', remarks: 'Port operations — 24/7 power requirement', status: 'Active' },
    { clientId: 'cli-008', clientName: 'Jollibee Foods Corp.', accountType: 'Corporate', industry: 'Food & Beverage', primaryContact: 'Engr. Grace Villanueva', contactNo: '0921-777-5319', email: 'facilities@jollibee.com.ph', billingAddress: 'Jollibee Plaza, Ortigas Center, Pasig City', remarks: '', status: 'Active' },
  ];
  for (const c of clients) {
    await prisma.client.upsert({ where: { clientId: c.clientId }, update: c, create: c });
  }
  console.log(`✅ Clients: ${clients.length}`);

  // ── Sites ──────────────────────────────────────────────────────
  const sites = [
    { siteId: 'site-001', clientId: 'cli-001', siteName: 'Makati Main Branch', siteAddress: '7899 Makati Ave., Makati City', siteContact: 'Facilities Manager', contactNo: '0917-555-1234', operatingHours: '24/7', accessRequirements: 'Security clearance required', generatorRoomNotes: 'Basement level B2', remarks: '' },
    { siteId: 'site-002', clientId: 'cli-001', siteName: 'BGC Branch', siteAddress: '32nd St., BGC, Taguig City', siteContact: 'Branch Manager', contactNo: '0917-555-5678', operatingHours: '8AM-8PM', accessRequirements: '', generatorRoomNotes: 'Ground floor utility room', remarks: '' },
    { siteId: 'site-003', clientId: 'cli-002', siteName: 'SM Aura Premier', siteAddress: 'McKinley Pkwy, BGC, Taguig City', siteContact: 'Mall Facilities', contactNo: '0918-444-1111', operatingHours: '10AM-10PM', accessRequirements: 'Maintenance access card', generatorRoomNotes: 'Rooftop generator room', remarks: '' },
    { siteId: 'site-004', clientId: 'cli-002', siteName: 'SM Mall of Asia', siteAddress: 'MOA Complex, Pasay City', siteContact: 'Mall Facilities', contactNo: '0918-444-2222', operatingHours: '10AM-10PM', accessRequirements: '', generatorRoomNotes: '', remarks: '' },
    { siteId: 'site-005', clientId: 'cli-003', siteName: 'BGC Corporate Center', siteAddress: '30th St., BGC, Taguig City', siteContact: 'Engr. Paulo Santos', contactNo: '0918-444-9876', operatingHours: '24/7', accessRequirements: 'Building pass required', generatorRoomNotes: 'Basement B1', remarks: '' },
    { siteId: 'site-006', clientId: 'cli-003', siteName: 'Ayala Triangle Gardens', siteAddress: 'Ayala Ave., Makati City', siteContact: 'Facilities', contactNo: '0918-444-3333', operatingHours: '8AM-6PM', accessRequirements: '', generatorRoomNotes: '', remarks: '' },
    { siteId: 'site-007', clientId: 'cli-004', siteName: 'Mandaluyong Data Center', siteAddress: 'Shaw Blvd., Mandaluyong City', siteContact: 'Engr. James Tan', contactNo: '0919-333-2468', operatingHours: '24/7', accessRequirements: 'Biometric access + escort', generatorRoomNotes: 'Dedicated generator building', remarks: 'Critical facility — N+1 redundancy' },
    { siteId: 'site-008', clientId: 'cli-004', siteName: 'Makati Exchange', siteAddress: 'Ayala Ave., Makati City', siteContact: 'Facilities', contactNo: '0919-333-1111', operatingHours: '24/7', accessRequirements: '', generatorRoomNotes: '', remarks: '' },
    { siteId: 'site-009', clientId: 'cli-005', siteName: 'Galleria Mall Ortigas', siteAddress: 'Ortigas Center, Pasig City', siteContact: 'Engr. Anna Reyes', contactNo: '0916-222-1357', operatingHours: '10AM-10PM', accessRequirements: '', generatorRoomNotes: 'Rooftop', remarks: '' },
    { siteId: 'site-010', clientId: 'cli-005', siteName: 'Robinsons Magnolia', siteAddress: 'New Manila, Quezon City', siteContact: 'Facilities', contactNo: '0916-222-2222', operatingHours: '10AM-10PM', accessRequirements: '', generatorRoomNotes: '', remarks: '' },
    { siteId: 'site-011', clientId: 'cli-006', siteName: 'Eastwood City Tower 1', siteAddress: 'Eastwood City, Libis, Quezon City', siteContact: 'Engr. Luis Garcia', contactNo: '0917-111-9753', operatingHours: '24/7', accessRequirements: '', generatorRoomNotes: 'Basement B2', remarks: '' },
    { siteId: 'site-012', clientId: 'cli-006', siteName: 'McKinley Hill', siteAddress: 'McKinley Hill, Taguig City', siteContact: 'Facilities', contactNo: '0917-111-1111', operatingHours: '24/7', accessRequirements: '', generatorRoomNotes: '', remarks: '' },
    { siteId: 'site-013', clientId: 'cli-007', siteName: 'MICT South Harbor', siteAddress: 'South Harbor, Port Area, Manila', siteContact: 'Engr. Ramon Dela Torre', contactNo: '0920-888-6420', operatingHours: '24/7', accessRequirements: 'Port security clearance', generatorRoomNotes: 'Container yard generator shed', remarks: '' },
    { siteId: 'site-014', clientId: 'cli-008', siteName: 'Ortigas Commissary', siteAddress: 'Ortigas Center, Pasig City', siteContact: 'Engr. Grace Villanueva', contactNo: '0921-777-5319', operatingHours: '24/7', accessRequirements: '', generatorRoomNotes: '', remarks: '' },
    { siteId: 'site-015', clientId: 'cli-008', siteName: 'Canlubang Plant', siteAddress: 'Canlubang, Calamba, Laguna', siteContact: 'Plant Manager', contactNo: '0921-777-1111', operatingHours: '24/7', accessRequirements: '', generatorRoomNotes: '', remarks: '' },
  ];
  for (const s of sites) {
    await prisma.site.upsert({ where: { siteId: s.siteId }, update: s, create: s });
  }
  console.log(`✅ Sites: ${sites.length}`);

  // ── Technicians ────────────────────────────────────────────────
  const technicians = [
    { technicianId: 'tech-001', technicianName: 'Rodrigo Dela Cruz', position: 'Senior Technician', contactNo: '0917-100-0001', skillLevel: 'Senior', engineExpertise: 'Cummins / Mitsubishi', controllerExpertise: 'ComAp / Deep Sea', electricalExpertise: 'Advanced', mechanicalExpertise: 'Advanced', availability: 'Available', certifications: 'Cummins Certified, TESDA NC III', remarks: 'Lead technician for critical jobs' },
    { technicianId: 'tech-002', technicianName: 'Mario Santos', position: 'Senior Technician', contactNo: '0917-100-0002', skillLevel: 'Senior', engineExpertise: 'Cummins', controllerExpertise: 'Deep Sea', electricalExpertise: 'Advanced', mechanicalExpertise: 'Advanced', availability: 'Available', certifications: 'Cummins Certified', remarks: '' },
    { technicianId: 'tech-003', technicianName: 'Jose Villanueva', position: 'Technician', contactNo: '0917-100-0003', skillLevel: 'Mid-Level', engineExpertise: 'Cummins / Mitsubishi', controllerExpertise: 'ComAp', electricalExpertise: 'Intermediate', mechanicalExpertise: 'Advanced', availability: 'Deployed', certifications: 'TESDA NC II', remarks: '' },
    { technicianId: 'tech-004', technicianName: 'Danilo Fernandez', position: 'Technician', contactNo: '0917-100-0004', skillLevel: 'Mid-Level', engineExpertise: 'Mitsubishi', controllerExpertise: 'Deep Sea', electricalExpertise: 'Intermediate', mechanicalExpertise: 'Intermediate', availability: 'Available', certifications: '', remarks: '' },
    { technicianId: 'tech-005', technicianName: 'Antonio Garcia', position: 'Technician', contactNo: '0917-100-0005', skillLevel: 'Mid-Level', engineExpertise: 'Cummins', controllerExpertise: 'Basler', electricalExpertise: 'Intermediate', mechanicalExpertise: 'Intermediate', availability: 'Available', certifications: '', remarks: '' },
    { technicianId: 'tech-006', technicianName: 'Eduardo Reyes', position: 'Junior Technician', contactNo: '0917-100-0006', skillLevel: 'Junior', engineExpertise: 'General', controllerExpertise: 'Basic', electricalExpertise: 'Basic', mechanicalExpertise: 'Basic', availability: 'Available', certifications: 'TESDA NC I', remarks: '' },
    { technicianId: 'tech-007', technicianName: 'Carlos Bautista', position: 'Junior Technician', contactNo: '0917-100-0007', skillLevel: 'Junior', engineExpertise: 'General', controllerExpertise: 'Basic', electricalExpertise: 'Basic', mechanicalExpertise: 'Intermediate', availability: 'Available', certifications: '', remarks: '' },
    { technicianId: 'tech-008', technicianName: 'Renato Cruz', position: 'Junior Technician', contactNo: '0917-100-0008', skillLevel: 'Junior', engineExpertise: 'General', controllerExpertise: 'Basic', electricalExpertise: 'Basic', mechanicalExpertise: 'Basic', availability: 'Available', certifications: '', remarks: '' },
  ];
  for (const t of technicians) {
    await prisma.technician.upsert({ where: { technicianId: t.technicianId }, update: t, create: t });
  }
  console.log(`✅ Technicians: ${technicians.length}`);

  // ── Generators ─────────────────────────────────────────────────
  const generators = [
    { generatorId: 'gen-047', clientId: 'cli-001', siteId: 'site-001', assetNo: 'GEN-047', brand: 'Cummins', model: 'C550', ratedKw: 550, ratedKva: 688, voltage: 480, phase: 'Three-Phase', frequencyHz: 60, rpm: 1800, engineBrand: 'Cummins', engineModel: 'QST30', engineSerialNo: 'CUM-QST30-047', alternatorBrand: 'Stamford', alternatorModel: 'HCI634H', alternatorSerialNo: 'STM-047', controllerBrand: 'ComAp', controllerModel: 'InteliGen NT', atsBrandModel: 'Socomec ATyS 6e', breakerRatingA: 1200, fuelType: 'Diesel', installationDate: '2019-03-15', warrantyExpiry: '2022-03-15', currentRunningHours: 8420, pmsIntervalHours: 250, lastPmsDate: '2026-07-10', nextPmsDueDate: '2026-10-10', synchronizingCapable: 'Yes', status: 'Active', remarks: '' },
    { generatorId: 'gen-048', clientId: 'cli-001', siteId: 'site-001', assetNo: 'GEN-048', brand: 'Cummins', model: 'C275', ratedKw: 275, ratedKva: 344, voltage: 480, phase: 'Three-Phase', frequencyHz: 60, rpm: 1800, engineBrand: 'Cummins', engineModel: '6CTA', engineSerialNo: 'CUM-6CTA-048', alternatorBrand: 'Leroy Somer', alternatorModel: 'LSA 46.2', alternatorSerialNo: 'LS-048', controllerBrand: 'Deep Sea', controllerModel: 'DSE7320', atsBrandModel: 'Socomec ATyS 6e', breakerRatingA: 600, fuelType: 'Diesel', installationDate: '2020-06-20', warrantyExpiry: '2023-06-20', currentRunningHours: 4210, pmsIntervalHours: 250, lastPmsDate: '2026-06-15', nextPmsDueDate: '2026-09-15', synchronizingCapable: 'Yes', status: 'Active', remarks: '' },
    { generatorId: 'gen-031', clientId: 'cli-002', siteId: 'site-003', assetNo: 'GEN-031', brand: 'Mitsubishi', model: 'S12R-PTA2', ratedKw: 1000, ratedKva: 1250, voltage: 480, phase: 'Three-Phase', frequencyHz: 60, rpm: 1500, engineBrand: 'Mitsubishi', engineModel: 'S12R', engineSerialNo: 'MIT-S12R-031', alternatorBrand: 'Stamford', alternatorModel: 'HCI634J', alternatorSerialNo: 'STM-031', controllerBrand: 'ComAp', controllerModel: 'InteliGen NT', atsBrandModel: 'ABB OTM', breakerRatingA: 2000, fuelType: 'Diesel', installationDate: '2018-09-01', warrantyExpiry: '2021-09-01', currentRunningHours: 15600, pmsIntervalHours: 250, lastPmsDate: '2026-08-01', nextPmsDueDate: '2026-11-01', synchronizingCapable: 'Yes', status: 'Active', remarks: '' },
    { generatorId: 'gen-022', clientId: 'cli-003', siteId: 'site-005', assetNo: 'GEN-022', brand: 'Cummins', model: 'KTA38-G5', ratedKw: 800, ratedKva: 1000, voltage: 480, phase: 'Three-Phase', frequencyHz: 60, rpm: 1800, engineBrand: 'Cummins', engineModel: 'KTA38', engineSerialNo: 'CUM-KTA38-022', alternatorBrand: 'Stamford', alternatorModel: 'HCI634G', alternatorSerialNo: 'STM-022', controllerBrand: 'Deep Sea', controllerModel: 'DSE8610', atsBrandModel: 'Socomec ATyS 6e', breakerRatingA: 1600, fuelType: 'Diesel', installationDate: '2017-05-10', warrantyExpiry: '2020-05-10', currentRunningHours: 12380, pmsIntervalHours: 250, lastPmsDate: '2026-07-20', nextPmsDueDate: '2026-10-20', synchronizingCapable: 'No', status: 'In Repair', remarks: 'Coolant leak repair in progress' },
    { generatorId: 'gen-015', clientId: 'cli-004', siteId: 'site-007', assetNo: 'GEN-015', brand: 'Cummins', model: 'QSK78-G3', ratedKw: 2000, ratedKva: 2500, voltage: 480, phase: 'Three-Phase', frequencyHz: 60, rpm: 1800, engineBrand: 'Cummins', engineModel: 'QSK78', engineSerialNo: 'CUM-QSK78-015', alternatorBrand: 'Stamford', alternatorModel: 'HCI634K', alternatorSerialNo: 'STM-015', controllerBrand: 'ComAp', controllerModel: 'InteliGen NTC', atsBrandModel: 'ABB OTM', breakerRatingA: 4000, fuelType: 'Diesel', installationDate: '2016-01-15', warrantyExpiry: '2019-01-15', currentRunningHours: 19240, pmsIntervalHours: 250, lastPmsDate: '2026-08-15', nextPmsDueDate: '2026-11-15', synchronizingCapable: 'Yes', status: 'Active', remarks: 'Critical data center unit' },
    { generatorId: 'gen-016', clientId: 'cli-004', siteId: 'site-007', assetNo: 'GEN-016', brand: 'Cummins', model: 'QST30-G4', ratedKw: 750, ratedKva: 938, voltage: 480, phase: 'Three-Phase', frequencyHz: 60, rpm: 1800, engineBrand: 'Cummins', engineModel: 'QST30', engineSerialNo: 'CUM-QST30-016', alternatorBrand: 'Leroy Somer', alternatorModel: 'LSA 49.1', alternatorSerialNo: 'LS-016', controllerBrand: 'Deep Sea', controllerModel: 'DSE8610', atsBrandModel: 'ABB OTM', breakerRatingA: 1600, fuelType: 'Diesel', installationDate: '2016-01-15', warrantyExpiry: '2019-01-15', currentRunningHours: 18900, pmsIntervalHours: 250, lastPmsDate: '2026-08-15', nextPmsDueDate: '2026-11-15', synchronizingCapable: 'Yes', status: 'Active', remarks: 'Standby unit for GEN-015' },
    { generatorId: 'gen-039', clientId: 'cli-005', siteId: 'site-009', assetNo: 'GEN-039', brand: 'Mitsubishi', model: 'S16R-PTA2', ratedKw: 1500, ratedKva: 1875, voltage: 480, phase: 'Three-Phase', frequencyHz: 60, rpm: 1500, engineBrand: 'Mitsubishi', engineModel: 'S16R', engineSerialNo: 'MIT-S16R-039', alternatorBrand: 'Stamford', alternatorModel: 'HCI634J', alternatorSerialNo: 'STM-039', controllerBrand: 'ComAp', controllerModel: 'InteliGen NT', atsBrandModel: 'Socomec ATyS 6e', breakerRatingA: 3000, fuelType: 'Diesel', installationDate: '2019-11-20', warrantyExpiry: '2022-11-20', currentRunningHours: 9800, pmsIntervalHours: 250, lastPmsDate: '2026-07-01', nextPmsDueDate: '2026-10-01', synchronizingCapable: 'No', status: 'Active', remarks: '' },
    { generatorId: 'gen-028', clientId: 'cli-006', siteId: 'site-011', assetNo: 'GEN-028', brand: 'Cummins', model: '6CTA8.3-G2', ratedKw: 200, ratedKva: 250, voltage: 480, phase: 'Three-Phase', frequencyHz: 60, rpm: 1800, engineBrand: 'Cummins', engineModel: '6CTA', engineSerialNo: 'CUM-6CTA-028', alternatorBrand: 'Stamford', alternatorModel: 'UCI274H', alternatorSerialNo: 'STM-028', controllerBrand: 'Deep Sea', controllerModel: 'DSE7320', atsBrandModel: 'Socomec ATyS 6e', breakerRatingA: 400, fuelType: 'Diesel', installationDate: '2021-04-05', warrantyExpiry: '2024-04-05', currentRunningHours: 5200, pmsIntervalHours: 250, lastPmsDate: '2026-06-01', nextPmsDueDate: '2026-09-01', synchronizingCapable: 'No', status: 'Active', remarks: '' },
    { generatorId: 'gen-011', clientId: 'cli-007', siteId: 'site-013', assetNo: 'GEN-011', brand: 'Cummins', model: 'KTA50-G3', ratedKw: 1250, ratedKva: 1563, voltage: 480, phase: 'Three-Phase', frequencyHz: 60, rpm: 1800, engineBrand: 'Cummins', engineModel: 'KTA50', engineSerialNo: 'CUM-KTA50-011', alternatorBrand: 'Stamford', alternatorModel: 'HCI634J', alternatorSerialNo: 'STM-011', controllerBrand: 'ComAp', controllerModel: 'InteliGen NT', atsBrandModel: 'ABB OTM', breakerRatingA: 2500, fuelType: 'Diesel', installationDate: '2015-08-10', warrantyExpiry: '2018-08-10', currentRunningHours: 22100, pmsIntervalHours: 250, lastPmsDate: '2026-08-20', nextPmsDueDate: '2026-11-20', synchronizingCapable: 'Yes', status: 'Active', remarks: 'Port operations — critical unit' },
    { generatorId: 'gen-003', clientId: 'cli-008', siteId: 'site-014', assetNo: 'GEN-003', brand: 'Mitsubishi', model: 'S6A3-PTA', ratedKw: 180, ratedKva: 225, voltage: 480, phase: 'Three-Phase', frequencyHz: 60, rpm: 1500, engineBrand: 'Mitsubishi', engineModel: 'S6A3', engineSerialNo: 'MIT-S6A3-003', alternatorBrand: 'Leroy Somer', alternatorModel: 'LSA 44.2', alternatorSerialNo: 'LS-003', controllerBrand: 'Deep Sea', controllerModel: 'DSE7320', atsBrandModel: 'Socomec ATyS 6e', breakerRatingA: 350, fuelType: 'Diesel', installationDate: '2022-02-14', warrantyExpiry: '2025-02-14', currentRunningHours: 3100, pmsIntervalHours: 250, lastPmsDate: '2026-07-25', nextPmsDueDate: '2026-10-25', synchronizingCapable: 'No', status: 'Active', remarks: '' },
  ];
  for (const g of generators) {
    await prisma.generator.upsert({ where: { generatorId: g.generatorId }, update: g, create: g });
  }
  console.log(`✅ Generators: ${generators.length}`);

  // ── Parts Inventory ────────────────────────────────────────────
  const parts = [
    { partId: 'pt-001', partNo: 'CUM-3401544', partDescription: 'Engine Oil Filter', brand: 'Cummins', applicableEngine: 'Cummins 6BT / 6CT / QSB', supplier: 'Cummins Philippines', unit: 'pc', unitCost: 850, sellingPrice: 1200, stockQty: 24, minimumStock: 10, storageLocation: 'Shelf A-1', reorderStatus: 'OK', remarks: '' },
    { partId: 'pt-002', partNo: 'CUM-3315843', partDescription: 'Fuel Filter Primary', brand: 'Cummins', applicableEngine: 'Cummins KTA38 / QSK78', supplier: 'Cummins Philippines', unit: 'pc', unitCost: 1200, sellingPrice: 1800, stockQty: 6, minimumStock: 8, storageLocation: 'Shelf A-2', reorderStatus: 'Low Stock', remarks: 'Reorder ASAP' },
    { partId: 'pt-003', partNo: 'MIT-ME013262', partDescription: 'Air Filter Element', brand: 'Mitsubishi', applicableEngine: 'Mitsubishi S12R / S16R', supplier: 'Mitsubishi Heavy Industries', unit: 'pc', unitCost: 2400, sellingPrice: 3500, stockQty: 3, minimumStock: 5, storageLocation: 'Shelf B-1', reorderStatus: 'Critical', remarks: 'Long lead time — 2 weeks' },
    { partId: 'pt-004', partNo: 'CUM-3803619', partDescription: 'Water Pump Seal Kit', brand: 'Cummins', applicableEngine: 'Cummins QST30 / QSK78', supplier: 'Cummins Philippines', unit: 'set', unitCost: 3800, sellingPrice: 5500, stockQty: 12, minimumStock: 4, storageLocation: 'Shelf C-3', reorderStatus: 'OK', remarks: '' },
    { partId: 'pt-005', partNo: 'GEN-BELT-001', partDescription: 'V-Belt Fan Drive', brand: 'Gates', applicableEngine: 'Universal / Multi-brand', supplier: 'Gates Philippines', unit: 'pc', unitCost: 650, sellingPrice: 950, stockQty: 0, minimumStock: 6, storageLocation: 'Shelf A-4', reorderStatus: 'Out of Stock', remarks: 'Ordered — ETA 3 days' },
    { partId: 'pt-006', partNo: 'CUM-3803698', partDescription: 'Coolant Hose Upper Radiator', brand: 'Cummins', applicableEngine: 'Cummins C550 / KTA38', supplier: 'Cummins Philippines', unit: 'pc', unitCost: 1800, sellingPrice: 2600, stockQty: 8, minimumStock: 4, storageLocation: 'Shelf B-2', reorderStatus: 'OK', remarks: '' },
    { partId: 'pt-007', partNo: 'MIT-ME013300', partDescription: 'Fuel Injection Nozzle', brand: 'Mitsubishi', applicableEngine: 'Mitsubishi S6A3 / S12R', supplier: 'Mitsubishi Heavy Industries', unit: 'pc', unitCost: 8500, sellingPrice: 12000, stockQty: 4, minimumStock: 2, storageLocation: 'Shelf D-1', reorderStatus: 'OK', remarks: 'High-value item' },
    { partId: 'pt-008', partNo: 'BAT-12V-200AH', partDescription: 'Battery 12V 200AH', brand: 'Motolite', applicableEngine: 'Universal', supplier: 'Motolite Marketing Corp.', unit: 'pc', unitCost: 6500, sellingPrice: 9000, stockQty: 5, minimumStock: 4, storageLocation: 'Shelf E-1', reorderStatus: 'OK', remarks: '' },
    { partId: 'pt-009', partNo: 'CUM-3803456', partDescription: 'Lube Oil (15W-40) 4L', brand: 'Cummins Valvoline', applicableEngine: 'Cummins All Models', supplier: 'Cummins Philippines', unit: 'gal', unitCost: 1100, sellingPrice: 1600, stockQty: 40, minimumStock: 20, storageLocation: 'Shelf A-5', reorderStatus: 'OK', remarks: '' },
    { partId: 'pt-010', partNo: 'MIT-ME013400', partDescription: 'Turbocharger Gasket Set', brand: 'Mitsubishi', applicableEngine: 'Mitsubishi S16R', supplier: 'Mitsubishi Heavy Industries', unit: 'set', unitCost: 4200, sellingPrice: 6000, stockQty: 2, minimumStock: 2, storageLocation: 'Shelf D-2', reorderStatus: 'Low Stock', remarks: '' },
    { partId: 'pt-011', partNo: 'AVR-SX460-001', partDescription: 'AVR Module SX460', brand: 'Stamford', applicableEngine: 'Stamford Alternator', supplier: 'Newage Stamford Philippines', unit: 'pc', unitCost: 12000, sellingPrice: 17500, stockQty: 3, minimumStock: 2, storageLocation: 'Shelf F-1', reorderStatus: 'OK', remarks: 'Sensitive electronic component' },
    { partId: 'pt-012', partNo: 'CUM-3803700', partDescription: 'Fuel Filter Secondary', brand: 'Cummins', applicableEngine: 'Cummins QSB / QSC', supplier: 'Cummins Philippines', unit: 'pc', unitCost: 950, sellingPrice: 1400, stockQty: 15, minimumStock: 8, storageLocation: 'Shelf A-3', reorderStatus: 'OK', remarks: '' },
  ];
  for (const p of parts) {
    await prisma.partInventory.upsert({ where: { partId: p.partId }, update: p, create: p });
  }
  console.log(`✅ Parts inventory: ${parts.length}`);

  // ── Service Jobs ───────────────────────────────────────────────
  // NOTE: leadTechnicianId and additionalTechnicianId are nullable (String?)
  // Use null instead of empty string for unset values
  const jobs = [
    { jobOrderNo: 'JO-2026-0094', requestDate: '2026-09-09', clientId: 'cli-001', siteId: 'site-001', generatorId: 'gen-047', serviceType: 'Emergency Call', problem: 'Generator failed to start during power outage. No-crank condition reported.', priority: 'Critical', scheduledDate: '2026-09-09', status: 'In Progress', leadTechnicianId: 'tech-001', additionalTechnicianId: 'tech-003', startDate: '2026-09-09', runningHours: 8420, billingStatus: 'Pending', customerRepresentative: 'Atty. Maria Lim', customerContact: '0917-555-1234', remarks: 'High priority — client is a banking institution' },
    { jobOrderNo: 'JO-2026-0093', requestDate: '2026-09-07', clientId: 'cli-002', siteId: 'site-003', generatorId: 'gen-031', serviceType: 'PMS', problem: 'Scheduled 250-hour preventive maintenance service.', priority: 'Normal', scheduledDate: '2026-09-10', status: 'Open', leadTechnicianId: 'tech-002', additionalTechnicianId: null, billingStatus: 'Pending' },
    { jobOrderNo: 'JO-2026-0092', requestDate: '2026-09-05', clientId: 'cli-003', siteId: 'site-005', generatorId: 'gen-022', serviceType: 'Repair', problem: 'Coolant leak detected in upper radiator hose. Engine temperature warning active.', priority: 'High', scheduledDate: '2026-09-08', status: 'In Progress', leadTechnicianId: 'tech-003', additionalTechnicianId: null, startDate: '2026-09-08', runningHours: 12380, findings: 'Upper radiator hose cracked near clamp fitting. Coolant level critically low.', workPerformed: 'Replaced upper radiator hose. Refilled coolant to full capacity.', billingStatus: 'Quoted', quotationNo: 'QT-2026-0087', customerRepresentative: 'Engr. Paulo Santos', customerContact: '0918-444-9876' },
    { jobOrderNo: 'JO-2026-0091', requestDate: '2026-09-03', clientId: 'cli-004', siteId: 'site-007', generatorId: 'gen-015', serviceType: 'Load Test', problem: 'Annual load bank test required per facility maintenance protocol.', priority: 'High', scheduledDate: '2026-09-07', status: 'Completed', leadTechnicianId: 'tech-001', additionalTechnicianId: null, startDate: '2026-09-07', completionDate: '2026-09-07', runningHours: 19240, findings: 'Generator performed within specifications at 100% rated load.', workPerformed: 'Conducted 4-hour load bank test at 25%, 50%, 75%, and 100% rated load.', testingResults: 'All parameters within OEM specifications. No anomalies detected.', recommendations: 'Next load test due Sep 2027.', serviceReportNo: 'SR-2026-0091', billingStatus: 'Invoiced', quotationNo: 'QT-2026-0085' },
    { jobOrderNo: 'JO-2026-0090', requestDate: '2026-09-06', clientId: 'cli-005', siteId: 'site-009', generatorId: 'gen-039', serviceType: 'Troubleshooting', problem: 'Generator trips on overload fault after 15 minutes of operation. Circuit breaker trips.', priority: 'High', scheduledDate: '2026-09-09', status: 'Open', leadTechnicianId: 'tech-004', additionalTechnicianId: null, billingStatus: 'Pending' },
    { jobOrderNo: 'JO-2026-0089', requestDate: '2026-09-01', clientId: 'cli-006', siteId: 'site-011', generatorId: 'gen-028', serviceType: 'PMS', problem: 'Scheduled 250-hour preventive maintenance.', priority: 'Normal', scheduledDate: '2026-09-05', status: 'Completed', leadTechnicianId: 'tech-005', additionalTechnicianId: null, startDate: '2026-09-05', completionDate: '2026-09-05', runningHours: 5200, serviceReportNo: 'SR-2026-0089', billingStatus: 'Invoiced', quotationNo: 'QT-2026-0083' },
  ];
  for (const j of jobs) {
    await prisma.serviceJob.upsert({ where: { jobOrderNo: j.jobOrderNo }, update: j, create: j });
  }
  console.log(`✅ Service jobs: ${jobs.length}`);

  // ── Initialize Job Order Sequence ──────────────────────────────
  // Set the sequence counter to the highest existing JO number for the current year
  // so the next generated JO continues from where the seed data left off
  const currentYear = new Date().getFullYear();
  const maxJo = await prisma.serviceJob.findFirst({
    where: { jobOrderNo: { startsWith: `JO-${currentYear}-` } },
    orderBy: { jobOrderNo: 'desc' },
  });
  const lastSeq = maxJo ? parseInt(maxJo.jobOrderNo.split('-')[2], 10) : 0;
  await prisma.jobOrderSequence.upsert({
    where: { year: currentYear },
    update: { lastSeq },
    create: { year: currentYear, lastSeq },
  });
  console.log(`✅ Job order sequence initialized: JO-${currentYear}-${String(lastSeq).padStart(4, '0')} (next will be ${String(lastSeq + 1).padStart(4, '0')})`);

  // ── Quotations & Billing ───────────────────────────────────────
  const quotations = [
    { transactionId: 'txn-001', jobOrderNo: 'JO-2026-0091', clientId: 'cli-004', quotationNo: 'QT-2026-0085', quotationDate: '2026-09-04', invoiceNo: 'INV-2026-0071', invoiceDate: '2026-09-08', labor: 8000, parts: 0, transportation: 1500, accommodation: 0, otherCharges: 0, discount: 0, totalAmount: 9500, billingStatus: 'Paid', paymentDate: '2026-09-10', remarks: 'Annual load test' },
    { transactionId: 'txn-002', jobOrderNo: 'JO-2026-0092', clientId: 'cli-003', quotationNo: 'QT-2026-0087', quotationDate: '2026-09-06', invoiceNo: '', invoiceDate: '', labor: 5000, parts: 2600, transportation: 800, accommodation: 0, otherCharges: 0, discount: 0, totalAmount: 8400, billingStatus: 'Unpaid', paymentDate: '', remarks: 'Coolant hose repair' },
    { transactionId: 'txn-003', jobOrderNo: 'JO-2026-0089', clientId: 'cli-006', quotationNo: 'QT-2026-0083', quotationDate: '2026-09-02', invoiceNo: 'INV-2026-0069', invoiceDate: '2026-09-06', labor: 6000, parts: 3200, transportation: 1000, accommodation: 0, otherCharges: 0, discount: 500, totalAmount: 9700, billingStatus: 'Paid', paymentDate: '2026-09-09', remarks: '250-hour PMS' },
  ];
  for (const q of quotations) {
    await prisma.quotationBilling.upsert({ where: { transactionId: q.transactionId }, update: q, create: q });
  }
  console.log(`✅ Quotations/billing: ${quotations.length}`);

  // ── Deployments ────────────────────────────────────────────────
  const deployments = [
    { deploymentId: 'dep-001', jobOrderNo: 'JO-2026-0094', clientId: 'cli-001', siteId: 'site-001', destination: 'Makati Main Branch, Makati City', technicianId: 'tech-001', departureDate: '2026-09-09', returnDate: '', transportation: 'Company Vehicle', accommodation: 'N/A', purpose: 'Emergency repair — no-crank condition', status: 'Deployed', remarks: '' },
    { deploymentId: 'dep-002', jobOrderNo: 'JO-2026-0091', clientId: 'cli-004', siteId: 'site-007', destination: 'Mandaluyong Data Center', technicianId: 'tech-001', departureDate: '2026-09-07', returnDate: '2026-09-07', transportation: 'Company Vehicle', accommodation: 'N/A', purpose: 'Annual load bank test', status: 'Returned', remarks: '' },
    { deploymentId: 'dep-003', jobOrderNo: 'JO-2026-0089', clientId: 'cli-006', siteId: 'site-011', destination: 'Eastwood City Tower 1, Quezon City', technicianId: 'tech-005', departureDate: '2026-09-05', returnDate: '2026-09-05', transportation: 'Company Vehicle', accommodation: 'N/A', purpose: '250-hour PMS', status: 'Returned', remarks: '' },
    { deploymentId: 'dep-004', jobOrderNo: 'JO-2026-0093', clientId: 'cli-002', siteId: 'site-003', destination: 'SM Aura Premier, BGC Taguig', technicianId: 'tech-002', departureDate: '2026-09-10', returnDate: '', transportation: 'Company Vehicle', accommodation: 'N/A', purpose: 'Scheduled 250-hour PMS', status: 'Planned', remarks: '' },
  ];
  for (const d of deployments) {
    await prisma.deployment.upsert({ where: { deploymentId: d.deploymentId }, update: d, create: d });
  }
  console.log(`✅ Deployments: ${deployments.length}`);

  // ── PMS Records ────────────────────────────────────────────────
  // NOTE: technicianId is nullable (String?) — use null for unset values
  const pmsRecords = [
    { pmsRecordId: 'pms-001', generatorId: 'gen-047', clientId: 'cli-001', siteId: 'site-001', pmsType: '250-Hour PMS', pmsDate: '2026-07-10', runningHours: 8250, nextPmsDate: '2026-10-10', nextPmsHours: 8500, technicianId: 'tech-001', pmsScope: 'Full 250-hour service', pmsStatus: 'Completed', engineOil: 'Replaced', oilFilter: 'Replaced', fuelFilter: 'Replaced', waterSeparator: 'OK', airFilter: 'OK', coolant: 'OK', belts: 'OK', hoses: 'OK', battery: 'OK', batteryCharger: 'OK', radiatorCooling: 'OK', fuelSystem: 'OK', exhaust: 'OK', turbocharger: 'OK', alternator: 'OK', avr: 'OK', controller: 'OK', breakerAts: 'OK', emergencyStop: 'OK', loadTest: 'OK', generalCondition: 'Good', recommendations: 'Next PMS due Oct 2026', remarks: '' },
    { pmsRecordId: 'pms-002', generatorId: 'gen-031', clientId: 'cli-002', siteId: 'site-003', pmsType: '250-Hour PMS', pmsDate: '2026-08-01', runningHours: 15500, nextPmsDate: '2026-11-01', nextPmsHours: 15750, technicianId: 'tech-002', pmsScope: 'Full 250-hour service', pmsStatus: 'Completed', engineOil: 'Replaced', oilFilter: 'Replaced', fuelFilter: 'Replaced', waterSeparator: 'OK', airFilter: 'Replaced', coolant: 'OK', belts: 'OK', hoses: 'OK', battery: 'OK', batteryCharger: 'OK', radiatorCooling: 'OK', fuelSystem: 'OK', exhaust: 'OK', turbocharger: 'OK', alternator: 'OK', avr: 'OK', controller: 'OK', breakerAts: 'OK', emergencyStop: 'OK', loadTest: 'OK', generalCondition: 'Good', recommendations: '', remarks: '' },
    { pmsRecordId: 'pms-003', generatorId: 'gen-028', clientId: 'cli-006', siteId: 'site-011', pmsType: '250-Hour PMS', pmsDate: '2026-09-05', runningHours: 5200, nextPmsDate: '2026-12-05', nextPmsHours: 5450, technicianId: 'tech-005', pmsScope: 'Full 250-hour service', pmsStatus: 'Completed', engineOil: 'Replaced', oilFilter: 'Replaced', fuelFilter: 'OK', waterSeparator: 'OK', airFilter: 'OK', coolant: 'OK', belts: 'OK', hoses: 'OK', battery: 'OK', batteryCharger: 'OK', radiatorCooling: 'OK', fuelSystem: 'OK', exhaust: 'OK', turbocharger: 'N/A', alternator: 'OK', avr: 'OK', controller: 'OK', breakerAts: 'OK', emergencyStop: 'OK', loadTest: 'OK', generalCondition: 'Good', recommendations: '', remarks: '' },
  ];
  for (const p of pmsRecords) {
    await prisma.pmsRecord.upsert({ where: { pmsRecordId: p.pmsRecordId }, update: p, create: p });
  }
  console.log(`✅ PMS records: ${pmsRecords.length}`);

  // ── Settings ───────────────────────────────────────────────────
  const settings = [
    { key: 'currency', value: 'PHP', notes: 'Default currency' },
    { key: 'voltage', value: '460', notes: 'Standard voltage' },
    { key: 'frequency', value: '60', notes: 'Grid frequency Hz' },
    { key: 'company_name', value: 'Indentrade Systems Corp.', notes: 'Company name' },
    { key: 'pms_interval_default', value: '250', notes: 'Default PMS interval in hours' },
  ];
  for (const s of settings) {
    await prisma.setting.upsert({ where: { key: s.key }, update: s, create: s });
  }
  console.log(`✅ Settings: ${settings.length}`);

  // ── Final Summary ──────────────────────────────────────────────
  const counts = await Promise.all([
    prisma.user.count(),
    prisma.client.count(),
    prisma.site.count(),
    prisma.generator.count(),
    prisma.technician.count(),
    prisma.serviceJob.count(),
    prisma.pmsRecord.count(),
    prisma.partInventory.count(),
    prisma.quotationBilling.count(),
    prisma.deployment.count(),
    prisma.engineModel.count(),
    prisma.serviceType.count(),
    prisma.setting.count(),
    prisma.jobOrderSequence.count(),
  ]);
  const labels = ['Users', 'Clients', 'Sites', 'Generators', 'Technicians', 'ServiceJobs', 'PmsRecords', 'Parts', 'Billing', 'Deployments', 'EngineModels', 'ServiceTypes', 'Settings', 'JOSequences'];
  console.log('\n📊 Database record counts:');
  labels.forEach((l, i) => console.log(`   ${l}: ${counts[i]}`));
  console.log('\n✅ Database seeded successfully!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
