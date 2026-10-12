import type { User } from '../types';
export function staffCode(user: User): string {
  return user.role === 'cashier' ? user.staff_code || `CASH-${user.id.replace(/^USR-CASH-/, '').slice(0, 8).toUpperCase()}` : user.id;
}
