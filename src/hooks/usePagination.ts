import { useEffect, useState } from 'react';
import { flushSync } from 'react-dom';

export function usePagination<T>(items: readonly T[], resetKey = '') {
  const [printing, setPrinting] = useState(false);
  useEffect(() => {
    const before = () => flushSync(() => setPrinting(true));
    const after = () => setPrinting(false);
    window.addEventListener('beforeprint', before); window.addEventListener('afterprint', after);
    return () => { window.removeEventListener('beforeprint', before); window.removeEventListener('afterprint', after); };
  }, []);
  const [state, setState] = useState({ page: 1, size: 20, key: resetKey });
  if (state.key !== resetKey) setState({ ...state, page: 1, key: resetKey });
  const pageCount = Math.max(1, Math.ceil(items.length / state.size));
  const page = state.key === resetKey ? Math.min(state.page, pageCount) : 1;
  // Persist the clamp so later additions cannot unexpectedly restore an old page.
  if (state.key === resetKey && state.page !== page) setState({ ...state, page });
  const offset = printing ? 0 : (page - 1) * state.size;
  return {
    items: printing ? items : items.slice(offset, offset + state.size), total: items.length,
    page, pageCount, pageSize: state.size, offset,
    setPage: (value: number) => setState(previous => ({ ...previous, page: Math.max(1, Math.min(pageCount, Math.trunc(value) || 1)) })),
    setPageSize: (value: number) => setState(previous => ({ ...previous, page: 1, size: [20, 50, 100].includes(value) ? value : 20 })),
  };
}
