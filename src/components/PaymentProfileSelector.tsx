import React from 'react';
import type { PaymentProfile } from '../types';
export function PaymentProfileSelector({value,onChange}:{value:PaymentProfile;onChange:(value:PaymentProfile)=>void}) {
  return <label className="block text-xs font-semibold">Payment profile<select aria-label="Payment profile" value={value} onChange={event=>onChange(event.target.value as PaymentProfile)} className="block w-full mt-1 p-2 rounded-lg border border-[var(--border)] bg-[var(--surface)]"><option value="myanmar">Myanmar</option><option value="thailand">Thailand</option><option value="china">China</option><option value="global">Global</option></select></label>;
}
