import { usePagination } from '../hooks/usePagination';
import { Pagination } from '../components/Pagination';
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Device, CustomerDeletionPreview } from '../types';
import {
  Search,
  Plus,
  Smartphone,
  Laptop,
  Tablet,
  Monitor,
  Headphones,
  Cpu,
  Edit2,
  Trash2,
  X,
  User,
} from 'lucide-react';

export const DevicesView: React.FC = () => {
  const { devices, customers, createDevice, updateDevice, previewDeviceDeletion, deleteDevicesWithRecords, role, t } = useApp();

  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);

  const [selected,setSelected]=useState<string[]>([]),[preview,setPreview]=useState<CustomerDeletionPreview|null>(null),[deletingIds,setDeletingIds]=useState<string[]>([]),[acknowledged,setAcknowledged]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
  useEffect(()=>setSelected(previous=>previous.filter(id=>devices.some(device=>device.id===id))),[devices]);
  const reviewDeletion=async(ids:string[])=>{if(busy)return;setBusy(true);setError('');try{setPreview(await previewDeviceDeletion(ids));setDeletingIds(ids);setAcknowledged(false);}catch(error:any){setError(error.message);}finally{setBusy(false);}};

  // Form states
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [category, setCategory] = useState<Device['category']>('smartphone');
  const [serialOrImei, setSerialOrImei] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [conditionNotes, setConditionNotes] = useState('');

  const openAddModal = () => {
    setEditingDevice(null);
    setBrand('');
    setModel('');
    setCategory('smartphone');
    setSerialOrImei('');
    setCustomerId(customers[0]?.id || '');
    setConditionNotes('');
    setModalOpen(true);
  };

  const openEditModal = (dev: Device) => {
    setEditingDevice(dev);
    setBrand(dev.brand);
    setModel(dev.model);
    setCategory(dev.category);
    setSerialOrImei(dev.serial_or_imei);
    setCustomerId(dev.customer_id);
    setConditionNotes(dev.condition_notes);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brand.trim() || !model.trim()) return;

    if (editingDevice) {
      await updateDevice(editingDevice.id, {
        brand,
        model,
        category,
        serial_or_imei: serialOrImei,
        customer_id: customerId,
        condition_notes: conditionNotes,
      });
    } else {
      await createDevice({
        brand,
        model,
        category,
        serial_or_imei: serialOrImei,
        customer_id: customerId,
        condition_notes: conditionNotes,
      });
    }

    setModalOpen(false);
  };

  const getCategoryIcon = (cat: Device['category']) => {
    switch (cat) {
      case 'smartphone':
        return <Smartphone className="w-4 h-4 text-blue-500" />;
      case 'laptop':
        return <Laptop className="w-4 h-4 text-indigo-500" />;
      case 'tablet':
        return <Tablet className="w-4 h-4 text-purple-500" />;
      case 'desktop':
        return <Monitor className="w-4 h-4 text-teal-500" />;
      case 'audio':
        return <Headphones className="w-4 h-4 text-amber-500" />;
      default:
        return <Cpu className="w-4 h-4 text-slate-500" />;
    }
  };

  const filteredDevices = devices.filter((dev) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    const cust = customers.find((c) => c.id === dev.customer_id);
    return (
      dev.brand.toLowerCase().includes(q) ||
      dev.model.toLowerCase().includes(q) ||
      (dev.serial_or_imei || '').toLowerCase().includes(q) ||
      (cust?.name || '').toLowerCase().includes(q) ||
      (dev.condition_notes || '').toLowerCase().includes(q)
    );
  });

  const page = usePagination(filteredDevices, search);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[var(--text)] tracking-tight">
            {t('devices')}
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">
            {filteredDevices.length} registered hardware units
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] rounded-lg shadow-sm transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{t('newDevice')}</span>
        </button>
      </div>

      {error&&<p role="alert" className="text-rose-500">{error}</p>}
      {role==='admin'&&<div className="flex flex-wrap gap-3 items-center p-3 rounded-xl border border-[var(--border)] bg-[var(--surface)]"><label className="flex gap-2 items-center text-sm"><input aria-label="Select all matching devices" type="checkbox" disabled={busy||!filteredDevices.length} checked={filteredDevices.length>0&&filteredDevices.every(device=>selected.includes(device.id))} onChange={event=>setSelected(event.target.checked?[...new Set([...selected,...filteredDevices.map(device=>device.id)])]:selected.filter(id=>!filteredDevices.some(device=>device.id===id)))}/>Select all matching devices ({filteredDevices.length})</label><button onClick={()=>setSelected([])} disabled={busy||!selected.length} className="text-sm">Clear selection</button><button disabled={busy||!selected.length} onClick={()=>reviewDeletion(selected)} className="ml-auto px-3 py-2 rounded-lg bg-rose-600 text-white text-sm disabled:opacity-40">Delete Selected ({selected.length})</button></div>}
      {preview&&<div className="fixed inset-0 z-50 bg-black/60 p-4 flex items-center justify-center"><section role="dialog" aria-modal="true" aria-label="Delete selected devices" className="p-6 rounded-xl bg-[var(--surface)] max-w-lg w-full max-h-[90vh] overflow-y-auto space-y-4"><h2 className="text-xl font-bold">Delete selected devices?</h2><p className="text-sm">{preview.devices} devices · {preview.jobs} repair jobs · {preview.parts} parts · {preview.payments} payments · {preview.income} income records · {preview.notifications} notifications</p><ul className="text-xs max-h-36 overflow-y-auto">{preview.names.map((name,index)=><li key={index}>{name}</li>)}</ul><p className="text-sm text-[var(--text-muted)]">Customer accounts are kept. Linked records listed above will be deleted. A full backup is saved first.</p>{error&&<p role="alert" className="text-rose-500">{error}</p>}<label className="flex gap-2 items-start text-sm"><input aria-label="Acknowledge device deletion" type="checkbox" checked={acknowledged} disabled={busy} onChange={event=>setAcknowledged(event.target.checked)}/>I understand that all listed records will be deleted.</label><div className="flex gap-3"><button disabled={busy||!acknowledged} onClick={async()=>{if(busy)return;setBusy(true);setError('');try{await deleteDevicesWithRecords(deletingIds,preview.revision);setSelected([]);setPreview(null);}catch(error:any){setError(error.message);}finally{setBusy(false);}}} className="px-4 py-2 rounded-lg bg-rose-600 text-white disabled:opacity-40">{busy?'Deleting…':'Delete All Listed Records'}</button><button disabled={busy} onClick={()=>{setPreview(null);setError('');}}>Cancel</button></div></section></div>}

      {/* Search Bar */}
      <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by brand, model, IMEI, customer..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
          />
        </div>
      </div>

      {/* Device List Table */}
      <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] overflow-hidden">
        {filteredDevices.length === 0 ? (
          <div className="p-12 text-center">
            <Smartphone className="w-10 h-10 mx-auto text-[var(--text-muted)] opacity-40 mb-3" />
            <h3 className="text-base font-semibold text-[var(--text)]">{t('noRecordsFound')}</h3>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--surface-2)] text-[var(--text-muted)] text-xs border-b border-[var(--border)]">
                <tr><th className="px-4 py-3">#</th>
                  <th className="px-4 py-3 font-semibold">{t('device')}</th>
                  <th className="px-4 py-3 font-semibold">{t('imei')}</th>
                  <th className="px-4 py-3 font-semibold">{t('customer')}</th>
                  <th className="px-4 py-3 font-semibold">Physical Condition / Notes</th>
                  <th className="px-4 py-3 font-semibold text-right">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-[var(--text)]">
                {page.items.map((dev, rowIndex) => {
                  const cust = customers.find((c) => c.id === dev.customer_id);
                  return (
                    <tr key={dev.id} className="hover:bg-[var(--surface-2)]/40 transition-colors"><td className="px-4 py-3 font-mono text-[var(--text-muted)]">{role==='admin'&&<input type="checkbox" aria-label={`Select device ${dev.id}`} checked={selected.includes(dev.id)} disabled={busy} onChange={event=>setSelected(event.target.checked?[...selected,dev.id]:selected.filter(id=>id!==dev.id))} className="mr-2"/>}{page.offset + rowIndex + 1}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(dev.category)}
                          <div>
                            <div className="font-bold text-xs sm:text-sm">
                              {dev.brand} {dev.model}
                            </div>
                            <div className="text-[11px] text-[var(--text-muted)] capitalize">
                              {dev.category}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-xs font-mono text-[var(--text)]">
                        {dev.serial_or_imei || '—'}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-xs sm:text-sm font-semibold">
                          {cust ? cust.name : 'Unknown Customer'}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-xs text-[var(--text-muted)] max-w-sm truncate">
                        {dev.condition_notes || 'No cosmetic defects noted.'}
                      </td>

                      <td className="px-4 py-3 text-right whitespace-nowrap space-x-1">
                        <button
                          onClick={() => openEditModal(dev)}
                          className="p-1.5 rounded hover:bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
                          title={t('edit')}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={()=>reviewDeletion([dev.id])}
                          className="p-1.5 rounded hover:bg-rose-500/10 text-[var(--text-muted)] hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                          title="Delete Device"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Add / Edit Device Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
            <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
              <h3 className="font-bold text-base text-[var(--text)]">
                {editingDevice ? t('edit') : t('newDevice')}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-4 space-y-3.5 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[var(--text)] mb-1">
                    Brand *
                  </label>
                  <input
                    type="text"
                    required
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="Apple, Samsung..."
                    className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text)] mb-1">
                    Model *
                  </label>
                  <input
                    type="text"
                    required
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="e.g. iPhone 13"
                    className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[var(--text)] mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                  >
                    <option value="smartphone">Smartphone</option>
                    <option value="laptop">Laptop / MacBook</option>
                    <option value="tablet">Tablet / iPad</option>
                    <option value="desktop">Desktop / iMac</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text)] mb-1">
                    IMEI / Serial
                  </label>
                  <input
                    type="text"
                    value={serialOrImei}
                    onChange={(e) => setSerialOrImei(e.target.value)}
                    placeholder="IMEI"
                    className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text)] mb-1">
                  Registered Customer *
                </label>
                <select
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text)] mb-1">
                  Physical Condition / Intake Scratches
                </label>
                <textarea
                  rows={2}
                  value={conditionNotes}
                  onChange={(e) => setConditionNotes(e.target.value)}
                  placeholder="Scratches on frame, cracked screen..."
                  className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg border border-[var(--border)] hover:bg-[var(--surface-2)] text-[var(--text)]"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs sm:text-sm font-bold rounded-lg bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white"
                >
                  {t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
