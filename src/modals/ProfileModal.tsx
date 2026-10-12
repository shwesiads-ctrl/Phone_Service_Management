import { staffCode } from '../utils/staffCode';
import { readUploadedImage } from '../utils/imageUpload';
import { CashierCardModal } from '../components/CashierCardModal';
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Shield, Wrench, User as UserIcon, Mail, Phone, Calendar, Edit3, Camera, Save } from 'lucide-react';

interface ProfileModalProps {
  onClose: () => void;
  onChangePasswordClick: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ onClose, onChangePasswordClick }) => {
  const { currentUser, role, setCurrentUser, getAuthHeaders } = useApp();

  const [cardOpen, setCardOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(currentUser?.full_name || '');
  const [username, setUsername] = useState(currentUser?.username || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [profilePhoto, setProfilePhoto] = useState(currentUser?.profile_photo || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file=e.target.files?.[0];if(!file)return;
    setError(null);setLoading(true);
    try{setProfilePhoto(await readUploadedImage(file));}catch(error:any){setError(error.message);}finally{setLoading(false);}
    e.target.value='';
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !username.trim()) {
      setError('Full name and username are required.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          full_name: fullName.trim(),
          username: username.trim(),
          email: email.trim(),
          phone: phone.trim(),
          profile_photo: profilePhoto,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }
      setCurrentUser(data.user);
      setIsEditing(false);
      window.location.reload();
    } catch (err: any) {
      setError(err.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      {currentUser.role === 'cashier' && <button type="button" onClick={()=>setCardOpen(true)} className="fixed bottom-6 right-6 z-[70] px-4 py-2 rounded-lg bg-blue-600 text-white">My ID Card</button>}
      {cardOpen && <CashierCardModal user={currentUser} onClose={()=>setCardOpen(false)}/>}
      <div className="w-full max-w-md rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[var(--surface-2)]/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[var(--text)]">User Profile</h3>
              <p className="text-[11px] text-[var(--text-muted)] font-mono">ID: {staffCode(currentUser)}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold">
              {error}
            </div>
          )}

          {!isEditing ? (
            <>
              <div className="text-center pb-4 border-b border-[var(--border)] space-y-2 relative">
                <button
                  onClick={() => setIsEditing(true)}
                  className="absolute top-0 right-0 p-2 rounded-xl bg-[var(--surface-2)] text-[var(--text)] hover:bg-[var(--primary)] hover:text-white transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold"
                  title="Edit Profile"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>

                <div className="w-20 h-20 rounded-full bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto text-2xl font-black border border-blue-500/20 overflow-hidden shadow-md">
                  {currentUser.profile_photo ? (
                    <img src={currentUser.profile_photo} alt={currentUser.full_name} className="w-full h-full object-cover" />
                  ) : (
                    currentUser.full_name ? currentUser.full_name.charAt(0).toUpperCase() : 'U'
                  )}
                </div>
                <h4 className="font-black text-base text-[var(--text)]">{currentUser.full_name}</h4>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  {role === 'admin' ? <Shield className="w-3.5 h-3.5" /> : <Wrench className="w-3.5 h-3.5" />}
                  <span>{role === 'admin' ? 'Administrator' : `Technician (${currentUser.technician_id || 'Staff'})`}</span>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-2 border-b border-[var(--border)]">
                  <span className="text-[var(--text-muted)] font-medium">Username</span>
                  <span className="font-mono font-bold text-[var(--text)]">@{currentUser.username}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[var(--border)]">
                  <span className="text-[var(--text-muted)] font-medium">Email</span>
                  <span className="font-mono text-[var(--text)]">{currentUser.email || '—'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[var(--border)]">
                  <span className="text-[var(--text-muted)] font-medium">Phone</span>
                  <span className="font-mono text-[var(--text)]">{currentUser.phone || '—'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[var(--border)]">
                  <span className="text-[var(--text-muted)] font-medium">User Role</span>
                  <span className="font-bold text-[var(--text)] capitalize">{currentUser.role}</span>
                </div>
                {currentUser.technician_id && (
                  <div className="flex justify-between py-2 border-b border-[var(--border)]">
                    <span className="text-[var(--text-muted)] font-medium">Technician ID</span>
                    <span className="font-mono font-bold text-[var(--text)]">{currentUser.technician_id}</span>
                  </div>
                )}
                <div className="flex justify-between py-2 border-b border-[var(--border)]">
                  <span className="text-[var(--text-muted)] font-medium">Account Created</span>
                  <span className="font-mono text-[var(--text)]">
                    {currentUser.created_at ? new Date(currentUser.created_at).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  onClick={() => {
                    onClose();
                    onChangePasswordClick();
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-[var(--border)] hover:bg-[var(--surface-2)] text-[var(--text)] font-bold text-xs transition-colors cursor-pointer"
                >
                  Change Password
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-lg shadow-blue-600/20"
                >
                  Close Profile
                </button>
              </div>
            </>
          ) : (
            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="flex flex-col items-center pb-2">
                <div className="relative w-20 h-20 rounded-full bg-blue-600/10 text-blue-600 flex items-center justify-center overflow-hidden border-2 border-blue-500 shadow-md mb-2">
                  {profilePhoto ? (
                    <img src={profilePhoto} alt="Profile Preview" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="w-10 h-10 text-blue-500" />
                  )}
                  <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer text-white">
                    <Camera className="w-5 h-5" />
                    <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handlePhotoUpload} className="hidden" />
                  </label>
                </div>
                <span className="text-[11px] text-[var(--text-muted)]">Click avatar to upload profile photo</span>
              </div>

              <div>
                <label className="block font-bold text-[var(--text)] mb-1">Full Name *</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-[var(--text)] mb-1">Username *</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-[var(--text)] mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@repairshop.com"
                  className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-[var(--text)] mb-1">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+959..."
                  className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[var(--border)] hover:bg-[var(--surface-2)] text-[var(--text)] font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-lg shadow-blue-600/20 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{loading ? 'Saving...' : 'Save Profile'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
