'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Icon from '@/components/ui/AppIcon';
import EmptyState from '@/components/ui/EmptyState';
import Modal from '@/components/ui/Modal';

export type SkillLevel = 'Junior' | 'Mid-Level' | 'Senior' | 'Lead';
export type Availability = 'Available' | 'Deployed' | 'On Leave' | 'Inactive';

export interface Technician {
  id?: string;
  technicianId: string;
  technicianName: string;
  position: string;
  contactNo: string;
  skillLevel: SkillLevel;
  engineExpertise: string;
  controllerExpertise: string;
  electricalExpertise: string;
  mechanicalExpertise: string;
  availability: Availability;
  certifications: string;
  remarks: string;
}

const emptyTech: Omit<Technician, 'id' | 'technicianId'> = {
  technicianName: '',
  position: '',
  contactNo: '',
  skillLevel: 'Junior',
  engineExpertise: '',
  controllerExpertise: '',
  electricalExpertise: '',
  mechanicalExpertise: '',
  availability: 'Available',
  certifications: '',
  remarks: '',
};

const availabilityColors: Record<Availability, string> = {
  Available: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Deployed: 'bg-amber-100 text-amber-700 border-amber-200',
  'On Leave': 'bg-blue-100 text-blue-700 border-blue-200',
  Inactive: 'bg-gray-100 text-gray-500 border-gray-200',
};

const skillColors: Record<SkillLevel, string> = {
  Junior: 'bg-slate-100 text-slate-600',
  'Mid-Level': 'bg-blue-100 text-blue-700',
  Senior: 'bg-violet-100 text-violet-700',
  Lead: 'bg-amber-100 text-amber-700',
};

// Mock data removed — all data comes from the real database API

export default function TechniciansScreen() {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterAvailability, setFilterAvailability] = useState('');
  const [filterSkill, setFilterSkill] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editTech, setEditTech] = useState<Technician | null>(null);
  const [detailTech, setDetailTech] = useState<Technician | null>(null);
  const [form, setForm] = useState(emptyTech);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Technician | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = async () => {
    try {
      setLoading(true);
      let res = await fetch('/api/technicians');
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Server error ${res.status}`);
      }
      const data = await res.json();
      setTechnicians(data);
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to load technicians');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const filtered = useMemo(() => {
    return technicians.filter(t => {
      if (search) {
        const q = search.toLowerCase();
        if (
          !t.technicianName.toLowerCase().includes(q) &&
          !t.position.toLowerCase().includes(q) &&
          !t.contactNo.includes(q) &&
          !t.engineExpertise.toLowerCase().includes(q)
        ) return false;
      }
      if (filterAvailability && t.availability !== filterAvailability) return false;
      if (filterSkill && t.skillLevel !== filterSkill) return false;
      return true;
    });
  }, [technicians, search, filterAvailability, filterSkill]);

  const kpis = useMemo(() => ({
    total: technicians.length,
    available: technicians.filter(t => t.availability === 'Available').length,
    deployed: technicians.filter(t => t.availability === 'Deployed').length,
    onLeave: technicians.filter(t => t.availability === 'On Leave').length,
  }), [technicians]);

  const openCreate = () => {
    setEditTech(null);
    setForm({ ...emptyTech });
    setModalOpen(true);
  };

  const openEdit = (t: Technician) => {
    setEditTech(t);
    setForm({
      technicianName: t.technicianName,
      position: t.position,
      contactNo: t.contactNo,
      skillLevel: t.skillLevel,
      engineExpertise: t.engineExpertise,
      controllerExpertise: t.controllerExpertise,
      electricalExpertise: t.electricalExpertise,
      mechanicalExpertise: t.mechanicalExpertise,
      availability: t.availability,
      certifications: t.certifications,
      remarks: t.remarks,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.technicianName.trim() || !form.position.trim()) return;
    setSaving(true);
    try {
      let res: Response;
      if (editTech) {
        res = await fetch(`/api/technicians/${editTech.technicianId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
      } else {
        res = await fetch('/api/technicians', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Server error ${res.status}`);
      }
      await fetchAll();
      setModalOpen(false);
    } catch (err: unknown) {
      alert((err as Error).message || 'Failed to save technician');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (tech: Technician) => {
    try {
      let res = await fetch(`/api/technicians/${tech.technicianId}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Server error ${res.status}`);
      }
      await fetchAll();
      setDeleteConfirm(null);
      if (detailTech?.technicianId === tech.technicianId) setDetailTech(null);
    } catch (err: unknown) {
      alert((err as Error).message || 'Failed to delete technician');
    }
  };

  const f = (key: keyof typeof emptyTech, val: string) =>
    setForm(prev => ({ ...prev, [key]: val }));

  return (
    <div className="space-y-5">
      {/* Error state */}
      {error && !loading && (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <Icon name="ExclamationCircleIcon" size={40} className="text-red-500" />
          <p className="text-base font-600 text-foreground">Failed to load technicians</p>
          <p className="text-sm text-muted-foreground">{error}</p>
          <button onClick={() => { setError(null); fetchAll(); }} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-500 hover:bg-primary/90 transition-colors">
            <Icon name="ArrowPathIcon" size={15} />Retry
          </button>
        </div>
      )}
      {!error && (
      <>
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-600 text-foreground">Technicians</h1>
          <p className="text-xs text-muted-foreground mt-1">Manage workforce — names, positions, skills, and availability</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-500 rounded-lg hover:bg-primary/90 transition-colors flex-shrink-0"
        >
          <Icon name="PlusIcon" size={16} />
          Add Technician
        </button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: kpis.total, color: 'text-foreground', bg: 'bg-card', icon: 'UsersIcon' },
          { label: 'Available', value: kpis.available, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: 'CheckCircleIcon' },
          { label: 'Deployed', value: kpis.deployed, color: 'text-amber-600', bg: 'bg-amber-50', icon: 'TruckIcon' },
          { label: 'On Leave', value: kpis.onLeave, color: 'text-blue-600', bg: 'bg-blue-50', icon: 'CalendarDaysIcon' },
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
      <div className="bg-card border border-border rounded-xl p-4 flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2 flex-1 min-w-48">
          <Icon name="MagnifyingGlassIcon" size={14} className="text-muted-foreground flex-shrink-0" />
          <input
            type="text"
            placeholder="Search by name, position, expertise..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none flex-1"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-muted-foreground hover:text-foreground">
              <Icon name="XMarkIcon" size={13} />
            </button>
          )}
        </div>
        <select
          value={filterAvailability}
          onChange={e => setFilterAvailability(e.target.value)}
          className="h-9 px-3 rounded-lg border border-input bg-card text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">All Availability</option>
          <option>Available</option>
          <option>Deployed</option>
          <option>On Leave</option>
          <option>Inactive</option>
        </select>
        <select
          value={filterSkill}
          onChange={e => setFilterSkill(e.target.value)}
          className="h-9 px-3 rounded-lg border border-input bg-card text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">All Skill Levels</option>
          <option>Junior</option>
          <option>Mid-Level</option>
          <option>Senior</option>
          <option>Lead</option>
        </select>
        {(filterAvailability || filterSkill || search) && (
          <button
            onClick={() => { setSearch(''); setFilterAvailability(''); setFilterSkill(''); }}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            <Icon name="XMarkIcon" size={13} /> Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Icon name="ArrowPathIcon" size={20} className="animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Loading technicians...</span>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="UsersIcon"
            title="No technicians found"
            description={search || filterAvailability || filterSkill ? 'Try adjusting your filters.' : 'Add your first technician to get started.'}
            action={!search && !filterAvailability && !filterSkill ? { label: 'Add Technician', onClick: openCreate } : undefined}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left px-4 py-3 font-600 text-muted-foreground">Technician</th>
                  <th className="text-left px-4 py-3 font-600 text-muted-foreground">Position</th>
                  <th className="text-left px-4 py-3 font-600 text-muted-foreground hidden md:table-cell">Skill Level</th>
                  <th className="text-left px-4 py-3 font-600 text-muted-foreground hidden lg:table-cell">Contact</th>
                  <th className="text-left px-4 py-3 font-600 text-muted-foreground hidden xl:table-cell">Engine Expertise</th>
                  <th className="text-left px-4 py-3 font-600 text-muted-foreground">Availability</th>
                  <th className="text-right px-4 py-3 font-600 text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(tech => (
                  <tr
                    key={tech.technicianId}
                    className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => setDetailTech(tech)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-700 flex-shrink-0">
                          {tech.technicianName.split(' ').map(n => n[0]).slice(0, 2).join('')}
                        </div>
                        <div>
                          <p className="font-500 text-foreground">{tech.technicianName}</p>
                          <p className="text-2xs text-muted-foreground">{tech.technicianId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-foreground">{tech.position || '—'}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className={`text-2xs font-600 px-2 py-0.5 rounded-md ${skillColors[tech.skillLevel]}`}>
                        {tech.skillLevel}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{tech.contactNo || '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden xl:table-cell">{tech.engineExpertise || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-2xs font-600 px-2 py-0.5 rounded-md border ${availabilityColors[tech.availability as Availability] ?? 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                        {tech.availability}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(tech)}
                          className="p-1.5 rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                          title="Edit"
                        >
                          <Icon name="PencilSquareIcon" size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(tech)}
                          className="p-1.5 rounded-md hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors"
                          title="Delete"
                        >
                          <Icon name="TrashIcon" size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail panel */}
      {detailTech && (
        <div className="fixed inset-0 z-40 flex justify-end" onClick={() => setDetailTech(null)}>
          <div
            className="w-full max-w-md bg-card border-l border-border h-full overflow-y-auto shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border sticky top-0 bg-card z-10">
              <h2 className="text-sm font-600 text-foreground">Technician Details</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { openEdit(detailTech); setDetailTech(null); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-500 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <Icon name="PencilSquareIcon" size={13} />
                  Edit
                </button>
                <button onClick={() => setDetailTech(null)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-colors">
                  <Icon name="XMarkIcon" size={16} />
                </button>
              </div>
            </div>
            <div className="p-5 space-y-5">
              {/* Avatar + name */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary text-lg font-700">
                  {detailTech.technicianName.split(' ').map(n => n[0]).slice(0, 2).join('')}
                </div>
                <div>
                  <p className="text-base font-600 text-foreground">{detailTech.technicianName}</p>
                  <p className="text-xs text-muted-foreground">{detailTech.position}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={`text-2xs font-600 px-2 py-0.5 rounded-md ${skillColors[detailTech.skillLevel]}`}>
                      {detailTech.skillLevel}
                    </span>
                    <span className={`text-2xs font-600 px-2 py-0.5 rounded-md border ${availabilityColors[detailTech.availability as Availability] ?? 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                      {detailTech.availability}
                    </span>
                  </div>
                </div>
              </div>

              <DetailSection title="Contact">
                <DetailRow label="Contact No." value={detailTech.contactNo} />
                <DetailRow label="Technician ID" value={detailTech.technicianId} />
              </DetailSection>

              <DetailSection title="Expertise">
                <DetailRow label="Engine" value={detailTech.engineExpertise} />
                <DetailRow label="Controller" value={detailTech.controllerExpertise} />
                <DetailRow label="Electrical" value={detailTech.electricalExpertise} />
                <DetailRow label="Mechanical" value={detailTech.mechanicalExpertise} />
              </DetailSection>

              {detailTech.certifications && (
                <DetailSection title="Certifications">
                  <p className="text-xs text-foreground">{detailTech.certifications}</p>
                </DetailSection>
              )}

              {detailTech.remarks && (
                <DetailSection title="Remarks">
                  <p className="text-xs text-muted-foreground">{detailTech.remarks}</p>
                </DetailSection>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTech ? `Edit — ${editTech.technicianName}` : 'Add New Technician'}
        size="lg"
      >
        <div className="space-y-4 p-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Full Name *" required>
              <input
                type="text"
                value={form.technicianName}
                onChange={e => f('technicianName', e.target.value)}
                placeholder="e.g. Ricardo Dela Cruz"
                className="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </FormField>
            <FormField label="Position *" required>
              <input
                type="text"
                value={form.position}
                onChange={e => f('position', e.target.value)}
                placeholder="e.g. Lead Technician"
                className="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </FormField>
            <FormField label="Contact No.">
              <input
                type="text"
                value={form.contactNo}
                onChange={e => f('contactNo', e.target.value)}
                placeholder="09XXXXXXXXX"
                className="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </FormField>
            <FormField label="Skill Level">
              <select
                value={form.skillLevel}
                onChange={e => f('skillLevel', e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option>Junior</option>
                <option>Mid-Level</option>
                <option>Senior</option>
                <option>Lead</option>
              </select>
            </FormField>
            <FormField label="Availability">
              <select
                value={form.availability}
                onChange={e => f('availability', e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option>Available</option>
                <option>Deployed</option>
                <option>On Leave</option>
                <option>Inactive</option>
              </select>
            </FormField>
            <FormField label="Engine Expertise">
              <input
                type="text"
                value={form.engineExpertise}
                onChange={e => f('engineExpertise', e.target.value)}
                placeholder="e.g. Cummins, Perkins"
                className="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </FormField>
            <FormField label="Controller Expertise">
              <input
                type="text"
                value={form.controllerExpertise}
                onChange={e => f('controllerExpertise', e.target.value)}
                placeholder="e.g. ComAp, DSE"
                className="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </FormField>
            <FormField label="Electrical Expertise">
              <input
                type="text"
                value={form.electricalExpertise}
                onChange={e => f('electricalExpertise', e.target.value)}
                placeholder="e.g. High, Medium, Low"
                className="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </FormField>
            <FormField label="Mechanical Expertise">
              <input
                type="text"
                value={form.mechanicalExpertise}
                onChange={e => f('mechanicalExpertise', e.target.value)}
                placeholder="e.g. High, Medium, Low"
                className="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </FormField>
            <FormField label="Certifications">
              <input
                type="text"
                value={form.certifications}
                onChange={e => f('certifications', e.target.value)}
                placeholder="e.g. TESDA NC II"
                className="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </FormField>
          </div>
          <FormField label="Remarks">
            <textarea
              value={form.remarks}
              onChange={e => f('remarks', e.target.value)}
              rows={2}
              placeholder="Optional notes..."
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
            />
          </FormField>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
            <button
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-xs font-500 text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !form.technicianName.trim() || !form.position.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-xs font-500 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? <Icon name="ArrowPathIcon" size={13} className="animate-spin" /> : <Icon name="CheckIcon" size={13} />}
              {editTech ? 'Save Changes' : 'Add Technician'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-sm shadow-xl mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <Icon name="TrashIcon" size={18} className="text-red-600" />
              </div>
              <div>
                <p className="text-sm font-600 text-foreground">Delete Technician</p>
                <p className="text-xs text-muted-foreground">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-xs text-foreground mb-5">
              Are you sure you want to delete <strong>{deleteConfirm.technicianName}</strong>?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-xs font-500 border border-border rounded-lg hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2 text-xs font-500 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-2xs font-600 uppercase tracking-widest text-muted-foreground mb-2">{title}</p>
      <div className="bg-muted/40 rounded-lg p-3 space-y-2">{children}</div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-2xs text-muted-foreground flex-shrink-0">{label}</span>
      <span className="text-xs text-foreground text-right">{value || '—'}</span>
    </div>
  );
}

function FormField({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div>
      <label className="block text-xs font-500 text-foreground mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}
