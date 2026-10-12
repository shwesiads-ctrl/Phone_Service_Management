import React, { useEffect, useState } from 'react';
export function DefaultCredentialHints({ username }: { username?: string }) {
  const [credentials, setCredentials] = useState<{ username: string; password: string }[]>([]);
  useEffect(() => {
    let active = true;
    let requestId = 0;
    const refresh = async () => {
      const currentRequest = ++requestId;
      try {
        const response = await fetch('/api/auth/default-credentials', { cache: 'no-store' });
        const data = response.ok ? await response.json() : { credentials: [] };
        if (active && currentRequest === requestId) setCredentials(data.credentials || []);
      } catch { if (active && currentRequest === requestId) setCredentials([]); }
    };
    void refresh();
    window.addEventListener('focus', refresh);
    window.addEventListener('fixflow-password-changed', refresh);
    const timer = window.setInterval(refresh, 15000);
    return () => { active = false; window.clearInterval(timer); window.removeEventListener('focus', refresh); window.removeEventListener('fixflow-password-changed', refresh); };
  }, []);
  const visible = credentials.filter(c => !username || c.username === username);
  if (!visible.length) return null;
  return <div className="text-xs text-[var(--text-muted)] space-y-1" aria-label="Default login credentials">
    <p>Default login / မူလဝင်ရောက်ရန်:</p>
    {visible.map(c => <p key={c.username}><b>{c.username}</b> / <b>{c.password}</b></p>)}
  </div>;
}
