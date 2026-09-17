'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import Modal from '@/components/ui/Modal';
import Icon from '@/components/ui/AppIcon';
import { ServiceJob } from './mockData';

type FormStep = 'details' | 'asset' | 'assignment' | 'fieldwork' | 'notes';

const STEPS: { id: FormStep; label: string; icon: string }[] = [
  { id: 'details', label: 'Job Info', icon: 'DocumentTextIcon' },
  { id: 'asset', label: 'Asset', icon: 'BoltIcon' },
  { id: 'assignment', label: 'Assignment', icon: 'UsersIcon' },
  { id: 'fieldwork', label: 'Field Work', icon: 'CalendarDaysIcon' },
  { id: 'notes', label: 'Notes', icon: 'PencilSquareIcon' },
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

interface ApiClient { clientId: string; clientName: string }
interface ApiSite { siteId: string; siteName: string; clientId: string }
interface ApiGenerator { generatorId: string; assetNo: string; brand: string; model: string; siteId: string }
interface ApiTechnician { technicianId: string; technicianName: string }
interface ApiServiceType { serviceTypeId: string; serviceType: string; defaultPriority: string }

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

  // Reference data
  const [clients, setClients] = useState<ApiClient[]>([]);
  const [allSites, setAllSites] = useState<ApiSite[]>([]);
  const [allGenerators, setAllGenerators] = useState<ApiGenerator[]>([]);
  const [technicians, setTechnicians] = useState<ApiTechnician[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ApiServiceType[]>([]);
  const [loadingRef, setLoadingRef] = useState(false);

  // Cascading state
  const [filteredSites, setFilteredSites] = useState<ApiSite[]>([]);
  const [filteredGenerators, setFilteredGenerators] = useState<ApiGenerator[]>([]);

  const isEdit = !!editJob;

  const { register, handleSubmit, watch, reset, setValue, formState: { errors } } = useForm<CreateJobFormData>({
    defaultValues: { priority: 'Normal', status: 'Open', billingStatus: 'Pending' },
  });

  const selectedClientId = watch('clientId');
  const selectedSiteId = watch('siteId');
  const selectedServiceType = watch('serviceType');

  // Fetch all reference data when modal opens
  useEffect(() => {
    if (!open) return;
    setLoadingRef(true);
    Promise.all([
      fetch('/api/clients').then(r => r.ok ? r.json() : []),
      fetch('/api/sites').then(r => r.ok ? r.json() : []),
      fetch('/api/generators').then(r => r.ok ? r.json() : []),
      fetch('/api/technicians').then(r => r.ok ? r.json() : []),
      fetch('/api/service-types').then(r => r.ok ? r.json() : []),
    ]).then(([c, s, g, t, st]) => {
      setClients(Array.isArray(c) ? c : []);
      setAllSites(Array.isArray(s) ? s : []);
      setAllGenerators(Array.isArray(g) ? g : []);
      setTechnicians(Array.isArray(t) ? t : []);
      setServiceTypes(Array.isArray(st) ? st : []);
    }).catch(() => {
      // silently fail — user will see empty dropdowns
    }).finally(() => setLoadingRef(false));
  }, [open]);

  // Cascade: when client changes, filter sites and reset site/generator
  useEffect(() => {
    if (!selectedClientId) {
      setFilteredSites(allSites);
      setFilteredGenerators([]);
      return;
    }
    const sites = allSites.filter(s => s.clientId === selectedClientId);
    setFilteredSites(sites);
    // Reset site and generator when client changes (only if not editing with pre-filled values)
    setValue('siteId', '');
    setValue('generatorId', '');
    setFilteredGenerators([]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClientId, allSites]);

  // Cascade: when site changes, filter generators and reset generator
  useEffect(() => {
    if (!selectedSiteId) {
      setFilteredGenerators([]);
      return;
    }
    const gens = allGenerators.filter(g => g.siteId === selectedSiteId);
    setFilteredGenerators(gens);
    // Reset generator when site changes
    setValue('generatorId', '');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSiteId, allGenerators]);

  // Auto-set priority when service type changes
  useEffect(() => {
    const st = serviceTypes.find(s => s.serviceType === selectedServiceType);
    if (st) setValue('priority', st.defaultPriority);
  }, [selectedServiceType, setValue, serviceTypes]);

  // Populate form when editing — set cascading state first, then form values
  const populateEditForm = useCallback((job: ServiceJob) => {
    // Pre-filter sites and generators for the edit job's client/site
    const sites = allSites.filter(s => s.clientId === job.clientId);
    setFilteredSites(sites);
    const gens = allGenerators.filter(g => g.siteId === job.siteId);
    setFilteredGenerators(gens);

    reset({
      serviceType: job.serviceType,
      problem: job.problem,
      priority: job.priority,
      clientId: job.clientId,
      siteId: job.siteId,
      generatorId: job.generatorId,
      leadTechnicianId: job.leadTechnicianId || '',
      additionalTechnicianId: '',
      requestDate: job.requestDate,
      scheduledDate: job.scheduledDate,
      startDate: job.startDate || '',
      completionDate: job.completionDate || '',
      runningHours: job.runningHours?.toString() || '',
      status: job.status,
      customerRepresentative: job.customerRepresentative || '',
      customerContact: job.customerContact || '',
      findings: job.findings || '',
      workPerformed: job.workPerformed || '',
      testingResults: job.testingResults || '',
      recommendations: job.recommendations || '',
      partsMaterialsSummary: job.partsMaterialsSummary || '',
      serviceReportNo: job.serviceReportNo || '',
      quotationNo: job.quotationNo || '',
      billingStatus: job.billingStatus,
      remarks: job.remarks || '',
    });
  }, [allSites, allGenerators, reset]);

  useEffect(() => {
    if (editJob && open && allSites.length > 0) {
      populateEditForm(editJob);
      setStep('details');
    } else if (!editJob && open) {
      reset({ priority: 'Normal', status: 'Open', billingStatus: 'Pending' });
      setFilteredSites([]);
      setFilteredGenerators([]);
      setStep('details');
    }
    setSubmitError(null);
  }, [editJob, open, allSites.length, populateEditForm, reset]);

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
        siteName: filteredSites.find(s => s.siteId === data.siteId)?.siteName || data.siteId,
        generatorId: data.generatorId,
        generatorName: (() => {
          const g = filteredGenerators.find(g => g.generatorId === data.generatorId);
          return g ? `${g.assetNo} / ${g.brand} ${g.model}`.trim() : data.generatorId;
        })(),
        leadTechnicianId: data.leadTechnicianId || undefined,
        leadTechnicianName: technicians.find(t => t.technicianId === data.leadTechnicianId)?.technicianName || data.leadTechnicianId,
        additionalTechnicianId: data.additionalTechnicianId || undefined,
        additionalTechnicianName: technicians.find(t => t.technicianId === data.additionalTechnicianId)?.technicianName || undefined,
        requestDate: data.requestDate || new Date().toISOString().split('T')[0],
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
      <button
        type="button"
        onClick={() => { if (currentStepIdx > 0) setStep(STEPS[currentStepIdx - 1].id); else onClose(); }}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-lg hover:bg-muted"
      >
        <Icon name="ChevronLeftIcon" size={15} />
        {currentStepIdx === 0 ? 'Cancel' : 'Back'}
      </button>
      <div className="flex items-center gap-2">
        {submitError && <p className="text-xs text-red-600 max-w-xs truncate">{submitError}</p>}
        {currentStepIdx < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={() => setStep(STEPS[currentStepIdx + 1].id)}
            className="flex items-center gap-1.5 bg-primary text-primary-foreground text-sm font-500 px-4 py-2 rounded-lg hover:bg-primary/90 active:scale-95 transition-all duration-150"
          >
            Next<Icon name="ChevronRightIcon" size={15} />
          </button>
        ) : (
          <button
            type="submit"
            form="create-job-form"
            disabled={isSubmitting}
            className="flex items-center gap-2 bg-primary text-primary-foreground text-sm font-500 px-5 py-2 rounded-lg hover:bg-primary/90 active:scale-95 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed min-w-[120px] justify-center"
          >
            {isSubmitting
              ? <><Icon name="ArrowPathIcon" size={15} className="animate-spin" />Saving...</>
              : <><Icon name="CheckIcon" size={15} />{isEdit ? 'Update Job' : 'Create Job'}</>}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? `Edit Job — ${editJob?.jobOrderNo}` : 'Create New Service Job'}
      subtitle={isEdit ? 'Update job details, assignment, and field notes' : 'Fill in all required fields to create a new service job'}
      size="xl"
      footer={footer}
    >
      {/* Step indicator */}
      <div className="flex items-center gap-0 mb-6 overflow-x-auto scrollbar-thin pb-1">
        {STEPS.map((s, i) => (
          <React.Fragment key={s.id}>
            <button
              type="button"
              onClick={() => setStep(s.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-500 transition-all duration-150 whitespace-nowrap flex-shrink-0 ${
                step === s.id
                  ? 'bg-primary text-primary-foreground'
                  : i < currentStepIdx
                  ? 'text-primary bg-primary/10' :'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <Icon name={s.icon as Parameters<typeof Icon>[0]['name']} size={13} />
              {s.label}
            </button>
            {i < STEPS.length - 1 && (
              <Icon name="ChevronRightIcon" size={12} className="text-muted-foreground/40 flex-shrink-0 mx-0.5" />
            )}
          </React.Fragment>
        ))}
      </div>

      {loadingRef && (
        <div className="flex items-center gap-2 mb-4 text-xs text-muted-foreground">
          <Icon name="ArrowPathIcon" size={13} className="animate-spin" />
          Loading reference data...
        </div>
      )}

      <form id="create-job-form" onSubmit={handleSubmit(onSubmit)}>
        {/* ── STEP 1: Job Info ── */}
        {step === 'details' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-500 text-foreground mb-1.5">
                  Service Type <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('serviceType', { required: true })}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="">Select service type...</option>
                  {serviceTypes.map(st => (
                    <option key={st.serviceTypeId} value={st.serviceType}>{st.serviceType}</option>
                  ))}
                </select>
                {errors.serviceType && <p className="text-xs text-red-500 mt-1">Service type is required</p>}
              </div>
              <div>
                <label className="block text-xs font-500 text-foreground mb-1.5">Priority</label>
                <select
                  {...register('priority')}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option>Normal</option>
                  <option>High</option>
                  <option>Critical</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-500 text-foreground mb-1.5">Status</label>
                <select
                  {...register('status')}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option>Open</option>
                  <option>In Progress</option>
                  <option>Completed</option>
                  <option>Closed</option>
                  <option>Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-500 text-foreground mb-1.5">
                  Request Date <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('requestDate', { required: true })}
                  type="date"
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                {errors.requestDate && <p className="text-xs text-red-500 mt-1">Request date is required</p>}
              </div>
              <div>
                <label className="block text-xs font-500 text-foreground mb-1.5">Scheduled Date</label>
                <input
                  {...register('scheduledDate')}
                  type="date"
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-500 text-foreground mb-1.5">Problem / Description</label>
                <textarea
                  {...register('problem')}
                  rows={3}
                  placeholder="Describe the problem or service request..."
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 2: Asset Linkage (cascading dropdowns) ── */}
        {step === 'asset' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {/* Client */}
              <div>
                <label className="block text-xs font-500 text-foreground mb-1.5">
                  Client <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('clientId', { required: true })}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="">Select client...</option>
                  {clients.map(c => (
                    <option key={c.clientId} value={c.clientId}>{c.clientName}</option>
                  ))}
                </select>
                {errors.clientId && <p className="text-xs text-red-500 mt-1">Client is required</p>}
              </div>

              {/* Site — filtered by selected client */}
              <div>
                <label className="block text-xs font-500 text-foreground mb-1.5">
                  Site <span className="text-red-500">*</span>
                  {selectedClientId && filteredSites.length === 0 && (
                    <span className="ml-2 text-amber-500 font-400">(no sites for this client)</span>
                  )}
                </label>
                <select
                  {...register('siteId', { required: true })}
                  disabled={!selectedClientId}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">{selectedClientId ? 'Select site...' : 'Select a client first'}</option>
                  {filteredSites.map(s => (
                    <option key={s.siteId} value={s.siteId}>{s.siteName}</option>
                  ))}
                </select>
                {errors.siteId && <p className="text-xs text-red-500 mt-1">Site is required</p>}
              </div>

              {/* Generator — filtered by selected site */}
              <div>
                <label className="block text-xs font-500 text-foreground mb-1.5">
                  Generator <span className="text-red-500">*</span>
                  {selectedSiteId && filteredGenerators.length === 0 && (
                    <span className="ml-2 text-amber-500 font-400">(no generators for this site)</span>
                  )}
                </label>
                <select
                  {...register('generatorId', { required: true })}
                  disabled={!selectedSiteId}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">{selectedSiteId ? 'Select generator...' : 'Select a site first'}</option>
                  {filteredGenerators.map(g => (
                    <option key={g.generatorId} value={g.generatorId}>
                      {g.assetNo} / {g.brand} {g.model}
                    </option>
                  ))}
                </select>
                {errors.generatorId && <p className="text-xs text-red-500 mt-1">Generator is required</p>}
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 3: Assignment ── */}
        {step === 'assignment' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-500 text-foreground mb-1.5">Lead Manpower</label>
                <select
                  {...register('leadTechnicianId')}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="">Select manpower...</option>
                  {technicians.map(t => (
                    <option key={t.technicianId} value={t.technicianId}>{t.technicianName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-500 text-foreground mb-1.5">Additional Manpower</label>
                <select
                  {...register('additionalTechnicianId')}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="">None</option>
                  {technicians.map(t => (
                    <option key={t.technicianId} value={t.technicianId}>{t.technicianName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-500 text-foreground mb-1.5">Customer Representative</label>
                <input
                  {...register('customerRepresentative')}
                  placeholder="Name of customer rep"
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-xs font-500 text-foreground mb-1.5">Customer Contact</label>
                <input
                  {...register('customerContact')}
                  placeholder="Contact number"
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 4: Field Work ── */}
        {step === 'fieldwork' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-500 text-foreground mb-1.5">Start Date</label>
                <input
                  {...register('startDate')}
                  type="date"
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-xs font-500 text-foreground mb-1.5">Completion Date</label>
                <input
                  {...register('completionDate')}
                  type="date"
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-xs font-500 text-foreground mb-1.5">Running Hours</label>
                <input
                  {...register('runningHours')}
                  type="number"
                  min="0"
                  placeholder="Current running hours"
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-xs font-500 text-foreground mb-1.5">Billing Status</label>
                <select
                  {...register('billingStatus')}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option>Pending</option>
                  <option>Quoted</option>
                  <option>Approved</option>
                  <option>Invoiced</option>
                  <option>Paid</option>
                  <option>Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-500 text-foreground mb-1.5">Service Report No.</label>
                <input
                  {...register('serviceReportNo')}
                  placeholder="SR-YYYY-XXXX"
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-xs font-500 text-foreground mb-1.5">Quotation No.</label>
                <input
                  {...register('quotationNo')}
                  placeholder="QT-YYYY-XXXX"
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 5: Notes / Findings ── */}
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
                  <textarea
                    {...register(field.name as keyof CreateJobFormData)}
                    rows={2}
                    placeholder={`Enter ${field.label.toLowerCase()}...`}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-500 text-foreground mb-1.5">Remarks</label>
                <textarea
                  {...register('remarks')}
                  rows={2}
                  placeholder="Additional remarks..."
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
              </div>
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
}