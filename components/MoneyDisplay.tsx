'use client';

import { formatMoney, formatMoneyCompact, CurrencyCode } from '@/lib/currency';

interface MoneyDisplayProps {
  amount: number;
  currency?: CurrencyCode;
  compact?: boolean;
  className?: string;
}

/**
 * Composant pour afficher un montant formaté avec devise
 */
export function MoneyDisplay({ 
  amount, 
  currency, 
  compact = false,
  className = ''
}: MoneyDisplayProps) {
  const formatted = compact 
    ? formatMoneyCompact(amount, currency)
    : formatMoney(amount, currency);

  return (
    <span className={className}>
      {formatted}
    </span>
  );
}

/**
 * Composant pour afficher un prix avec style
 */
export function PriceTag({ 
  amount, 
  currency,
  size = 'md',
  variant = 'default'
}: MoneyDisplayProps & { 
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'success' | 'warning' | 'danger';
}) {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl font-semibold',
    xl: 'text-3xl font-bold'
  };

  const variantClasses = {
    default: 'text-white',
    success: 'text-emerald-400',
    warning: 'text-amber-400',
    danger: 'text-red-400'
  };

  return (
    <span className={`${sizeClasses[size]} ${variantClasses[variant]}`}>
      {formatMoney(amount, currency)}
    </span>
  );
}


