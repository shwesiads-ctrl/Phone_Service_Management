import { useEffect } from 'react';
export function useCloseConfirmation(enabled: boolean) {
  useEffect(() => {
    if (!enabled || /Electron\//.test(navigator.userAgent)) return;
    const confirmClose = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', confirmClose);
    return () => window.removeEventListener('beforeunload', confirmClose);
  }, [enabled]);
}
