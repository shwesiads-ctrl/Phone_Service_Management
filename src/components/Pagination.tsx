import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

interface Props {
  total: number; page: number; pageCount: number; pageSize: number; offset: number;
  setPage: (page: number) => void; setPageSize: (size: number) => void;
}
export function Pagination({ total, page, pageCount, pageSize, offset, setPage, setPageSize }: Props) {
  const { language } = useApp();
  const [jump, setJump] = useState('');
  const labels = language === 'my' ? ['စာရင်း', 'တစ်မျက်နှာ', 'ရှေ့', 'နောက်', 'စာမျက်နှာသို့', 'သွားရန်'] : language === 'th' ? ['รายการ', 'ต่อหน้า', 'ก่อนหน้า', 'ถัดไป', 'ไปที่หน้า', 'ไป'] : language === 'zh' ? ['条记录', '每页', '上一页', '下一页', '跳转页', '跳转'] : ['records', 'per page', 'Previous', 'Next', 'Go to page', 'Go'];
  const pages = [...new Set([1, pageCount, ...Array.from({ length: 5 }, (_, i) => page + i - 2).filter(n => n >= 1 && n <= pageCount)])].sort((a, b) => a - b);
  const style = 'px-3 py-2 rounded-lg border border-[var(--border)] disabled:opacity-40 hover:bg-[var(--surface-2)]';
  return <nav aria-label="Pagination" className="print:hidden flex flex-wrap items-center justify-between gap-3 p-4 border-t border-[var(--border)] text-xs">
    <span aria-live="polite">{total ? offset + 1 : 0}–{Math.min(offset + pageSize, total)} / {total} {labels[0]}</span>
    <label>{labels[1]} <select aria-label="Rows per page" className={style + ' bg-[var(--surface)]'} value={pageSize} onChange={e => setPageSize(Number(e.target.value))}>{[20, 50, 100].map(n => <option key={n}>{n}</option>)}</select></label>
    <div className="flex flex-wrap items-center gap-1">
      <button className={style} disabled={page === 1} onClick={() => setPage(page - 1)} aria-label="Previous page">{labels[2]}</button>
      {pages.map((n, i) => <React.Fragment key={n}>{i > 0 && n - pages[i - 1] > 1 && <span className="px-1">…</span>}<button className={style + (n === page ? ' bg-[var(--primary)] text-white font-bold' : '')} aria-label={`Page ${n}`} aria-current={n === page ? 'page' : undefined} onClick={() => setPage(n)}>{n}</button></React.Fragment>)}
      <button className={style} disabled={page === pageCount} onClick={() => setPage(page + 1)} aria-label="Next page">{labels[3]}</button>
    </div>
    <form className="flex items-center gap-2" onSubmit={e => { e.preventDefault(); if (jump.trim()) setPage(Number(jump)); setJump(''); }}>
      <label>{labels[4]} <input aria-label="Go to page" type="number" min="1" max={pageCount} value={jump} onChange={e => setJump(e.target.value)} className={style + ' w-20 bg-[var(--surface)]'} /></label><button className={style}>{labels[5]}</button>
    </form>
  </nav>;
}
