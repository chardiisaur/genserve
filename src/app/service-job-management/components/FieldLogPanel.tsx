'use client';

import React, { useState } from 'react';
import Icon from '@/components/ui/AppIcon';
import StatusBadge from '@/components/ui/StatusBadge';
import { ServiceJob, JobStatus } from './mockData';
import { SparePart } from '@/app/parts-inventory/components/PartsInventoryScreen';

// Inline parts list for field logging (subset of inventory)
const availableParts: Pick<SparePart, 'id' | 'partNo' | 'partDescription' | 'unit' | 'stockQty'>[] = [
  { id: 'pt-001', partNo: 'CUM-3401544', partDescription: 'Engine Oil Filter', unit: 'pc', stockQty: 24 },
  { id: 'pt-002', partNo: 'CUM-3315843', partDescription: 'Fuel Filter Primary', unit: 'pc', stockQty: 6 },
  { id: 'pt-003', partNo: 'MIT-ME013262', partDescription: 'Air Filter Element', unit: 'pc', stockQty: 3 },
  { id: 'pt-004', partNo: 'CUM-3803619', partDescription: 'Water Pump Seal Kit', unit: 'set', stockQty: 12 },
  { id: 'pt-006', partNo: 'CUM-3803698', partDescription: 'Coolant Hose Upper Radiator', unit: 'pc', stockQty: 8 },
  { id: 'pt-007', partNo: 'MIT-ME013300', partDescription: 'Fuel Injection Nozzle', unit: 'pc', stockQty: 4 },
  { id: 'pt-008', partNo: 'BAT-12V-200AH', partDescription: 'Battery 12V 200AH', unit: 'pc', stockQty: 5 },
  { id: 'pt-009', partNo: 'CUM-3803456', partDescription: 'Lube Oil (15W-40) 4L', unit: 'gal', stockQty: 40 },
  { id: 'pt-011', partNo: 'AVR-SX460-001', partDescription: 'AVR Module SX460', unit: 'pc', stockQty: 3 },
  { id: 'pt-012', partNo: 'CUM-3803700', partDescription: 'Fuel Filter Secondary', unit: 'pc', stockQty: 15 },
];

export interface FieldLogEntry {
  id: string;
  timestamp: string;
  loggedBy: string;
  workDone: string;
  findings: string;
  partsUsed: { partId: string; partNo: string; partDescription: string; qty: number; unit: string }[];
  statusUpdate: JobStatus | '';
}

interface FieldLogPanelProps {
  job: ServiceJob;
  onUpdateJob: (updated: ServiceJob) => void;
}

export default function FieldLogPanel({ job, onUpdateJob }: FieldLogPanelProps) {
  const [logs, setLogs] = useState<FieldLogEntry[]>(() => {
    // Pre-populate with existing field data if present
    const initial: FieldLogEntry[] = [];
    if (job.findings || job.workPerformed) {
      initial.push({
        id: `log-init-${job.id}`,
        timestamp: job.startDate || job.scheduledDate,
        loggedBy: job.leadTechnicianName,
        workDone: job.workPerformed || '',
        findings: job.findings || '',
        partsUsed: [],
        statusUpdate: '',
      });
    }
    return initial;
  });

  const [newLog, setNewLog] = useState({ workDone: '', findings: '', statusUpdate: '' as JobStatus | '' });
  const [partsUsed, setPartsUsed] = useState<{ partId: string; partNo: string; partDescription: string; qty: number; unit: string }[]>([]);
  const [selectedPartId, setSelectedPartId] = useState('');
  const [partQty, setPartQty] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const addPartToLog = () => {
    const part = availableParts.find(p => p.id === selectedPartId);
    if (!part) return;
    const existing = partsUsed.find(p => p.partId === selectedPartId);
    if (existing) {
      setPartsUsed(prev => prev.map(p => p.partId === selectedPartId ? { ...p, qty: p.qty + partQty } : p));
    } else {
      setPartsUsed(prev => [...prev, { partId: part.id, partNo: part.partNo, partDescription: part.partDescription, qty: partQty, unit: part.unit }]);
    }
    setSelectedPartId('');
    setPartQty(1);
  };

  const removePartFromLog = (partId: string) => {
    setPartsUsed(prev => prev.filter(p => p.partId !== partId));
  };

  const handleSubmitLog = async () => {
    if (!newLog.workDone.trim() && !newLog.findings.trim()) return;
    setIsSubmitting(true);
    await new Promise(r => setTimeout(r, 600));

    const entry: FieldLogEntry = {
      id: `log-${Date.now()}`,
      timestamp: '11 Sep 2026',
      loggedBy: job.leadTechnicianName,
      workDone: newLog.workDone,
      findings: newLog.findings,
      partsUsed: [...partsUsed],
      statusUpdate: newLog.statusUpdate,
    };

    setLogs(prev => [entry, ...prev]);

    // Update the job with latest field data
    const updatedJob: ServiceJob = {
      ...job,
      findings: newLog.findings || job.findings,
      workPerformed: newLog.workDone || job.workPerformed,
      partsMaterialsSummary: partsUsed.length > 0
        ? partsUsed.map(p => `${p.partDescription} x${p.qty} ${p.unit}`).join(', ')
        : job.partsMaterialsSummary,
      ...(newLog.statusUpdate ? { status: newLog.statusUpdate } : {}),
    };
    onUpdateJob(updatedJob);

    setNewLog({ workDone: '', findings: '', statusUpdate: '' });
    setPartsUsed([]);
    setIsSubmitting(false);
    setShowForm(false);
  };

  const statusOptions: JobStatus[] = ['Open', 'In Progress', 'Completed', 'Closed', 'Cancelled'];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-2xs font-600 uppercase tracking-wider text-muted-foreground">Field Log</p>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 text-xs font-500 text-primary hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors border border-primary/30"
          >
            <Icon name="PlusIcon" size={13} />
            Add Log Entry
          </button>
        )}
      </div>

      {/* New log form */}
      {showForm && (
        <div className="bg-muted/30 border border-border rounded-xl p-4 space-y-3">
          <p className="text-xs font-600 text-foreground">New Field Log Entry</p>

          <div>
            <label className="block text-2xs font-500 text-muted-foreground mb-1.5">Work Done *</label>
            <textarea
              value={newLog.workDone}
              onChange={e => setNewLog(n => ({ ...n, workDone: e.target.value }))}
              rows={3}
              placeholder="Describe the work performed in the field..."
              className="w-full text-xs bg-card border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none text-foreground"
            />
          </div>

          <div>
            <label className="block text-2xs font-500 text-muted-foreground mb-1.5">Findings / Observations</label>
            <textarea
              value={newLog.findings}
              onChange={e => setNewLog(n => ({ ...n, findings: e.target.value }))}
              rows={2}
              placeholder="Any findings, faults, or observations..."
              className="w-full text-xs bg-card border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none text-foreground"
            />
          </div>

          {/* Parts used */}
          <div>
            <label className="block text-2xs font-500 text-muted-foreground mb-1.5">Parts / Materials Used</label>
            <div className="flex gap-2 mb-2">
              <select
                value={selectedPartId}
                onChange={e => setSelectedPartId(e.target.value)}
                className="flex-1 text-xs bg-card border border-border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground"
              >
                <option value="">Select part...</option>
                {availableParts.map(p => (
                  <option key={p.id} value={p.id}>{p.partNo} — {p.partDescription} (Stock: {p.stockQty})</option>
                ))}
              </select>
              <input
                type="number"
                min={1}
                value={partQty}
                onChange={e => setPartQty(Number(e.target.value) || 1)}
                className="w-16 text-xs bg-card border border-border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground text-center"
              />
              <button
                type="button"
                onClick={addPartToLog}
                disabled={!selectedPartId}
                className="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Add
              </button>
            </div>
            {partsUsed.length > 0 && (
              <div className="space-y-1.5">
                {partsUsed.map(p => (
                  <div key={p.partId} className="flex items-center justify-between bg-card border border-border rounded-lg px-3 py-2">
                    <div>
                      <span className="text-2xs font-600 text-foreground font-mono">{p.partNo}</span>
                      <span className="text-2xs text-muted-foreground ml-2">{p.partDescription}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xs font-600 text-foreground">{p.qty} {p.unit}</span>
                      <button onClick={() => removePartFromLog(p.partId)} className="text-muted-foreground hover:text-red-500 transition-colors">
                        <Icon name="XMarkIcon" size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Status update */}
          <div>
            <label className="block text-2xs font-500 text-muted-foreground mb-1.5">Update Job Status (optional)</label>
            <select
              value={newLog.statusUpdate}
              onChange={e => setNewLog(n => ({ ...n, statusUpdate: e.target.value as JobStatus | '' }))}
              className="w-full text-xs bg-card border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground"
            >
              <option value="">— Keep current status ({job.status}) —</option>
              {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button type="button" onClick={() => { setShowForm(false); setPartsUsed([]); setNewLog({ workDone: '', findings: '', statusUpdate: '' }); }} className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-muted transition-colors">
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmitLog}
              disabled={isSubmitting || (!newLog.workDone.trim() && !newLog.findings.trim())}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              {isSubmitting ? <><Icon name="ArrowPathIcon" size={12} className="animate-spin" /> Saving...</> : <><Icon name="CheckIcon" size={12} /> Submit Log</>}
            </button>
          </div>
        </div>
      )}

      {/* Log entries */}
      {logs.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground">
          <Icon name="ClipboardDocumentListIcon" size={28} className="mx-auto mb-2 opacity-40" />
          <p className="text-xs">No field log entries yet.</p>
          <p className="text-2xs mt-0.5">Technicians can log work done, findings, and parts used here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map(log => (
            <div key={log.id} className="bg-muted/20 border border-border rounded-xl p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon name="UserIcon" size={12} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-600 text-foreground">{log.loggedBy}</p>
                    <p className="text-2xs text-muted-foreground">{log.timestamp}</p>
                  </div>
                </div>
                {log.statusUpdate && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-2xs text-muted-foreground">Status →</span>
                    <StatusBadge status={log.statusUpdate} size="sm" />
                  </div>
                )}
              </div>
              {log.workDone && (
                <div>
                  <p className="text-2xs font-600 text-muted-foreground mb-0.5">Work Done</p>
                  <p className="text-xs text-foreground leading-relaxed">{log.workDone}</p>
                </div>
              )}
              {log.findings && (
                <div>
                  <p className="text-2xs font-600 text-muted-foreground mb-0.5">Findings</p>
                  <p className="text-xs text-foreground leading-relaxed">{log.findings}</p>
                </div>
              )}
              {log.partsUsed.length > 0 && (
                <div>
                  <p className="text-2xs font-600 text-muted-foreground mb-1.5">Parts Used</p>
                  <div className="flex flex-wrap gap-1.5">
                    {log.partsUsed.map(p => (
                      <span key={p.partId} className="inline-flex items-center gap-1 text-2xs bg-card border border-border rounded-full px-2.5 py-1 font-500">
                        <Icon name="WrenchIcon" size={10} className="text-muted-foreground" />
                        {p.partDescription} × {p.qty} {p.unit}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
