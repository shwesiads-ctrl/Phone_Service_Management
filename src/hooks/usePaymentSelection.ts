import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { defaultPaymentSettings } from '../utils/paymentDefaults';
import type { PaymentProfile } from '../types';

// A cashier's payment form can choose a region without changing workshop settings.
export function usePaymentSelection() {
  const app=useApp();
  const [selected,setSelected]=useState<PaymentProfile|null>(null);
  const profile=selected || app.activePaymentProfile || 'myanmar';
  const methods=(app.settings?.paymentSettings || defaultPaymentSettings)[profile]?.methods.filter(method=>method.enabled) || app.availablePaymentMethods || [];
  return {profile,selectProfile:setSelected,methods};
}
