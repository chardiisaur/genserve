/**
 * Centralized constants for Manpower positions and skillsets.
 * Used by TechniciansScreen, API routes, and any other component
 * that needs to display or validate manpower data.
 */

export const MANPOWER_POSITIONS = [
  'Service Technician',
  'Senior Technician',
  'Lead Technician',
  'Electrician',
  'Welder',
  'Mechanic',
  'Service Engineer',
  'Supervisor',
  'Helper',
  'Driver',
  'Other',
] as const;

export type ManpowerPosition = typeof MANPOWER_POSITIONS[number];

export const MANPOWER_SKILLSETS = [
  'Generator Set',
  'Engine',
  'Electrical',
  'Synchronization',
  'ATS',
  'Control Panel',
  'Preventive Maintenance',
  'Troubleshooting',
  'Installation',
  'Commissioning',
  'Welding/Fabrication',
  'Mechanical',
  'Auto Electrical',
  'AVR',
  'Governor',
  'Controller',
  'Load Bank Testing',
  'Other',
] as const;

export type ManpowerSkillset = typeof MANPOWER_SKILLSETS[number];

/** Parse skillsets from the JSON string stored in the database */
export function parseSkillsets(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    // Legacy: if stored as comma-separated string
    if (typeof raw === 'string' && raw.trim()) {
      return raw.split(',').map(s => s.trim()).filter(Boolean);
    }
    return [];
  }
}

/** Serialize skillsets array to JSON string for database storage */
export function serializeSkillsets(skillsets: string[]): string {
  return JSON.stringify(skillsets);
}
