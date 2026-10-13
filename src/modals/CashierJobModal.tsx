import React from 'react';
import type { ServiceJob } from '../types';
import { JobDetailModal } from './JobDetailModal';

/** Cashiers see the same job details as administrators, with editing limited to payments. */
export function CashierJobModal({ job, onClose, onPrint }: { job: ServiceJob; onClose: () => void; onPrint: (job: ServiceJob) => void }) {
  return <JobDetailModal job={job} onClose={onClose} onPrint={onPrint} cashierView />;
}
