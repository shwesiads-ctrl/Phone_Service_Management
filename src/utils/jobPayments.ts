import type { ServiceJob, ServicePayment } from '../types';

/** Never add different currencies or deleted entries into a job's settlement. */
export function jobPaymentSummary(job: ServiceJob, payments: ServicePayment[] = []) {
  const source = job.payments ?? payments.filter(payment => payment.service_job_id === job.id);
  const records = source.filter(payment => !payment.is_deleted);
  const currency = job.currency_code || 'MMK';
  const paid = job.payments !== undefined || source.length > 0
    ? records.filter(payment => payment.currency_code === currency).reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0)
    : Number(job.amount_paid || 0);
  return { records, paid, currency };
}
