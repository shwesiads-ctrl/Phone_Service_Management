import { usePagination } from '../hooks/usePagination';
import { Pagination } from '../components/Pagination';
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Customer, ServiceJob, CustomerDeletionPreview } from '../types';
import {
  Search,
  Plus,
  Users,
  Phone,
  Mail,
  MapPin,
  Wrench,
  Clock,
  Eye,
  Edit2,
  Trash2,
  X,
  History,
  Shield,
  DollarSign,
  CheckSquare,
  Square,
} from 'lucide-react';

interface CustomersViewProps {
  onOpenJob: (job: ServiceJob) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({ onOpenJob }) => {
  const {
    customers,
    jobs,
    technicians,
    createCustomer,
    updateCustomer,
    previewCustomerDeletion,
    deleteCustomersWithRecords,
    language,
    formatCurrency,
    formatDate,
    t,
  } = useApp();

  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [historyCustomer, setHistoryCustomer] = useState<Customer | null>(null);
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');

  const openAddModal = () => {
    setEditingCustomer(null);
    setName('');
    setPhone('');
    setEmail('');
    setAddress('');
    setErrorMsg(null);
    setModalOpen(true);
  };

  const openEditModal = (cust: Customer) => {
    setEditingCustomer(cust);
    setName(cust.name);
    setPhone(cust.phone);
    setEmail(cust.email || '');
    setAddress(cust.address || '');
    setErrorMsg(null);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setErrorMsg('Name and phone number are required.');
      return;
    }
    setErrorMsg(null);

    try {
      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, {
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          address: address.trim(),
        });
      } else {
        await createCustomer({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          address: address.trim(),
        });
      }
      setModalOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Operation failed');
    }
  };

  const [deleteIds, setDeleteIds] = useState<string[]>([]);
  const [deletePreview, setDeletePreview] = useState<CustomerDeletionPreview | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [deleteAcknowledged, setDeleteAcknowledged] = useState(false);
  const openDeletion = async (ids: string[]) => {
    setDeleteIds(ids); setDeletePreview(null); setDeleteError(''); setDeleteAcknowledged(false); setDeleteBusy(true);
    try { setDeletePreview(await previewCustomerDeletion(ids)); }
    catch (error: any) { setDeleteError(error.message || 'Could not preview deletion'); }
    finally { setDeleteBusy(false); }
  };
  const handleDelete = (cust: Customer) => openDeletion([cust.id]);
  const confirmDeletion = async () => {
    if (!deletePreview || !deleteAcknowledged || deleteBusy) return;
    setDeleteBusy(true); setDeleteError('');
    try {
      await deleteCustomersWithRecords(deleteIds, deletePreview.revision);
      setSelectedCustomerIds(previous => previous.filter(id => !deleteIds.includes(id)));
      setDeleteIds([]); setDeletePreview(null);
    } catch (error: any) { setDeleteError(error.message || 'Could not delete customer records'); }
    finally { setDeleteBusy(false); }
  };

  const filteredCustomers = customers.filter((cust) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      cust.name.toLowerCase().includes(q) ||
      cust.phone.toLowerCase().includes(q) ||
      (cust.email && cust.email.toLowerCase().includes(q)) ||
      (cust.address && cust.address.toLowerCase().includes(q))
    );
  });

  const page = usePagination(filteredCustomers, search);
  const toggleSelectAll = () => {
    if (page.items.every(c => selectedCustomerIds.includes(c.id))) {
      setSelectedCustomerIds(previous => previous.filter(id => !page.items.some(c => c.id === id)));
    } else {
      setSelectedCustomerIds(previous => [...new Set([...previous, ...page.items.map(c => c.id)])]);
    }
  };

  const toggleSelectCustomer = (id: string) => {
    setSelectedCustomerIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const confirmBulkDelete = () => {
    if (selectedCustomerIds.length) void openDeletion(selectedCustomerIds);
  };

  const customerJobs = historyCustomer
    ? jobs.filter((j) => j.customer_id === historyCustomer.id)
    : [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[var(--text)] tracking-tight">
            {t('customers')}
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">
            {filteredCustomers.length} registered customers in relational database
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {selectedCustomerIds.length > 0 && (
            <button
              onClick={confirmBulkDelete}
              className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Selected ({selectedCustomerIds.length})</span>
            </button>
          )}
          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t('newCustomer')}</span>
          </button>
        </div>
      </div>

      {/* Search Bar & Bulk Selection Bar */}
      <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer name, phone number, address..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[var(--text)] px-3 py-2 bg-[var(--surface-2)] rounded-lg border border-[var(--border)]">
            <input
              type="checkbox"
              aria-label="Select current page" checked={page.items.length > 0 && page.items.every(c => selectedCustomerIds.includes(c.id))}
              onChange={toggleSelectAll}
              className="w-4 h-4 rounded text-[var(--primary)] focus:ring-[var(--primary)] cursor-pointer"
            />
            <span>Select All ({filteredCustomers.length})</span>
          </label>
        </div>
      </div>

      {/* Customers Table */}
      <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] overflow-hidden">
        {filteredCustomers.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-10 h-10 mx-auto text-[var(--text-muted)] opacity-40 mb-3" />
            <h3 className="text-base font-semibold text-[var(--text)]">{t('noRecordsFound')}</h3>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--surface-2)] text-[var(--text-muted)] text-xs border-b border-[var(--border)]">
                <tr><th className="px-4 py-3">#</th>
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      aria-label="Select current page" checked={page.items.length > 0 && page.items.every(c => selectedCustomerIds.includes(c.id))}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded text-[var(--primary)] focus:ring-[var(--primary)] cursor-pointer"
                    />
                  </th>
                  <th className="px-4 py-3 font-semibold">{t('customer')}</th>
                  <th className="px-4 py-3 font-semibold">{t('phone')}</th>
                  <th className="px-4 py-3 font-semibold">{t('address')}</th>
                  <th className="px-4 py-3 font-semibold text-center">Service History</th>
                  <th className="px-4 py-3 font-semibold text-right">Created Date</th>
                  <th className="px-4 py-3 font-semibold text-right">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-[var(--text)]">
                {page.items.map((cust, rowIndex) => {
                  const custJobCount = jobs.filter((j) => j.customer_id === cust.id).length;
                  const isSelected = selectedCustomerIds.includes(cust.id);
                  return (
                    <tr key={cust.id} className={`hover:bg-[var(--surface-2)]/40 transition-colors ${isSelected ? 'bg-[var(--primary)]/5' : ''}`}><td className="px-4 py-3 font-mono text-[var(--text-muted)]">{page.offset + rowIndex + 1}</td>
                      <td className="w-10 px-4 py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectCustomer(cust.id)}
                          className="w-4 h-4 rounded text-[var(--primary)] focus:ring-[var(--primary)] cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-bold text-xs sm:text-sm">{cust.name}</div>
                        {cust.email && (
                          <div className="text-[11px] text-[var(--text-muted)]">{cust.email}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap font-mono text-xs">{cust.phone}</td>
                      <td className="px-4 py-3 text-xs text-[var(--text-muted)] max-w-xs truncate">
                        {cust.address || '—'}
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <button
                          onClick={() => setHistoryCustomer(cust)}
                          className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg bg-[var(--surface-2)] hover:bg-[var(--primary)] hover:text-white transition-colors cursor-pointer"
                        >
                          <Wrench className="w-3.5 h-3.5" />
                          <span>{custJobCount} Jobs</span>
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap text-xs text-[var(--text-muted)] font-mono tabular-nums">
                        {formatDate(cust.created_at)}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap space-x-1">
                        <button
                          onClick={() => setHistoryCustomer(cust)}
                          className="p-1.5 rounded hover:bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
                          title={t('customerHistory')}
                        >
                          <History className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(cust)}
                          className="p-1.5 rounded hover:bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
                          title={t('edit')}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(cust)}
                          className="p-1.5 rounded hover:bg-rose-500/10 text-[var(--text-muted)] hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                          title="Delete Customer"
                        >
                          <Trash2 className="w-4 h-4 inline-block" />
                          <span className="ml-1 text-xs font-semibold">{language === 'my' ? 'ဖျက်ရန်' : 'Delete'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
<Pagination {...page} />
          </div>
        )}
      </div>

      {deleteIds.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="customer-delete-title" className="w-full max-w-lg p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] space-y-4">
            <h2 id="customer-delete-title" className="text-lg font-bold">{language === 'my' ? 'Customer နှင့် ချိတ်ထားသော Data ဖျက်ရန်' : 'Delete Customers & Linked Records'}</h2>
            {deleteBusy && !deletePreview && <p role="status">{language === 'my' ? 'ချိတ်ထားသော records များ စစ်နေသည်…' : 'Checking linked records…'}</p>}
            {deletePreview && <>
              <p className="text-sm break-words">{deletePreview.names.join(', ')}</p>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                {([['Customers', deletePreview.customers], ['Devices', deletePreview.devices], ['Repair jobs', deletePreview.jobs], ['Parts', deletePreview.parts], ['Payments', deletePreview.payments], ['Income records', deletePreview.income], ['Notifications', deletePreview.notifications]] as const).map(([label, count]) => <React.Fragment key={label}><dt>{label}</dt><dd className="font-bold text-right">{count}</dd></React.Fragment>)}
              </dl>
              <p className="text-sm text-rose-500">{language === 'my' ? 'ဖော်ပြထားသော data အားလုံးကို ဖျက်မည်။ Payment နှင့် income totals များ ပြောင်းလဲမည်။ မဖျက်မီ safety backup အလိုအလျောက် သိမ်းမည်။' : 'All listed records will be deleted. Payment and income totals will change. A safety backup is saved before deletion.'}</p>
              <p className="text-xs text-[var(--text-muted)]">{language === 'my' ? 'အခြား customer၊ user၊ expense၊ settlement history နှင့် audit မှတ်တမ်းများကို ထိန်းထားမည်။' : 'Other customers, users, expenses, settlement history and audit logs are retained.'}</p>
              <label className="flex gap-2 text-sm"><input type="checkbox" checked={deleteAcknowledged} disabled={deleteBusy} onChange={e => setDeleteAcknowledged(e.target.checked)} />{language === 'my' ? 'Customer နှင့် ဖော်ပြထားသော records အားလုံး ဖျက်ရန် အတည်ပြုပါသည်။' : 'I confirm deletion of these customers and all listed records.'}</label>
            </>}
            {deleteError && <p role="alert" className="text-sm text-rose-500">{deleteError}</p>}
            <div className="flex justify-end gap-3">
              <button autoFocus disabled={deleteBusy} onClick={() => { setDeleteIds([]); setDeletePreview(null); }} className="px-4 py-2 rounded-lg border border-[var(--border)]">{language === 'my' ? 'မဖျက်ပါ' : 'Cancel'}</button>
              <button disabled={!deletePreview || !deleteAcknowledged || deleteBusy} onClick={confirmDeletion} className="px-4 py-2 rounded-lg bg-rose-600 text-white disabled:opacity-50">{deleteBusy && deletePreview ? (language === 'my' ? 'ဖျက်နေသည်…' : 'Deleting…') : (language === 'my' ? 'ချိတ်ထားသော Data အပါအဝင် ဖျက်မည်' : 'Delete All Listed Records')}</button>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT CUSTOMER MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
            <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
              <h3 className="font-bold text-base text-[var(--text)]">
                {editingCustomer ? t('edit') : t('newCustomer')}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-4 space-y-3.5 text-xs sm:text-sm">
              {errorMsg && (
                <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-600 text-xs font-semibold">
                  {errorMsg}
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-[var(--text)] mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ko Aung"
                  className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text)] mb-1">
                  Phone Number *
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+95 9..."
                  className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text)] mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ko.aung@gmail.com"
                  className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text)] mb-1">
                  Address
                </label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Sanchaung Township, Yangon"
                  rows={2}
                  className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] resize-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold rounded-lg border border-[var(--border)] text-[var(--text)] hover:bg-[var(--surface-2)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold rounded-lg bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] shadow"
                >
                  {editingCustomer ? 'Save Changes' : 'Create Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOMER SERVICE HISTORY MODAL */}
      {historyCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
            <div className="p-4 sm:p-5 border-b border-[var(--border)] flex items-center justify-between shrink-0 bg-[var(--surface-2)]/30">
              <div>
                <h3 className="font-bold text-base text-[var(--text)]">
                  {t('customerHistory')} — {historyCustomer.name}
                </h3>
                <p className="text-xs text-[var(--text-muted)] font-mono">
                  {historyCustomer.phone} {historyCustomer.email ? `• ${historyCustomer.email}` : ''}
                </p>
              </div>
              <button
                onClick={() => setHistoryCustomer(null)}
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
              {customerJobs.length === 0 ? (
                <div className="p-8 text-center text-[var(--text-muted)]">
                  <Wrench className="w-8 h-8 mx-auto opacity-40 mb-2" />
                  <p className="text-sm font-medium">No repair service jobs recorded for this customer yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {customerJobs.map((j) => (
                    <div
                      key={j.id}
                      className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-[var(--primary)]">{j.service_number}</span>
                          <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 uppercase">
                            {j.status_id}
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-[var(--text)]">
                          {j.device ? `${j.device.brand} ${j.device.model}` : 'Service Device'}
                        </div>
                        <div className="text-[11px] text-[var(--text-muted)]">
                          {j.problem_description || 'No issue description'}
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-end justify-between w-full sm:w-auto gap-2">
                        <div className="font-mono font-bold text-xs sm:text-sm text-[var(--text)]">
                          {formatCurrency(j.total_cost || j.service_charge)}
                        </div>
                        <button
                          onClick={() => {
                            setHistoryCustomer(null);
                            onOpenJob(j);
                          }}
                          className="px-3 py-1 rounded-lg bg-[var(--primary)] text-white text-xs font-bold hover:bg-[var(--primary-hover)] transition-colors cursor-pointer"
                        >
                          View Job
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-[var(--border)] bg-[var(--surface-2)]/30 flex justify-end shrink-0">
              <button
                onClick={() => setHistoryCustomer(null)}
                className="px-4 py-2 rounded-xl border border-[var(--border)] hover:bg-[var(--surface-2)] text-[var(--text)] font-bold text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
