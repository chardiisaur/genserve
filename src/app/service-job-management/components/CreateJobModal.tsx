'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import Modal from '@/components/ui/Modal';
import Icon from '@/components/ui/AppIcon';
import { ServiceJob } from './mockData';

type FormStep = 'details' | 'asset' | 'assignment' | 'scheduling' | 'notes';

const STEPS: { id: FormStep; label: string; icon: string }[] = [
  { id: 'details', label: 'Job Details', icon: 'DocumentTextIcon' },
  { id: 'asset', label: 'Asset Linkage', icon: 'BoltIcon' },
  { id: 'assignment', label: 'Assignment', icon: 'UsersIcon' },
  { id: 'scheduling', label: 'Scheduling', icon: 'CalendarDaysIcon' },
  { id: 'notes', label: 'Field Notes', icon: 'PencilSquareIcon' },
];

interface CreateJobFormData {
  serviceType: string;
  problem: string;
  priority: string;
  clientId: string;
  siteId: string;
  generatorId: string;
  leadTechnicianId: string;
  additionalTechnicianId: string;
  requestDate: string;
  scheduledDate: string;
  startDate: string;
  completionDate: string;
  runningHours: string;
  status: string;
  customerRepresentative: string;
  customerContact: string;
  findings: string;
  workPerformed: string;
  testingResults: string;
  recommendations: string;
  partsMaterialsSummary: string;
  serviceReportNo: string;
  quotationNo: string;
  billingStatus: string;
  remarks: string;
}

interface CreateJobModalProps {
  open: boolean;
  editJob: ServiceJob | null;
  onClose: () => void;
  onCreate: (data: Partial<ServiceJob>) => Promise<void>;
  onUpdate: (job: ServiceJob) => Promise<void>;
}

export default function CreateJobModal({ open, editJob, onClose, onCreate, onUpdate }: CreateJobModalProps) {
  const [step, setStep] = useState<FormStep>('details');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Dynamic data from API
  const [clients, setClients] = useState<{ clientId: string; clientName: string }[]>([]);
  const [sites, setSites] = useState<{ siteId: string; siteName: string; clientId: string }[]>([]);
  const [generators, setGenerators] = useState<{ generatorId: string; assetNo: string; brand: string; model: string; siteId: string }[]>([]);
  const [technicians, setTechnicians] = useState<{ technicianId: string; technicianName: string }[]>([]);
  const [serviceTypes, setServiceTypes] = useState<{ serviceTypeId: string; serviceType: string; defaultPriority: string }[]>([]);

  const isEdit = !!editJob;

  const { register, handleSubmit, watch, reset, setValue, formState: { errors } } = useForm<CreateJobFormData>({
    defaultValues: { priority: 'Normal', status: 'Open', billingStatus: 'Pending' },
  });

  const selectedClientId = watch('clientId');
  const selectedSiteId = watch('siteId');
  const selectedServiceType = watch('serviceType');

  const availableSites = selectedClientId ? sites.filter(s => s.clientId === selectedClientId) : sites;
  const availableGenerators = selectedSiteId ? generators.filter(g => g.siteId === selectedSiteId) : generators;

  // Fetch reference data when modal opens
  useEffect(() => {
    if (!open) return;
    Promise.all([
      fetch('/api/clients').then(r => r.ok ? r.json() : []),
      fetch('/api/sites').then(r => r.ok ? r.json() : []),
      fetch('/api/generators').then(r => r.ok ? r.json() : []),
      fetch('/api/technicians').then(r => r.ok ? r.json() : []),
      fetch('/api/service-types').then(r => r.ok ? r.json() : []),
    ]).then(([c, s, g, t, st]) => {
      setClients(c);
      setSites(s);
      setGenerators(g);
      setTechnicians(t);
      setServiceTypes(st.length > 0 ? st : [
        { serviceTypeId: 'st-001', serviceType: 'PMS', defaultPriority: 'Normal' },
        { serviceTypeId: 'st-002', serviceType: 'Troubleshooting', defaultPriority: 'High' },
        { serviceTypeId: 'st-003', serviceType: 'Repair', defaultPriority: 'High' },
        { serviceTypeId: 'st-004', serviceType: 'Commissioning', defaultPriority: 'High' },
        { serviceTypeId: 'st-005', serviceType: 'Synchronization', defaultPriority: 'Critical' },
        { serviceTypeId: 'st-006', serviceType: 'Inspection', defaultPriority: 'Normal' },
        { serviceTypeId: 'st-007', serviceType: 'Load Test', defaultPriority: 'High' },
        { serviceTypeId: 'st-008', serviceType: 'Emergency Call', defaultPriority: 'Critical' },
      ]);
    }).catch(() => {});
  }, [open]);

  // Auto-set priority when service type changes
  useEffect(() => {
    const st = serviceTypes.find(s => s.serviceType === selectedServiceType);
    if (st) setValue('priority', st.defaultPriority);
  }, [selectedServiceType, setValue, serviceTypes]);

  // Populate form when editing
  useEffect(() => {
    if (editJob && open) {
      reset({
        serviceType: editJob.serviceType,
        problem: editJob.problem,
        priority: editJob.priority,
        clientId: editJob.clientId,
        siteId: editJob.siteId,
        generatorId: editJob.generatorId,
        leadTechnicianId: editJob.leadTechnicianId,
        additionalTechnicianId: '',
        requestDate: editJob.requestDate,
        scheduledDate: editJob.scheduledDate,
        startDate: editJob.startDate || '',
        completionDate: editJob.completionDate || '',
        runningHours: editJob.runningHours?.toString() || '',
        status: editJob.status,
        customerRepresentative: editJob.customerRepresentative || '',
        customerContact: editJob.customerContact || '',
        findings: editJob.findings || '',
        workPerformed: editJob.workPerformed || '',
        testingResults: editJob.testingResults || '',
        recommendations: editJob.recommendations || '',
        partsMaterialsSummary: editJob.partsMaterialsSummary || '',
        serviceReportNo: editJob.serviceReportNo || '',
        quotationNo: editJob.quotationNo || '',
        billingStatus: editJob.billingStatus,
        remarks: editJob.remarks || '',
      });
      setStep('details');
    } else if (!editJob && open) {
      reset({ priority: 'Normal', status: 'Open', billingStatus: 'Pending' });
      setStep('details');
    }
    setSubmitError(null);
  }, [editJob, open, reset]);

  const onSubmit = async (data: CreateJobFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const jobData: Partial<ServiceJob> = {
        serviceType: data.serviceType,
        problem: data.problem,
        priority: data.priority as ServiceJob['priority'],
        clientId: data.clientId,
        clientName: clients.find(c => c.clientId === data.clientId)?.clientName || data.clientId,
        siteId: data.siteId,
        siteName: availableSites.find(s => s.siteId === data.siteId)?.siteName || data.siteId,
        generatorId: data.generatorId,
        generatorName: availableGenerators.find(g => g.generatorId === data.generatorId)
          ? `${availableGenerators.find(g => g.generatorId === data.generatorId)?.assetNo} / ${availableGenerators.find(g => g.generatorId === data.generatorId)?.brand} ${availableGenerators.find(g => g.generatorId === data.generatorId)?.model}`
          : data.generatorId,
        leadTechnicianId: data.leadTechnicianId || undefined,
        leadTechnicianName: technicians.find(t => t.technicianId === data.leadTechnicianId)?.technicianName || data.leadTechnicianId,
        additionalTechnicianId: data.additionalTechnicianId || undefined,
        additionalTechnicianName: technicians.find(t => t.technicianId === data.additionalTechnicianId)?.technicianName || undefined,
        requestDate: data.requestDate || new Date().toLocaleDateString('en-PH'),
        scheduledDate: data.scheduledDate || '',
        startDate: data.startDate || undefined,
        completionDate: data.completionDate || undefined,
        runningHours: data.runningHours ? Number(data.runningHours) : undefined,
        status: data.status as ServiceJob['status'],
        customerRepresentative: data.customerRepresentative || undefined,
        customerContact: data.customerContact || undefined,
        findings: data.findings || undefined,
        workPerformed: data.workPerformed || undefined,
        testingResults: data.testingResults || undefined,
        recommendations: data.recommendations || undefined,
        partsMaterialsSummary: data.partsMaterialsSummary || undefined,
        serviceReportNo: data.serviceReportNo || undefined,
        quotationNo: data.quotationNo || undefined,
        billingStatus: data.billingStatus as ServiceJob['billingStatus'],
        remarks: data.remarks || undefined,
      };

      if (isEdit && editJob) {
        await onUpdate({ ...editJob, ...jobData });
      } else {
        await onCreate(jobData);
      }
    } catch (err: unknown) {
      setSubmitError((err as Error).message || 'Failed to save job. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentStepIdx = STEPS.findIndex(s => s.id === step);

  const footer = (
    <div className="flex items-center justify-between w-full">
      <button type="button" onClick={() => { if (currentStepIdx > 0) setStep(STEPS[currentStepIdx - 1].id); else onClose(); }}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-lg hover:bg-muted">
        <Icon name="ChevronLeftIcon" size={15} />
        {currentStepIdx === 0 ? 'Cancel' : 'Back'}
      </button>
      <div className="flex items-center gap-2">
        {submitError && <p className="text-xs text-red-600 max-w-xs truncate">{submitError}</p>}
        {currentStepIdx < STEPS.length - 1 ? (
          <button type="button" onClick={() => setStep(STEPS[currentStepIdx + 1].id)}
            className="flex items-center gap-1.5 bg-primary text-primary-foreground text-sm font-500 px-4 py-2 rounded-lg hover:bg-primary/90 active:scale-95 transition-all duration-150">
            Next<Icon name="ChevronRightIcon" size={15} />
          </button>
        ) : (
          <button type="submit" form="create-job-form" disabled={isSubmitting}
            className="flex items-center gap-2 bg-primary text-primary-foreground text-sm font-500 px-5 py-2 rounded-lg hover:bg-primary/90 active:scale-95 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed min-w-[120px] justify-center">
            {isSubmitting ? <><Icon name="ArrowPathIcon" size={15} className="animate-spin" />Saving...</> : <><Icon name="CheckIcon" size={15} />{isEdit ? 'Update Job' : 'Create Job'}</>}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? `Edit Job — ${editJob?.jobOrderNo}` : 'Create New Service Job'}
      subtitle={isEdit ? 'Update job details, assignment, and field notes' : 'Fill in all required fields to create a new service job'}
      size="xl" footer={footer}>
      {/* Step indicator */}
      <div className="flex items-center gap-0 mb-6 overflow-x-auto scrollbar-thin pb-1">
        {STEPS.map((s, i) => (
          <React.Fragment key={s.id}>
            <button type="button" onClick={() => setStep(s.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-500 transition-all duration-150 whitespace-nowrap flex-shrink-0 ${step === s.id ? 'bg-primary text-primary-foreground' : i < currentStepIdx ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}>
              <Icon name={s.icon as Parameters<typeof Icon>[0]['name']} size={13} />
              {s.label}
            </button>
            {i < STEPS.length - 1 && <Icon name="ChevronRightIcon" size={12} className="text-muted-foreground/40 flex-shrink-0 mx-0.5" />}
          </React.Fragment>
        ))}
      </div>

      <form id="create-job-form" onSubmit={handleSubmit(onSubmit)}>
        {step === 'details' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-500 text-foreground mb-1.5">Service Type <span className="text-red-500">*</span></label>
                <select {...register('serviceType', { required: true })}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30">
                  <option value="">Select service type...</option>
                  {serviceTypes.map(st => <option key={st.serviceTypeId} value={st.serviceType}>{st.serviceType}</option>)}
                </select>
                {errors.serviceType && <p className="text-xs text-red-500 mt-1">Service type is required</p>}
              </div>
              <div>
                <label className="block text-xs font-500 text-foreground mb-1.5">Priority</label>
                <select {...register('priority')} className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30">
                  <option>Normal</option><option>High</option><option>Critical</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-500 text-foreground mb-1.5">Status</label>
                <select {...register('status')} className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30">
                  <option>Open</option><option>In Progress</option><option>Completed</option><option>Closed</option><option>Cancelled</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-500 text-foreground mb-1.5">Problem / Description</label>
                <textarea {...register('problem')} rows={3} placeholder="Describe the problem or service request..."
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
              </div>
            </div>
          </div>
        )}

        {step === 'asset' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-500 text-foreground mb-1.5">Client <span className="text-red-500">*</span></label>
                <select {...register('clientId', { required: true })}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30">
                  <option value="">Select client...</option>
                  {clients.map(c => <option key={c.clientId} value={c.clientId}>{c.clientName}</option>)}
                </select>
                {errors.clientId && <p className="text-xs text-red-500 mt-1">Client is required</p>}
              </div>
              <div>
                <label className="block text-xs font-500 text-foreground mb-1.5">Site <span className="text-red-500">*</span></label>
                <select {...register('siteId', { required: true })}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30">
                  <option value="">Select site...</option>
                  {availableSites.map(s => <option key={s.siteId} value={s.siteId}>{s.siteName}</option>)}
                </select>
                {errors.siteId && <p className="text-xs text-red-500 mt-1">Site is required</p>}
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-500 text-foreground mb-1.5">Generator <span className="text-red-500">*</span></label>
                <select {...register('generatorId', { required: true })}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30">
                  <option value="">Select generator...</option>
                  {availableGenerators.map(g => <option key={g.generatorId} value={g.generatorId}>{g.assetNo} / {g.brand} {g.model}</option>)}
                </select>
                {errors.generatorId && <p className="text-xs text-red-500 mt-1">Generator is required</p>}
              </div>
            </div>
          </div>
        )}

        {step === 'assignment' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-500 text-foreground mb-1.5">Lead Technician</label>
                <select {...register('leadTechnicianId')} className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30">
                  <option value="">Select technician...</option>
                  {technicians.map(t => <option key={t.technicianId} value={t.technicianId}>{t.technicianName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-500 text-foreground mb-1.5">Additional Technician</label>
                <select {...register('additionalTechnicianId')} className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30">
                  <option value="">None</option>
                  {technicians.map(t => <option key={t.technicianId} value={t.technicianId}>{t.technicianName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-500 text-foreground mb-1.5">Customer Representative</label>
                <input {...register('customerRepresentative')} placeholder="Name of customer rep"
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="block text-xs font-500 text-foreground mb-1.5">Customer Contact</label>
                <input {...register('customerContact')} placeholder="Contact number"
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
            </div>
          </div>
        )}

        {step === 'scheduling' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-500 text-foreground mb-1.5">Request Date <span className="text-red-500">*</span></label>
                <input {...register('requestDate', { required: true })} type="date"
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30" />
                {errors.requestDate && <p className="text-xs text-red-500 mt-1">Request date is required</p>}
              </div>
              <div>
                <label className="block text-xs font-500 text-foreground mb-1.5">Scheduled Date</label>
                <input {...register('scheduledDate')} type="date"
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="block text-xs font-500 text-foreground mb-1.5">Start Date</label>
                <input {...register('startDate')} type="date"
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="block text-xs font-500 text-foreground mb-1.5">Completion Date</label>
                <input {...register('completionDate')} type="date"
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="block text-xs font-500 text-foreground mb-1.5">Running Hours</label>
                <input {...register('runningHours')} type="number" min="0" placeholder="Current running hours"
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="block text-xs font-500 text-foreground mb-1.5">Billing Status</label>
                <select {...register('billingStatus')} className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30">
                  <option>Pending</option><option>Quoted</option><option>Approved</option><option>Invoiced</option><option>Paid</option><option>Cancelled</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {step === 'notes' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {[
                { name: 'findings', label: 'Findings' },
                { name: 'workPerformed', label: 'Work Performed' },
                { name: 'testingResults', label: 'Testing Results' },
                { name: 'recommendations', label: 'Recommendations' },
                { name: 'partsMaterialsSummary', label: 'Parts / Materials Summary' },
              ].map(field => (
                <div key={field.name}>
                  <label className="block text-xs font-500 text-foreground mb-1.5">{field.label}</label>
                  <textarea {...register(field.name as keyof CreateJobFormData)} rows={2} placeholder={`Enter ${field.label.toLowerCase()}...`}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-500 text-foreground mb-1.5">Service Report No.</label>
                  <input {...register('serviceReportNo')} placeholder="SR-YYYY-XXXX"
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="block text-xs font-500 text-foreground mb-1.5">Quotation No.</label>
                  <input {...register('quotationNo')} placeholder="QT-YYYY-XXXX"
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-500 text-foreground mb-1.5">Remarks</label>
                <textarea {...register('remarks')} rows={2} placeholder="Additional remarks..."
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
              </div>
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
}