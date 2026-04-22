
import type { BudgetSummary, Transaction } from '@/types';

export const formatCurrency = (amount: number, currency = 'INR') => {
    const isINR = currency.toUpperCase() === 'INR';
    const absAmount = Math.abs(amount);
    
    let formatted = '';
    if (isINR) {
      if (absAmount >= 10000000) {
        formatted = (absAmount / 10000000).toFixed(absAmount % 10000000 === 0 ? 0 : 1) + 'Cr';
      } else if (absAmount >= 100000) {
        formatted = (absAmount / 100000).toFixed(absAmount % 100000 === 0 ? 0 : 1) + 'L';
      } else if (absAmount >= 1000) {
        formatted = (absAmount / 1000).toFixed(absAmount % 1000 === 0 ? 0 : 1) + 'k';
      } else {
        formatted = absAmount.toString();
      }
    } else {
      if (absAmount >= 1000000000) {
        formatted = (absAmount / 1000000000).toFixed(absAmount % 1000000000 === 0 ? 0 : 1) + 'B';
      } else if (absAmount >= 1000000) {
        formatted = (absAmount / 1000000).toFixed(absAmount % 1000000 === 0 ? 0 : 1) + 'M';
      } else if (absAmount >= 1000) {
        formatted = (absAmount / 1000).toFixed(absAmount % 1000 === 0 ? 0 : 1) + 'k';
      } else {
        formatted = absAmount.toString();
      }
    }
    
    const parts = new Intl.NumberFormat('en-IN', { style: 'currency', currency }).formatToParts(0);
    const currencySymbol = parts.find(p => p.type === 'currency')?.value || (isINR ? '₹' : '$');
    
    return amount < 0 ? `-${currencySymbol}${formatted}` : `${currencySymbol}${formatted}`;
}

export const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    }).format(dateObj);
};
