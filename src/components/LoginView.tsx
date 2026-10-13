import type { Theme,Language } from '../types';
import {loginLabels} from '../i18n/loginLabels';
import { RegisterAdminForm } from './RegisterAdminForm';
import { ForgotPasswordForm } from './ForgotPasswordForm';
import { accountLabels } from '../i18n/accountLabels';
import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Shield, Wrench, Lock, User as UserIcon, AlertCircle, ArrowRight } from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login, language, setLanguage, theme='system', setTheme } = useApp();
  const l=loginLabels(language);
  const setupRequestVersion=useRef(0);
  const [registrationAvailable,setRegistrationAvailable]=useState(false);
  useEffect(()=>{let active=true;const refresh=async()=>{const version=++setupRequestVersion.current;try{const response=await fetch('/api/auth/setup-status',{cache:'no-store'});if(response.ok){const value=await response.json();if(active&&version===setupRequestVersion.current){setRegistrationAvailable(value.registration_open===true);if(!value.registration_open)setRegisterOpen(false);}}}catch{}};void refresh();window.addEventListener('focus',refresh);const timer=window.setInterval(refresh,15000);return()=>{active=false;clearInterval(timer);window.removeEventListener('focus',refresh);};},[]);
  const [registerOpen,setRegisterOpen]=useState(false);
  const [registered,setRegistered]=useState('');
  const [forgotOpen, setForgotOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError(l.required);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const success = await login(username.trim(), password);
      if (!success) {
        setError(l.invalid);
      }
    } catch (err: any) {
      setError(err.message || l.failure);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4 py-12">
      <div className="max-w-md w-full space-y-8 p-8 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-2xl relative overflow-hidden">
        {/* Decorative Top Accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500" />

        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-4 border border-blue-500/20 shadow-inner">
            <Wrench className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-[var(--text)]">
            FixFlow Service Lab
          </h2>
          <p className="text-xs text-[var(--text-muted)] font-medium">
            {l.subtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 text-xs text-[var(--text-muted)]"><label className="flex items-center gap-2">{l.language}<select aria-label="Login language" value={language} onChange={e=>setLanguage(e.target.value as Language)} className="px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-2)]"><option value="my">မြန်မာ</option><option value="en">English</option><option value="th">ไทย</option><option value="zh">中文</option></select></label><label className="flex items-center gap-2">{l.theme}<select aria-label="Login theme" value={theme} onChange={e=>setTheme(e.target.value as Theme)} className="px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-2)]"><option value="light">{l.light}</option><option value="dark">{l.dark}</option><option value="system">{l.system}</option></select></label></div>
        {registerOpen ? <RegisterAdminForm language={language} onClose={()=>setRegisterOpen(false)} onCreated={name=>{setupRequestVersion.current++;setRegistrationAvailable(false);setRegisterOpen(false);setRegistered(name);setUsername(name);setPassword('');}}/> : forgotOpen ? <ForgotPasswordForm language={language} onClose={() => setForgotOpen(false)} /> : <>
        {registered && <p role="status" className="text-sm text-emerald-500">{language==='my'?'Admin အကောင့်ဖွင့်ပြီးပါပြီ။ Login ဝင်နိုင်ပါပြီ။':'Admin account created. Sign in with your new password.'} ({registered})</p>}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[var(--text)] uppercase tracking-wider">
              {l.username}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-muted)]">
                <UserIcon className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={l.usernamePlaceholder}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all font-medium"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[var(--text)] uppercase tracking-wider">
              {l.password}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-muted)]">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={l.passwordPlaceholder}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>{l.signIn}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {registrationAvailable && <button type="button" aria-label="New User Register" onClick={()=>{setRegisterOpen(true);setError(null);setPassword('');setRegistered('');}} className="w-full py-2.5 rounded-lg border border-blue-500/40 text-blue-500 font-semibold">{language==='my'?'New User Register — Admin အကောင့်အသစ်':'New User Register — Create Admin Account'}</button>}
        <button type="button" onClick={() => {setForgotOpen(true);setError(null);setPassword('');}} className="w-full text-sm text-blue-500">{accountLabels(language).forgot}</button>
        </>}
      </div>
    </div>
  );
};
