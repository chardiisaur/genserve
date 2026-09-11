'use client';

import React, { useState } from 'react';
import Icon from '@/components/ui/AppIcon';
import StatusBadge from '@/components/ui/StatusBadge';
import { ServiceJob, JobStatus } from './mockData';
import FieldLogPanel from './FieldLogPanel';

interface JobDetailDrawerProps {
  job: ServiceJob | null;
  onClose: () => void;
  onEdit: (job: ServiceJob) => void;
  onStatusChange: (job: ServiceJob, status: JobStatus) => void;
  onUpdateJob?: (updated: ServiceJob) => void;
}

type DrawerTab = 'details' | 'fieldlog';

export default function JobDetailDrawer({ job, onClose, onEdit, onStatusChange, onUpdateJob }: JobDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState<DrawerTab>('details');

  if (!job) return null;

  const statusOptions: JobStatus[] = ['Open', 'In Progress', 'Completed', 'Closed', 'Cancelled'];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-foreground/20 z-40 fade-in"
        onClick={onClose}
      />
      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-xl bg-card border-l border-border shadow-modal z-50 flex flex-col slide-up overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-base font-700 text-foreground">{job.jobOrderNo}</h2>
              <StatusBadge status={job.status} dot />
            </div>
            <p className="text-xs text-muted-foreground">{job.serviceType} · {job.clientName}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(job)}
              className="flex items-center gap-1.5 text-xs font-500 text-primary hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Icon name="PencilSquareIcon" size={14} />
              Edit
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-colors"
              aria-label="Close detail panel"
            >
              <Icon name="XMarkIcon" size={18} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border flex-shrink-0">
          <button
            onClick={() => setActiveTab('details')}
            className={`flex items-center gap-1.5 px-5 py-3 text-xs font-500 transition-colors border-b-2 ${activeTab === 'details' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            <Icon name="DocumentTextIcon" size={13} />
            Job Details
          </button>
          <button
            onClick={() => setActiveTab('fieldlog')}
            className={`flex items-center gap-1.5 px-5 py-3 text-xs font-500 transition-colors border-b-2 ${activeTab === 'fieldlog' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            <Icon name="ClipboardDocumentListIcon" size={13} />
            Field Log
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-5 space-y-5">
          {activeTab === 'details' ? (
            <>
              {/* Priority + Billing */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className="text-2xs text-muted-foreground font-500">Priority:</span>
                  <StatusBadge status={job.priority} size="sm" />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-2xs text-muted-foreground font-500">Billing:</span>
                  <StatusBadge status={job.billingStatus} size="sm" />
                </div>
                {job.serviceReportNo && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-2xs text-muted-foreground font-500">Report:</span>
                    <span className="text-2xs font-600 text-foreground">{job.serviceReportNo}</span>
                  </div>
                )}
              </div>

              {/* Status change */}
              <div>
                <p className="text-2xs font-600 uppercase tracking-wider text-muted-foreground mb-2">Change Status</p>
                <div className="flex gap-2 flex-wrap">
                  {statusOptions.map(s => (
                    <button
                      key={`detail-status-${s}`}
                      onClick={() => onStatusChange(job, s)}
                      className={`
                        text-xs px-3 py-1.5 rounded-lg border font-500 transition-all duration-150 active:scale-95
                        ${job.status === s
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-border text-foreground hover:border-primary/40 hover:bg-primary/5'
                        }
                      `}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <hr className="border-border" />

              {/* Asset linkage */}
              <DetailSection title="Asset Information">
                <DetailGrid>
                  <DetailField label="Client" value={job.clientName} />
                  <DetailField label="Site" value={job.siteName} />
                  <DetailField label="Generator" value={job.generatorName} />
                  {job.runningHours !== undefined && (
                    <DetailField label="Running Hours" value={`${job.runningHours.toLocaleString()} hrs`} mono />
                  )}
                </DetailGrid>
              </DetailSection>

              {/* Job details */}
              <DetailSection title="Job Details">
                <DetailGrid>
                  <DetailField label="Request Date" value={job.requestDate} />
                  <DetailField label="Scheduled Date" value={job.scheduledDate} />
                  {job.startDate && <DetailField label="Start Date" value={job.startDate} />}
                  {job.completionDate && <DetailField label="Completion Date" value={job.completionDate} />}
                </DetailGrid>
                <div className="mt-3">
                  <p className="text-2xs font-500 text-muted-foreground mb-1">Problem / Request</p>
                  <p className="text-xs text-foreground leading-relaxed bg-muted/40 rounded-lg p-3">{job.problem}</p>
                </div>
              </DetailSection>

              {/* Assignment */}
              <DetailSection title="Assignment">
                <DetailGrid>
                  <DetailField label="Lead Technician" value={job.leadTechnicianName} />
                  {job.additionalTechnicianName && (
                    <DetailField label="Additional Technician" value={job.additionalTechnicianName} />
                  )}
                  {job.customerRepresentative && (
                    <DetailField label="Customer Rep." value={job.customerRepresentative} />
                  )}
                  {job.customerContact && (
                    <DetailField label="Customer Contact" value={job.customerContact} />
                  )}
                </DetailGrid>
              </DetailSection>

              {/* Field notes */}
              {(job.findings || job.workPerformed || job.testingResults || job.recommendations) && (
                <DetailSection title="Field Notes">
                  {job.findings && (
                    <div className="mb-3">
                      <p className="text-2xs font-500 text-muted-foreground mb-1">Findings</p>
                      <p className="text-xs text-foreground leading-relaxed">{job.findings}</p>
                    </div>
                  )}
                  {job.workPerformed && (
                    <div className="mb-3">
                      <p className="text-2xs font-500 text-muted-foreground mb-1">Work Performed</p>
                      <p className="text-xs text-foreground leading-relaxed">{job.workPerformed}</p>
                    </div>
                  )}
                  {job.testingResults && (
                    <div className="mb-3">
                      <p className="text-2xs font-500 text-muted-foreground mb-1">Testing / Results</p>
                      <p className="text-xs text-foreground leading-relaxed">{job.testingResults}</p>
                    </div>
                  )}
                  {job.recommendations && (
                    <div>
                      <p className="text-2xs font-500 text-muted-foreground mb-1">Recommendations</p>
                      <p className="text-xs text-foreground leading-relaxed">{job.recommendations}</p>
                    </div>
                  )}
                </DetailSection>
              )}

              {/* Parts summary */}
              {job.partsMaterialsSummary && (
                <DetailSection title="Parts / Materials Summary">
                  <p className="text-xs text-foreground leading-relaxed bg-muted/40 rounded-lg p-3">{job.partsMaterialsSummary}</p>
                </DetailSection>
              )}

              {/* Billing */}
              {(job.quotationNo || job.serviceReportNo) && (
                <DetailSection title="Billing & Reports">
                  <DetailGrid>
                    {job.quotationNo && <DetailField label="Quotation No." value={job.quotationNo} mono />}
                    {job.serviceReportNo && <DetailField label="Service Report No." value={job.serviceReportNo} mono />}
                  </DetailGrid>
                </DetailSection>
              )}

              {job.remarks && (
                <DetailSection title="Remarks">
                  <p className="text-xs text-foreground leading-relaxed bg-amber-50/50 border border-amber-100 rounded-lg p-3">{job.remarks}</p>
                </DetailSection>
              )}
            </>
          ) : (
            <FieldLogPanel
              job={job}
              onUpdateJob={(updated) => {
                onStatusChange(updated, updated.status);
                if (onUpdateJob) onUpdateJob(updated);
              }}
            />
          )}
        </div>
      </div>
    </>
  );
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-2xs font-600 uppercase tracking-wider text-muted-foreground mb-2.5">{title}</p>
      {children}
    </div>
  );
}

function DetailGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
      {children}
    </div>
  );
}

function DetailField({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-2xs text-muted-foreground font-500 mb-0.5">{label}</p>
      <p className={`text-xs text-foreground font-500 ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  );
}