import type { Language, PaymentMethodConfig } from '../types';
export function paymentMethodLabel(method:PaymentMethodConfig,language:Language='en'):string {
  const common:Record<string,Record<Language,string>>={
    cash:{en:'Cash',my:'ငွေသား',th:'เงินสด',zh:'现金'},
    bank_transfer:{en:'Bank Transfer',my:'ဘဏ်လွှဲငွေ',th:'โอนเงินผ่านธนาคาร',zh:'银行转账'},
    card:{en:'Credit / Debit Card',my:'Credit / Debit Card',th:'บัตรเครดิต / เดบิต',zh:'信用卡 / 借记卡'},
    other:{en:'Other',my:'အခြား',th:'อื่นๆ',zh:'其他'},
  };
  const label=method.name.match(/\(([^)]+)\)$/)?.[1] || method.name;
  const key=method.id.toLowerCase().replace(/\s+/g,'_');
  const legacyKey=label.toLowerCase().replace(/\s+/g,'_');
  return (common[key] || common[legacyKey])?.[language] || (language==='th'&&method.thai_name?method.thai_name:method.name.match(/\(([^)]+)\)$/)?.[1] || method.name);
}
