'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import Modal from '@/components/ui/Modal';
import Icon from '@/components/ui/AppIcon';
import {
  ServiceJob, clients, sitesByClient, generatorsBySite,
  technicians, serviceTypes,
} from './mockData';

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
  onCreate: (data: Partial<ServiceJob>) => void;
  onUpdate: (job: ServiceJob) => void;
}

export default function CreateJobModal({ open, editJob, onClose, onCreate, onUpdate }: CreateJobModalProps) {
  const [step, setStep] = useState<FormStep>('details');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEdit = !!editJob;

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CreateJobFormData>({
    defaultValues: {
      priority: 'Normal',
      status: 'Open',
      billingStatus: 'Pending',
    },
  });

  const selectedClientId = watch('clientId');
  const selectedSiteId = watch('siteId');
  const selectedServiceType = watch('serviceType');
  const availableSites = selectedClientId ? (sitesByClient[selectedClientId] || []) : [];
  const availableGenerators = selectedSiteId ? (generatorsBySite[selectedSiteId] || []) : [];

  // Auto-set priority when service type changes
  useEffect(() => {
    const st = serviceTypes.find(s => s.name === selectedServiceType);
    if (st) setValue('priority', st.defaultPriority);
  }, [selectedServiceType, setValue]);

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
      reset({
        priority: 'Normal',
        status: 'Open',
        billingStatus: 'Pending',
      });
      setStep('details');
    }
  }, [editJob, open, reset]);

  const onSubmit = async (data: CreateJobFormData) => {
    setIsSubmitting(true);
    // Backend integration: POST /api/service-jobs (create) or PUT /api/service-jobs/:id (update)
    await new Promise(r => setTimeout(r, 900));

    const clientName = clients.find(c => c.id === data.clientId)?.name || '';
    const siteName = availableSites.find(s => s.id === data.siteId)?.name || '';
    const generatorName = availableGenerators.find(g => g.id === data.generatorId)?.name || '';
    const leadTechnicianName = technicians.find(t => t.id === data.leadTechnicianId)?.name || '';

    const jobData: Partial<ServiceJob> = {
      serviceType: data.serviceType,
      problem: data.problem,
      priority: data.priority as ServiceJob['priority'],
      clientId: data.clientId,
      clientName,
      siteId: data.siteId,
      siteName,
      generatorId: data.generatorId,
      generatorName,
      leadTechnicianId: data.leadTechnicianId,
      leadTechnicianName,
      requestDate: data.requestDate || '09 Sep 2026',
      scheduledDate: data.scheduledDate || '10 Sep 2026',
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

    setIsSubmitting(false);

    if (isEdit && editJob) {
      onUpdate({ ...editJob, ...jobData });
    } else {
      onCreate(jobData);
    }
  };

  const currentStepIdx = STEPS.findIndex(s => s.id === step);

  const footer = (
    <div className="flex items-center justify-between w-full">
      <button
        type="button"
        onClick={() => {
          if (currentStepIdx > 0) setStep(STEPS[currentStepIdx - 1].id);
          else onClose();
        }}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-lg hover:bg-muted"
      >
        <Icon name="ChevronLeftIcon" size={15} />
        {currentStepIdx === 0 ? 'Cancel' : 'Back'}
      </button>
      <div className="flex items-center gap-2">
        {currentStepIdx < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={() => setStep(STEPS[currentStepIdx + 1].id)}
            className="flex items-center gap-1.5 bg-primary text-primary-foreground text-sm font-500 px-4 py-2 rounded-lg hover:bg-primary/90 active:scale-95 transition-all duration-150"
          >
            Next
            <Icon name="ChevronRightIcon" size={15} />
          </button>
        ) : (
          <button
            type="submit"
            form="create-job-form"
            disabled={isSubmitting}
            className="flex items-center gap-2 bg-primary text-primary-foreground text-sm font-500 px-5 py-2 rounded-lg hover:bg-primary/90 active:scale-95 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed min-w-[120px] justify-center"
          >
            {isSubmitting ? (
              <>
                <Icon name="ArrowPathIcon" size={15} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Icon name="CheckIcon" size={15} />
                {isEdit ? 'Update Job' : 'Create Job'}
              </>
            )}
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
              className={`
                flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-500 transition-all duration-150 whitespace-nowrap flex-shrink-0
                ${step === s.id
                  ? 'bg-primary text-primary-foreground'
                  : i < currentStepIdx
                    ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100' :'text-muted-foreground hover:bg-muted'
                }
              `}
            >
              {i < currentStepIdx ? (
                <Icon name="CheckCircleIcon" size={14} />
              ) : (
                <Icon name={s.icon as Parameters<typeof Icon>[0]['name']} size={14} />
              )}
              {s.label}
            </button>
            {i < STEPS.length - 1 && (
              <Icon name="ChevronRightIcon" size={12} className="text-muted-foreground flex-shrink-0 mx-0.5" />
            )}
          </React.Fragment>
        ))}
      </div>

      <form id="create-job-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        {/* Step: Details */}
        {step === 'details' && (
          <div className="space-y-4 fade-in">
            <FormSectionHeader title="Job Information" description="Define the service type, problem description, and priority level." />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Service Type" required error={errors.serviceType?.message}>
                <select
                  {...register('serviceType', { required: 'Service type is required' })}
                  className={inputCls(!!errors.serviceType)}
                >
                  <option value="">Select service type</option>
                  {serviceTypes.map(st => (
                    <option key={`st-opt-${st.id}`} value={st.name}>{st.name}</option>
                  ))}
                </select>
              </FormField>

              <FormField label="Priority" required error={errors.priority?.message}>
                <select
                  {...register('priority', { required: 'Priority is required' })}
                  className={inputCls(!!errors.priority)}
                >
                  <option value="Normal">Normal</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </FormField>
            </div>

            <FormField
              label="Problem / Request Description"
              required
              error={errors.problem?.message}
              helper="Describe the issue reported by the client or the scope of the scheduled service."
            >
              <textarea
                {...register('problem', { required: 'Problem description is required', minLength: { value: 10, message: 'Provide at least 10 characters' } })}
                rows={3}
                placeholder="e.g. Generator failed to start during power outage. No-crank condition. Client reports no alarm lights on panel."
                className={`${inputCls(!!errors.problem)} resize-none`}
              />
            </FormField>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Current Job Status" required>
                <select {...register('status')} className={inputCls(false)}>
                  {['Open', 'In Progress', 'Completed', 'Closed', 'Cancelled'].map(s => (
                    <option key={`status-opt-${s}`} value={s}>{s}</option>
                  ))}
                </select>
              </FormField>

              <FormField label="Billing Status" required>
                <select {...register('billingStatus')} className={inputCls(false)}>
                  {['Pending', 'Quoted', 'Approved', 'Invoiced', 'Paid', 'Cancelled'].map(s => (
                    <option key={`bill-opt-${s}`} value={s}>{s}</option>
                  ))}
                </select>
              </FormField>
            </div>

            <FormField label="Remarks" helper="Optional internal notes about this job.">
              <textarea
                {...register('remarks')}
                rows={2}
                placeholder="e.g. Client requires 24-hour notice before site visit. Security badge required."
                className={`${inputCls(false)} resize-none`}
              />
            </FormField>
          </div>
        )}

        {/* Step: Asset */}
        {step === 'asset' && (
          <div className="space-y-4 fade-in">
            <FormSectionHeader title="Asset Linkage" description="Link this job to a client, site, and specific generator asset." />

            <FormField label="Client" required error={errors.clientId?.message}>
              <select
                {...register('clientId', { required: 'Client is required' })}
                className={inputCls(!!errors.clientId)}
                onChange={(e) => {
                  setValue('clientId', e.target.value);
                  setValue('siteId', '');
                  setValue('generatorId', '');
                }}
              >
                <option value="">Select client</option>
                {clients.map(c => (
                  <option key={`client-opt-${c.id}`} value={c.id}>{c.name}</option>
                ))}
              </select>
            </FormField>

            <FormField
              label="Site"
              required
              error={errors.siteId?.message}
              helper={!selectedClientId ? 'Select a client first to see available sites.' : undefined}
            >
              <select
                {...register('siteId', { required: 'Site is required' })}
                className={inputCls(!!errors.siteId)}
                disabled={!selectedClientId || availableSites.length === 0}
                onChange={(e) => {
                  setValue('siteId', e.target.value);
                  setValue('generatorId', '');
                }}
              >
                <option value="">
                  {!selectedClientId ? 'Select a client first' : availableSites.length === 0 ? 'No sites for this client' : 'Select site'}
                </option>
                {availableSites.map(s => (
                  <option key={`site-opt-${s.id}`} value={s.id}>{s.name}</option>
                ))}
              </select>
            </FormField>

            <FormField
              label="Generator Asset"
              required
              error={errors.generatorId?.message}
              helper={!selectedSiteId ? 'Select a site first to see available generators.' : availableGenerators.length === 0 ? 'No generators registered at this site.' : undefined}
            >
              <select
                {...register('generatorId', { required: 'Generator is required' })}
                className={inputCls(!!errors.generatorId)}
                disabled={!selectedSiteId || availableGenerators.length === 0}
              >
                <option value="">
                  {!selectedSiteId ? 'Select a site first' : availableGenerators.length === 0 ? 'No generators at this site' : 'Select generator'}
                </option>
                {availableGenerators.map(g => (
                  <option key={`gen-opt-${g.id}`} value={g.id}>{g.name}</option>
                ))}
              </select>
            </FormField>

            <FormField
              label="Current Running Hours"
              helper="Generator's running hours at the time of this service. Used to calculate next PMS interval."
            >
              <input
                type="number"
                {...register('runningHours', {
                  min: { value: 0, message: 'Running hours cannot be negative' },
                  max: { value: 99999, message: 'Running hours value seems too high' },
                })}
                placeholder="e.g. 8420"
                className={inputCls(!!errors.runningHours)}
              />
              {errors.runningHours && <p className="mt-1 text-2xs text-red-600">{errors.runningHours.message}</p>}
            </FormField>
          </div>
        )}

        {/* Step: Assignment */}
        {step === 'assignment' && (
          <div className="space-y-4 fade-in">
            <FormSectionHeader title="Technician Assignment" description="Assign lead and additional technicians, and record customer contact information." />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Lead Technician" required error={errors.leadTechnicianId?.message}>
                <select
                  {...register('leadTechnicianId', { required: 'Lead technician is required' })}
                  className={inputCls(!!errors.leadTechnicianId)}
                >
                  <option value="">Select lead technician</option>
                  {technicians.map(t => (
                    <option key={`lead-tech-opt-${t.id}`} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </FormField>

              <FormField label="Additional Technician" helper="Optional — assign a second technician to this job.">
                <select
                  {...register('additionalTechnicianId')}
                  className={inputCls(false)}
                >
                  <option value="">None (single technician)</option>
                  {technicians.map(t => (
                    <option key={`add-tech-opt-${t.id}`} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </FormField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Customer Representative"
                helper="Name of the client contact who will receive the service."
              >
                <input
                  type="text"
                  {...register('customerRepresentative')}
                  placeholder="e.g. Engr. Paulo Santos"
                  className={inputCls(false)}
                />
              </FormField>

              <FormField
                label="Customer Contact No."
                helper="Mobile or landline number for coordination."
              >
                <input
                  type="tel"
                  {...register('customerContact')}
                  placeholder="e.g. 0917-555-1234"
                  className={inputCls(false)}
                />
              </FormField>
            </div>
          </div>
        )}

        {/* Step: Scheduling */}
        {step === 'scheduling' && (
          <div className="space-y-4 fade-in">
            <FormSectionHeader title="Scheduling & Dates" description="Set the request date, scheduled service date, and actual start/completion dates." />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Request Date" required error={errors.requestDate?.message}>
                <input
                  type="date"
                  {...register('requestDate', { required: 'Request date is required' })}
                  className={inputCls(!!errors.requestDate)}
                />
              </FormField>

              <FormField label="Scheduled Date" required error={errors.scheduledDate?.message} helper="When the service visit is planned.">
                <input
                  type="date"
                  {...register('scheduledDate', { required: 'Scheduled date is required' })}
                  className={inputCls(!!errors.scheduledDate)}
                />
              </FormField>

              <FormField label="Actual Start Date" helper="Leave blank if service has not yet started.">
                <input
                  type="date"
                  {...register('startDate')}
                  className={inputCls(false)}
                />
              </FormField>

              <FormField label="Completion Date" helper="Date the service was completed. Required before closing the job.">
                <input
                  type="date"
                  {...register('completionDate')}
                  className={inputCls(false)}
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Service Report No." helper="Auto-assigned on completion. Can be entered manually.">
                <input
                  type="text"
                  {...register('serviceReportNo')}
                  placeholder="e.g. SR-2026-0094"
                  className={inputCls(false)}
                />
              </FormField>

              <FormField label="Quotation No." helper="Link to an existing quotation in Quotations & Billing.">
                <input
                  type="text"
                  {...register('quotationNo')}
                  placeholder="e.g. QT-2026-0091"
                  className={inputCls(false)}
                />
              </FormField>
            </div>
          </div>
        )}

        {/* Step: Notes */}
        {step === 'notes' && (
          <div className="space-y-4 fade-in">
            <FormSectionHeader title="Field Notes" description="Record technician findings, work performed, test results, and recommendations. These fields can also be updated by the assigned technician from the field." />

            <FormField label="Findings" helper="What the technician observed on-site — root cause, condition of components.">
              <textarea
                {...register('findings')}
                rows={3}
                placeholder="e.g. Upper radiator hose cracked near clamp fitting. Coolant level critically low. Engine temperature fault code logged."
                className={`${inputCls(false)} resize-none`}
              />
            </FormField>

            <FormField label="Work Performed" helper="Describe all maintenance or repair tasks completed.">
              <textarea
                {...register('workPerformed')}
                rows={3}
                placeholder="e.g. Replaced upper radiator hose. Flushed and refilled coolant system to full capacity. Cleared fault codes."
                className={`${inputCls(false)} resize-none`}
              />
            </FormField>

            <FormField label="Testing / Results" helper="Results of post-service tests — load test, startup test, voltage/frequency readings.">
              <textarea
                {...register('testingResults')}
                rows={2}
                placeholder="e.g. Generator started and ran at 100% rated load for 30 minutes. Voltage: 461V, Frequency: 60.1Hz. All parameters normal."
                className={`${inputCls(false)} resize-none`}
              />
            </FormField>

            <FormField label="Recommendations" helper="Follow-up actions, parts to order, or next scheduled visit notes.">
              <textarea
                {...register('recommendations')}
                rows={2}
                placeholder="e.g. Monitor turbocharger for oil seepage. Schedule turbocharger replacement at next PMS if condition worsens."
                className={`${inputCls(false)} resize-none`}
              />
            </FormField>

            <FormField label="Parts / Materials Summary" helper="Brief text summary of all parts and materials used. For detailed tracking, use the Parts Used module.">
              <textarea
                {...register('partsMaterialsSummary')}
                rows={2}
                placeholder="e.g. 1x oil filter (CUM-OILF-6CTA), 1x fuel filter, 15L engine oil (SAE 15W-40), 10L coolant"
                className={`${inputCls(false)} resize-none`}
              />
            </FormField>
          </div>
        )}
      </form>
    </Modal>
  );
}

// ─── Form helper components ───────────────────────────────────────────────────

function FormSectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="pb-3 border-b border-border mb-4">
      <h3 className="text-sm font-600 text-foreground">{title}</h3>
      <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
    </div>
  );
}

function FormField({
  label,
  required,
  error,
  helper,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  helper?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-500 text-foreground mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {helper && <p className="text-2xs text-muted-foreground mb-1.5 leading-relaxed">{helper}</p>}
      {children}
      {error && (
        <p className="mt-1 text-2xs text-red-600 font-500 flex items-center gap-1">
          <Icon name="ExclamationCircleIcon" size={12} />
          {error}
        </p>
      )}
    </div>
  );
}

function inputCls(hasError: boolean) {
  return `
    w-full h-9 px-3 rounded-lg border text-sm text-foreground bg-card
    focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
    placeholder:text-muted-foreground transition-colors
    disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-muted/50
    ${hasError ? 'border-red-400 bg-red-50/20' : 'border-input hover:border-muted-foreground'}
  `;
}