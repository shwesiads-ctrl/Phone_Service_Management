import React from 'react';
import type {Currency} from '../types';
import type {DiscountType} from '../utils/jobPricing';
export function DiscountFields({type,value,onChange,currency,disabled=false}:{type:DiscountType;value:string;onChange:(type:DiscountType,value:string)=>void;currency:Currency;disabled?:boolean}) {
 return <fieldset disabled={disabled} className="grid grid-cols-2 gap-3 rounded-lg border border-[var(--border)] p-3 text-xs">
  <label className="block space-y-1"><span>Discount type</span><select aria-label="Discount type" value={type} onChange={event=>onChange(event.target.value as DiscountType,value)} className="w-full p-2 rounded-lg border border-[var(--border)] bg-[var(--surface)]"><option value="amount">Amount ({currency})</option><option value="percent">Percentage (%)</option></select></label>
  <label className="block space-y-1"><span>Discount {type==='percent'?'(%)':`(${currency})`}</span><input aria-label="Discount value" type="number" min="0" max={type==='percent'?100:undefined} step={currency==='MMK'&&type==='amount'?'1':'0.01'} value={value} onChange={event=>onChange(type,event.target.value)} className="w-full p-2 rounded-lg border border-[var(--border)] bg-[var(--surface)]"/></label>
 </fieldset>;
}
