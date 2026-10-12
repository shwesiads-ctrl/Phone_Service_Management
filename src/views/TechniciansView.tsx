import { usePagination } from '../hooks/usePagination';
import { Pagination } from '../components/Pagination';
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Technician } from '../types';
import {
  UserCog,
  Plus,
  Phone,
  Mail,
  MapPin,
  Key,
  ShieldAlert,
  Edit2,
  Trash2,
  X,
  CheckCircle,
  AlertCircle,
  Power,
  RotateCcw,
  CreditCard,
  Printer,
  QrCode,
  ShieldCheck,
} from 'lucide-react';

export const TechniciansView: React.FC = () => {
  const {
    technicians,
    getAuthHeaders,
    refreshTechnicians,
    language,
    createTechnician,
    updateTechnician,
    resetTechnicianPassword,
    deleteTechnician,
    navigate,
    setActiveTab,
    formatDate,
    settings,
    t,
  } = useApp();

  const [demoBusy, setDemoBusy] = useState(false);
  const manageDemo = async (remove: boolean) => {
    if (remove && !window.confirm(language === 'my' ? 'Demo user များကို ဖျက်မလား?' : 'Delete demo users? Regular accounts and shop records will be kept.')) return;
    setDemoBusy(true);
    try {
      const response = await fetch('/api/demo-users', { method: remove ? 'DELETE' : 'POST', headers: getAuthHeaders() });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Demo user operation failed');
      await refreshTechnicians();
    } catch (error: any) { alert(error.message); }
    finally { setDemoBusy(false); }
  };
  const [registerModalOpen, setRegisterModalOpen] = useState(false);

  const [deleteModalTech, setDeleteModalTech] = useState<Technician | null>(null);
  const [selectedTechIds, setSelectedTechIds] = useState<string[]>([]);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);

  const handleDeleteTech = (tech: Technician) => {
    setDeleteModalTech(tech);
  };

  const confirmDeleteTech = async () => {
    if (!deleteModalTech) return;
    try {
      await deleteTechnician(deleteModalTech.id);
      setDeleteModalTech(null);
    } catch (err: any) {
      alert(err.message || 'Failed to delete technician');
    }
  };

  const [techSearch,setTechSearch]=useState('');
  const [techStatus,setTechStatus]=useState('all');
  const filteredTechnicians=technicians.filter(tech=>
    (techStatus==='all'||tech.status===techStatus)&&
    [tech.full_name,tech.username,tech.phone,tech.email,tech.id,...(tech.specialization || [])].join(' ').toLowerCase().includes(techSearch.trim().toLowerCase())
  );
  const page = usePagination(filteredTechnicians,JSON.stringify([techSearch,techStatus]));
  const toggleSelectAll = () => {
    if (page.items.length > 0 && page.items.every(t => selectedTechIds.includes(t.id))) {
      setSelectedTechIds(previous => previous.filter(id => !page.items.some(t => t.id === id)));
    } else {
      setSelectedTechIds(previous => [...new Set([...previous, ...page.items.map(t => t.id)])]);
    }
  };

  const toggleSelectTech = (id: string) => {
    setSelectedTechIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const confirmBulkDelete = async () => {
    if (selectedTechIds.length === 0) return;
    try {
      await Promise.all(selectedTechIds.map((id) => deleteTechnician(id)));
      setSelectedTechIds([]);
      setBulkDeleteModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Failed to delete selected technicians');
    }
  };
  const [editingTech, setEditingTech] = useState<Technician | null>(null);
  const [passwordModalTech, setPasswordModalTech] = useState<Technician | null>(null);
  const [idCardModalTech, setIdCardModalTech] = useState<Technician | null>(null);
  const [cardPreset, setCardPreset] = useState<'blue' | 'dark' | 'minimal' | 'gradient' | 'workshop'>('blue');
  const [cardOrientation, setCardOrientation] = useState<'horizontal' | 'vertical'>('horizontal');
  const [cardSide, setCardSide] = useState<'front' | 'back'>('front');
  const [showQRCode, setShowQRCode] = useState(true);
  const [showBarcode, setShowBarcode] = useState(true);
  const [newPassword, setNewPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Form states
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [profilePhoto, setProfilePhoto] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [level, setLevel] = useState<'Senior' | 'Junior'>('Senior');
  const [formError, setFormError] = useState<string | null>(null);

  const handleTechPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Photo must be smaller than 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setProfilePhoto(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const openRegisterModal = () => {
    setEditingTech(null);
    setFullName('');
    setUsername('');
    setPassword('');
    setPhone('');
    setEmail('');
    setAddress('');
    setSpecialization('');
    setProfilePhoto('');
    setStatus('active');
    setLevel('Senior');
    setFormError(null);
    setRegisterModalOpen(true);
  };

  const openEditModal = (tech: Technician) => {
    setEditingTech(tech);
    setFullName(tech.full_name);
    setUsername(tech.username);
    setPhone(tech.phone);
    setEmail(tech.email);
    setAddress(tech.address || '');
    setSpecialization(tech.specialization ? tech.specialization.join(', ') : '');
    setProfilePhoto(tech.profile_photo || '');
    setStatus(tech.status);
    setLevel(tech.level || 'Senior');
    setFormError(null);
    setRegisterModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !username.trim()) return;
    setFormError(null);

    const specs = specialization
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      if (editingTech) {
        await updateTechnician(editingTech.id, {
          full_name: fullName,
          username,
          phone,
          email,
          address,
          profile_photo: profilePhoto,
          specialization: specs,
          status,
          level,
        });
      } else {
        await createTechnician({
          full_name: fullName,
          username,
          phone,
          email,
          address,
          profile_photo: profilePhoto,
          specialization: specs,
          status,
          level,
        });
      }
      setRegisterModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Operation failed');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordModalTech || !newPassword.trim()) return;
    try {
      await resetTechnicianPassword(passwordModalTech.id, newPassword.trim());
      setPasswordSuccess(true);
      setTimeout(() => {
        setPasswordSuccess(false);
        setPasswordModalTech(null);
        setNewPassword('');
      }, 1500);
    } catch (err: any) {
      alert(err.message || 'Password reset failed');
    }
  };

  const handleToggleStatus = async (tech: Technician) => {
    const nextStatus = tech.status === 'active' ? 'inactive' : 'active';
    await updateTechnician(tech.id, { status: nextStatus });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[var(--text)] tracking-tight">
            {t('technicians')}
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">
            Admin technician registration, account control, passwords, and service workbench assignments
          </p>
        </div>

        <button
          onClick={openRegisterModal}
          className="flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] rounded-lg shadow-sm transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{t('newTechnician')}</span>
        </button>
      </div>

      <div className="flex flex-wrap gap-3 items-center rounded-xl border border-[var(--border)] p-3">
        <span className="text-sm">Demo users: {technicians.filter(t => t.is_demo).length}</span>
        <button disabled={demoBusy} onClick={() => manageDemo(false)} className="px-3 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-50">{language === 'my' ? 'Demo User ထည့်ရန်' : 'Add Demo User'}</button>
        <button disabled={demoBusy || !technicians.some(t => t.is_demo)} onClick={() => manageDemo(true)} className="px-3 py-2 rounded-lg bg-rose-600 text-white disabled:opacity-50">{language === 'my' ? 'Demo User ဖျက်ရန်' : 'Delete Demo Users'}</button>
      </div>
      {/* Bulk Action Bar & Select All */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[var(--surface)] p-3 rounded-xl border border-[var(--border)]">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[var(--text)]">
            <input
              type="checkbox"
              checked={technicians.length > 0 && page.items.length > 0 && page.items.every(t => selectedTechIds.includes(t.id))}
              onChange={toggleSelectAll}
              className="w-4 h-4 rounded text-[var(--primary)] focus:ring-[var(--primary)] cursor-pointer"
            />
            <span>Select current page ({page.items.length})</span>
          </label>
          {selectedTechIds.length > 0 && (
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)]">
              {selectedTechIds.length} Selected
            </span>
          )}
        </div>

        {selectedTechIds.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedTechIds([])}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-[var(--border)] text-[var(--text)] hover:bg-[var(--surface-2)] cursor-pointer"
            >
              Deselect All
            </button>
            <button
              onClick={() => setBulkDeleteModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-rose-600 text-white hover:bg-rose-700 cursor-pointer shadow-sm"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected ({selectedTechIds.length})</span>
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <input aria-label="Search technicians" placeholder={language==='my'?'Technician အမည်၊ ဖုန်း၊ ID ရှာရန်…':'Search name, username, phone or ID…'} value={techSearch} onChange={e=>setTechSearch(e.target.value)} className="flex-1 min-w-48 px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--surface)]"/>
        <select aria-label="Technician status" value={techStatus} onChange={e=>setTechStatus(e.target.value)} className="px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--surface)]"><option value="all">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></select>
        <span className="text-xs text-[var(--text-muted)]">{filteredTechnicians.length} / {technicians.length} technicians</span>
      </div>
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
        <div className="overflow-x-auto"><table aria-label="Technician accounts" className="w-full min-w-[850px] text-left text-xs">
          <thead className="bg-[var(--surface-2)] text-[var(--text-muted)]"><tr><th className="p-3">#</th><th className="p-3">Select</th><th className="p-3">Technician / ID</th><th className="p-3">Contact</th><th className="p-3">Specializations</th><th className="p-3">Status</th><th className="p-3 text-right">Actions</th></tr></thead>
          <tbody className="divide-y divide-[var(--border)]">{page.items.map((tech,rowIndex)=><tr key={tech.id} className={selectedTechIds.includes(tech.id)?'bg-[var(--primary)]/10':'hover:bg-[var(--surface-2)]/40'}>
            <td className="p-3 font-mono text-[var(--text-muted)]">{page.offset+rowIndex+1}</td>
            <td className="p-3"><input aria-label={`Select ${tech.full_name}`} type="checkbox" checked={selectedTechIds.includes(tech.id)} onChange={()=>toggleSelectTech(tech.id)}/></td>
            <td className="p-3"><div className="flex gap-2 items-center">{tech.profile_photo?<img src={tech.profile_photo} alt={tech.full_name} className="w-9 h-9 shrink-0 rounded-full object-cover"/>:<span className="w-9 h-9 shrink-0 rounded-full bg-[var(--surface-2)] flex items-center justify-center font-bold">{tech.full_name.slice(0,2).toUpperCase()}</span>}<div><p className="font-bold text-sm">{tech.full_name}</p><p className="font-mono text-[10px] text-[var(--text-muted)]">{tech.id} · @{tech.username}{tech.is_demo?' · DEMO':''}</p></div></div></td>
            <td className="p-3 max-w-52"><p className="font-mono whitespace-nowrap">{tech.phone || '—'}</p><p title={tech.email} className="truncate text-[var(--text-muted)]">{tech.email}</p><p title={tech.address} className="truncate text-[10px] text-[var(--text-muted)]">{tech.address}</p></td>
            <td className="p-3 max-w-48"><p title={(tech.specialization || []).join(', ')} className="line-clamp-2 text-[var(--text-muted)]">{(tech.specialization || []).join(', ') || '—'}</p></td>
            <td className="p-3"><span className={`px-2 py-1 rounded text-[10px] font-bold ${tech.status==='active'?'bg-emerald-500/10 text-emerald-500':'bg-rose-500/10 text-rose-500'}`}>{tech.status}</span></td>
            <td className="p-3"><div className="flex items-center gap-1 justify-end whitespace-nowrap">
              <button title="Reset password" aria-label={`Reset password for ${tech.full_name}`} onClick={()=>setPasswordModalTech(tech)} className="p-2 rounded hover:bg-[var(--surface-2)] text-blue-500"><Key size={15}/></button>
              <button title={tech.status==='active'?'Disable technician':'Enable technician'} aria-label={`Toggle status for ${tech.full_name}`} onClick={()=>handleToggleStatus(tech)} className="p-2 rounded hover:bg-[var(--surface-2)] text-amber-500"><Power size={15}/></button>
              <button title="Generate Technician ID Card" aria-label={`ID card for ${tech.full_name}`} onClick={()=>setIdCardModalTech(tech)} className="p-2 rounded hover:bg-[var(--surface-2)] text-blue-500"><CreditCard size={15}/></button>
              <button title="Edit technician" aria-label={`Edit ${tech.full_name}`} onClick={()=>openEditModal(tech)} className="p-2 rounded hover:bg-[var(--surface-2)]"><Edit2 size={15}/></button>
              <button title="Delete Technician" aria-label={`Delete ${tech.full_name}`} onClick={()=>handleDeleteTech(tech)} className="p-2 rounded hover:bg-rose-500/10 text-rose-500"><Trash2 size={15}/></button>
            </div></td>
          </tr>)}{page.total===0&&<tr><td colSpan={7} className="p-8 text-center text-[var(--text-muted)]">No technicians match these filters.</td></tr>}</tbody>
        </table></div><Pagination {...page}/>
      </div>

      {/* Register / Edit Technician Modal */}
      {registerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
            <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
              <h3 className="font-bold text-base text-[var(--text)]">
                {editingTech ? t('edit') : t('newTechnician')}
              </h3>
              <button
                onClick={() => setRegisterModalOpen(false)}
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 mx-4 mt-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs font-semibold">
                {formError}
              </div>
            )}

            <form onSubmit={handleSave} className="p-4 space-y-3.5 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-bold text-[var(--text)] mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Kyaw Zin Win"
                  className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text)] mb-1">
                  Username * (Used for Technician Login)
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. kyawzin"
                  className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] font-mono"
                />
              </div>

              {!editingTech && (
                <div>
                  <label className="block text-xs font-bold text-[var(--text)] mb-1">
                    Initial Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] font-mono"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[var(--text)] mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+95 9 123 456"
                    className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text)] mb-1">
                    Technician Level
                  </label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] font-bold text-xs"
                  >
                    <option value="Senior">Senior</option>
                    <option value="Junior">Junior</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text)] mb-1">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text)] mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tech@fixflowlab.com"
                  className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text)] mb-1">
                  Workbench Address / Bay Location
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Bay 1 - Micro-soldering Station"
                  className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text)] mb-1">
                  Specialties (comma separated)
                </label>
                <input
                  type="text"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  placeholder="e.g. Power IC, Face ID, OLED Lamination"
                  className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text)] mb-1">
                  Profile Photo Upload
                </label>
                <div className="flex items-center gap-3">
                  {profilePhoto ? (
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-[var(--border)] shrink-0">
                      <img src={profilePhoto} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full border border-dashed border-[var(--border)] flex items-center justify-center text-[10px] text-[var(--text-muted)] shrink-0">
                      Photo
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleTechPhotoUpload}
                    className="block w-full text-xs text-[var(--text-muted)] file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-[var(--primary)] file:text-white cursor-pointer"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRegisterModalOpen(false)}
                  className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg border border-[var(--border)] hover:bg-[var(--surface-2)] text-[var(--text)] cursor-pointer"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs sm:text-sm font-bold rounded-lg bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white cursor-pointer"
                >
                  {t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalTech && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h3 className="font-bold text-sm text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" />
                <span>Delete Technician</span>
              </h3>
              <button
                onClick={() => setDeleteModalTech(null)}
                className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[var(--text)]">
              Are you sure you want to delete technician <strong className="text-[var(--primary)]">{deleteModalTech.full_name}</strong> (@{deleteModalTech.username})? Any assigned jobs will be safely reassigned.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalTech(null)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-[var(--border)] text-[var(--text)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteTech}
                className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-rose-600 text-white hover:bg-rose-700 cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {bulkDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h3 className="font-bold text-sm text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" />
                <span>Delete Selected Technicians</span>
              </h3>
              <button
                onClick={() => setBulkDeleteModalOpen(false)}
                className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[var(--text)]">
              Are you sure you want to permanently delete <strong className="text-[var(--primary)]">{selectedTechIds.length}</strong> selected technician(s)? Any associated records will be safely cleaned up.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setBulkDeleteModalOpen(false)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-[var(--border)] text-[var(--text)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmBulkDelete}
                className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-rose-600 text-white hover:bg-rose-700 cursor-pointer"
              >
                Delete Selected ({selectedTechIds.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {passwordModalTech && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h3 className="font-bold text-sm text-[var(--text)] flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-500" />
                <span>Reset Password: {passwordModalTech.full_name}</span>
              </h3>
              <button
                onClick={() => setPasswordModalTech(null)}
                className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {passwordSuccess ? (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold text-center">
                Password updated successfully!
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-[var(--text)] mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-xs font-mono text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setPasswordModalTech(null)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-[var(--border)] text-[var(--text)]"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]"
                  >
                    Confirm Reset
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Technician ID Card System Modal */}
      {idCardModalTech && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="w-full max-w-4xl bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="p-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--surface-2)]">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[var(--primary)]" />
                <div>
                  <h3 className="font-bold text-base text-[var(--text)]">
                    Professional Technician ID Card System
                  </h3>
                  <p className="text-xs text-[var(--text-muted)]">
                    CR80 Standard Size • Live Preview • Secure Verification
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIdCardModalTech(null)}
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface)] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body with Customization Sidebar & Live Preview */}
            <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 bg-[var(--bg)]">
              {/* Left Controls & Presets */}
              <div className="lg:col-span-5 p-5 border-r border-[var(--border)] space-y-4 bg-[var(--surface)] overflow-y-auto">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Design & Branding Controls
                </h4>

                {/* Design Presets */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--text)] mb-1.5">
                    Design Theme Preset
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'blue', name: 'Professional Blue', bg: 'bg-blue-600' },
                      { id: 'dark', name: 'Dark Premium', bg: 'bg-slate-900' },
                      { id: 'minimal', name: 'Minimal White', bg: 'bg-white border text-slate-900' },
                      { id: 'gradient', name: 'Modern Gradient', bg: 'bg-gradient-to-r from-indigo-500 to-purple-600' },
                      { id: 'workshop', name: 'Workshop Edition', bg: 'bg-amber-600' },
                    ].map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setCardPreset(preset.id as any)}
                        className={`flex items-center gap-2 p-2 rounded-xl text-xs font-medium border text-left transition-all ${
                          cardPreset === preset.id
                            ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)] shadow-sm'
                            : 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)] hover:border-[var(--text-muted)]'
                        }`}
                      >
                        <span className={`w-3.5 h-3.5 rounded-full ${preset.bg}`} />
                        <span className="truncate">{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Layout Orientation */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--text)] mb-1.5">
                    Card Orientation
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setCardOrientation('horizontal')}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                        cardOrientation === 'horizontal'
                          ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]'
                          : 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)]'
                      }`}
                    >
                      Horizontal (Landscape)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCardOrientation('vertical')}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                        cardOrientation === 'vertical'
                          ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]'
                          : 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)]'
                      }`}
                    >
                      Vertical (Portrait)
                    </button>
                  </div>
                </div>

                {/* Card Side Toggle */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--text)] mb-1.5">
                    Card Side View
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setCardSide('front')}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                        cardSide === 'front'
                          ? 'border-[var(--primary)] bg-[var(--primary)] text-white'
                          : 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)]'
                      }`}
                    >
                      Front Side
                    </button>
                    <button
                      type="button"
                      onClick={() => setCardSide('back')}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                        cardSide === 'back'
                          ? 'border-[var(--primary)] bg-[var(--primary)] text-white'
                          : 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)]'
                      }`}
                    >
                      Back Side (Details)
                    </button>
                  </div>
                </div>

                {/* Security & Badges */}
                <div className="space-y-2 pt-2 border-t border-[var(--border)]">
                  <label className="block text-xs font-semibold text-[var(--text)]">
                    Card Features & Elements
                  </label>
                  <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-[var(--surface-2)]">
                    <span className="text-[var(--text)]">Show QR Code</span>
                    <input
                      type="checkbox"
                      checked={showQRCode}
                      onChange={(e) => setShowQRCode(e.target.checked)}
                      className="rounded text-[var(--primary)] focus:ring-[var(--primary)]"
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-[var(--surface-2)]">
                    <span className="text-[var(--text)]">Show Barcode</span>
                    <input
                      type="checkbox"
                      checked={showBarcode}
                      onChange={(e) => setShowBarcode(e.target.checked)}
                      className="rounded text-[var(--primary)] focus:ring-[var(--primary)]"
                    />
                  </div>
                </div>

                {/* Technician Quick Summary */}
                <div className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] space-y-1">
                  <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase">Selected Technician</div>
                  <div className="font-bold text-xs text-[var(--text)]">{idCardModalTech.full_name}</div>
                  <div className="text-xs font-mono text-[var(--primary)]">ID: {idCardModalTech.id}</div>
                </div>
              </div>

              {/* Right Live Preview Area */}
              <div className="lg:col-span-7 p-6 flex flex-col items-center justify-center bg-[var(--bg)] relative overflow-hidden">
                <div className="absolute top-3 left-4 text-xs font-mono text-[var(--text-muted)] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live Preview ({cardOrientation.toUpperCase()} - {cardSide.toUpperCase()})
                </div>

                {/* Printable ID Card Badge (CR80 proportions) */}
                <div
                  id="tech-id-card-print"
                  className={`relative shadow-2xl overflow-hidden transition-all duration-300 border-2 ${
                    cardOrientation === 'horizontal'
                      ? 'w-[420px] h-[260px] rounded-2xl'
                      : 'w-[280px] h-[440px] rounded-2xl'
                  } ${
                    cardPreset === 'dark'
                      ? 'bg-slate-950 text-slate-100 border-slate-800'
                      : cardPreset === 'minimal'
                      ? 'bg-white text-slate-900 border-slate-300'
                      : cardPreset === 'workshop'
                      ? 'bg-zinc-900 text-amber-50 border-amber-600/50'
                      : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  {cardSide === 'front' ? (
                    /* FRONT SIDE */
                    cardOrientation === 'horizontal' ? (
                      /* Horizontal Front */
                      <div className="h-full flex flex-col justify-between p-4 relative">
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2.5">
                          <div className="flex items-center gap-2">
                            {settings.shopLogo ? (
                              <img src={settings.shopLogo} alt="Shop Logo" className="w-8 h-8 object-contain rounded-lg bg-slate-100 p-0.5" />
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-sm">
                                {settings.shopName.charAt(0)}
                              </div>
                            )}
                            <div>
                              <h5 className="font-extrabold text-xs tracking-tight">{settings.shopName}</h5>
                              {settings.address && (
                                <p className="text-[8px] text-slate-500 font-medium truncate max-w-[200px]">{settings.address}</p>
                              )}
                              <p className="text-[8px] text-slate-500 font-mono">OFFICIAL TECHNICIAN BADGE</p>
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-[9px] font-bold border border-emerald-500/20 uppercase">
                            {idCardModalTech.status}
                          </span>
                        </div>

                        {/* Middle Content */}
                        <div className="flex items-center gap-4 my-auto">
                          <div className="relative">
                            <div className="w-20 h-20 rounded-xl bg-slate-200 dark:bg-slate-800 border-2 border-blue-600 shadow-md overflow-hidden flex items-center justify-center">
                              {idCardModalTech.profile_photo ? (
                                <img src={idCardModalTech.profile_photo} alt={idCardModalTech.full_name} className="w-full h-full object-cover" />
                              ) : (
                                <UserCog className="w-10 h-10 text-slate-400" />
                              )}
                            </div>
                          </div>
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-1.5">
                              <h4 className="font-black text-base tracking-tight leading-tight">{idCardModalTech.full_name}</h4>
                              {idCardModalTech.level && (
                                <span className="px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-mono text-[9px] font-bold border border-amber-500/30">
                                  {idCardModalTech.level}
                                </span>
                              )}
                            </div>
                            <div className="inline-block px-2 py-0.5 rounded bg-blue-600/10 text-blue-600 dark:text-blue-400 font-mono text-xs font-bold mb-1">
                              {idCardModalTech.id}
                            </div>
                            <p className="text-[9px] text-slate-500 font-mono">Started: {idCardModalTech.created_at ? new Date(idCardModalTech.created_at).toLocaleDateString() : 'N/A'}</p>
                          </div>
                        </div>

                        {/* Footer Barcode / QR */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
                          {showBarcode && (
                            <div className="font-mono text-[8px] text-slate-400 tracking-widest">
                              ||| |||| || |||||| |||| |||
                            </div>
                          )}
                          {showQRCode && (
                            <div className="w-8 h-8 bg-white p-0.5 rounded border border-slate-200 flex items-center justify-center">
                              <QrCode className="w-full h-full text-slate-900" />
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* Vertical Front */
                      <div className="h-full flex flex-col justify-between p-5 text-center relative">
                        <div className="space-y-1">
                          {settings.shopLogo ? (
                            <img src={settings.shopLogo} alt="Logo" className="w-10 h-10 object-contain mx-auto rounded-lg bg-slate-100 p-0.5" />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center mx-auto text-base">
                              {settings.shopName.charAt(0)}
                            </div>
                          )}
                          <h4 className="font-extrabold text-sm">{settings.shopName}</h4>
                          <p className="text-[9px] text-slate-500 uppercase font-mono">Staff ID Card</p>
                        </div>

                        <div className="my-3 flex flex-col items-center">
                          <div className="w-24 h-24 rounded-2xl bg-slate-200 dark:bg-slate-800 border-2 border-blue-600 shadow-lg overflow-hidden flex items-center justify-center mb-3">
                            {idCardModalTech.profile_photo ? (
                              <img src={idCardModalTech.profile_photo} alt={idCardModalTech.full_name} className="w-full h-full object-cover" />
                            ) : (
                              <UserCog className="w-12 h-12 text-slate-400" />
                            )}
                          </div>
                          <h3 className="font-black text-base tracking-tight">{idCardModalTech.full_name}</h3>
                          <div className="mt-1 px-2.5 py-0.5 rounded-full bg-blue-600/10 text-blue-600 font-mono text-xs font-bold">
                            {idCardModalTech.id}
                          </div>
                        </div>

                        <div className="space-y-1 text-left bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-[9px]">
                          <div className="flex justify-between">
                            <span className="text-slate-500 font-mono">Level:</span>
                            <span className="font-bold font-mono text-amber-600">{idCardModalTech.level || 'Senior'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500 font-mono">Phone:</span>
                            <span className="font-bold font-mono">{idCardModalTech.phone || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500 font-mono">Shop Address:</span>
                            <span className="font-bold truncate max-w-[150px]">{settings.address || 'Main Service Center'}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
                          <span className="text-[9px] font-mono text-slate-400">||| |||| || ||||</span>
                          <span className="text-[9px] font-bold text-emerald-600 uppercase">Authorized</span>
                        </div>
                      </div>
                    )
                  ) : (
                    /* BACK SIDE */
                    <div className="h-full flex flex-col justify-between p-5 text-left relative">
                      <div className="space-y-1">
                        <h5 className="font-bold text-xs uppercase tracking-wider text-slate-500">Terms & Conditions</h5>
                        <p className="text-[9px] text-slate-500 leading-relaxed">
                          This card is property of {settings.shopName}. If found, please return to the workshop address below or contact management immediately.
                        </p>
                      </div>

                      <div className="space-y-2 text-[10px] bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-mono">Workshop Address:</span>
                          <span className="font-bold text-right truncate max-w-[180px]">{settings.address || 'Main Service Center'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-mono">Issue Date:</span>
                          <span className="font-bold font-mono">{idCardModalTech.created_at ? new Date(idCardModalTech.created_at).toLocaleDateString() : 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-mono">Validity:</span>
                          <span className="font-bold font-mono text-emerald-600">Active / Unrestricted</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
                        <div className="text-[9px] font-mono text-slate-400">
                          SECURE ID: {idCardModalTech.id}
                        </div>
                        <div className="text-[9px] font-bold uppercase text-blue-600">
                          {settings.shopName}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 border-t border-[var(--border)] bg-[var(--surface-2)] flex items-center justify-between">
              <span className="text-xs text-[var(--text-muted)]">
                Ready for thermal badge printer or PDF export
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIdCardModalTech(null)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-[var(--border)] text-[var(--text)] hover:bg-[var(--surface)]"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    window.print();
                  }}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] shadow"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print ID Card</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
