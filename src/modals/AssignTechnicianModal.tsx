import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, UserCog, Check, Wrench, Shield, ArrowRight } from 'lucide-react';
import { ServiceJob } from '../types';

interface AssignTechnicianModalProps {
  onClose: () => void;
  onJobSelected?: (job: ServiceJob) => void;
}

export const AssignTechnicianModal: React.FC<AssignTechnicianModalProps> = ({
  onClose,
  onJobSelected,
}) => {
  const { jobs, technicians, reassignJob, t } = useApp();
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [selectedTechId, setSelectedTechId] = useState<string>(technicians[0]?.id || '');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Filter jobs that are not yet delivered/cancelled
  const activeJobs = jobs.filter(
    (j) => !['delivered', 'cancelled'].includes(j.status_id)
  );

  const selectedJob = jobs.find((j) => j.id === selectedJobId);

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJobId || !selectedTechId) return;
    setLoading(true);
    try {
      const updated = await reassignJob(selectedJobId, selectedTechId);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        if (onJobSelected) onJobSelected(updated);
        onClose();
      }, 1000);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <UserCog className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-base text-[var(--text)]">{t('assignTechnician')}</h2>
              <p className="text-[11px] text-[var(--text-muted)]">Dispatch repair order to workbench technician</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleAssign} className="p-6 space-y-4">
          {success && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>Technician reassigned successfully!</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[var(--text)] mb-1">
              Select Service Job *
            </label>
            <select
              required
              value={selectedJobId}
              onChange={(e) => {
                setSelectedJobId(e.target.value);
                const found = jobs.find((j) => j.id === e.target.value);
                if (found && found.technician_id) {
                  setSelectedTechId(found.technician_id);
                }
              }}
              className="w-full px-3 py-2 text-sm bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] font-mono"
            >
              <option value="">-- Choose active service job ({activeJobs.length} active) --</option>
              {activeJobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.service_number} · {j.customer?.name || 'Walk-in'} ({j.device?.model || 'Device'}) · Status: {j.status_id}
                </option>
              ))}
            </select>
          </div>

          {selectedJob && (
            <div className="p-3 rounded-xl bg-[var(--surface-2)]/60 border border-[var(--border)] space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Customer:</span>
                <span className="font-bold text-[var(--text)]">{selectedJob.customer?.name || 'Walk-in'} ({selectedJob.customer?.phone || '-'})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Device & Issue:</span>
                <span className="font-medium text-[var(--text)]">{selectedJob.device?.model || 'Device'} - {selectedJob.problem_description}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Current Assignee:</span>
                <span className="font-semibold text-purple-600 dark:text-purple-400">
                  {technicians.find((t) => t.id === selectedJob.technician_id)?.full_name || selectedJob.technician?.full_name || 'Unassigned'}
                </span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[var(--text)] mb-1">
              Assign To Technician *
            </label>
            <select
              required
              value={selectedTechId}
              onChange={(e) => setSelectedTechId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
            >
              {technicians.map((t) => {
                const techActiveJobs = jobs.filter(
                  (j) => j.technician_id === t.id && !['completed', 'delivered', 'cancelled'].includes(j.status_id)
                ).length;
                return (
                  <option key={t.id} value={t.id}>
                    {t.full_name} (@{t.username}) · Current Active: {techActiveJobs} jobs {t.status === 'inactive' ? '(Inactive)' : ''}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-[var(--border)]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !selectedJobId || !selectedTechId}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] rounded-lg shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{loading ? 'Assigning...' : 'Confirm Assignment'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
