import type {Currency} from '../types';
export type DiscountType = 'amount' | 'percent';
export function calculateJobPricing(serviceCharge:number,partsCost:number,type:DiscountType='amount',value:number=0,currency:Currency='MMK') {
 const subtotal=Number(serviceCharge)+Number(partsCost);
 if(!Number.isFinite(subtotal)||subtotal<0)throw new Error('Charges must be finite and non-negative.');
 if(!['amount','percent'].includes(type)||!Number.isFinite(value)||value<0)throw new Error('Enter a valid non-negative discount.');
 if(type==='percent'&&value>100)throw new Error('Discount percentage must be between 0 and 100.');
 if(type==='amount'&&value>subtotal)throw new Error('Discount cannot exceed the subtotal.');
 const precision=currency==='MMK'?1:100;
 const discountAmount=Math.round((type==='percent'?subtotal*value/100:value)*precision)/precision;
 const total=discountAmount===0?subtotal:Math.round(Math.max(0,subtotal-discountAmount)*precision)/precision;
 return {subtotal,discount_type:type,discount_value:value,discount_amount:Math.min(subtotal,discountAmount),total_cost:total};
}
