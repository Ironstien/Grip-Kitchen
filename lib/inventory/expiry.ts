import { EXPIRY_WARNING_DAYS } from '@/constants/inventory';

export type ExpiryStatus = 'ok' | 'expiring' | 'expired' | 'none';

export function getExpiryStatus(expirationDate: string | null | undefined): ExpiryStatus {
  if (!expirationDate) {
    return 'none';
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiry = new Date(`${expirationDate}T00:00:00`);
  if (Number.isNaN(expiry.getTime())) {
    return 'none';
  }

  const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return 'expired';
  }

  if (diffDays <= EXPIRY_WARNING_DAYS) {
    return 'expiring';
  }

  return 'ok';
}

export function formatExpirationDate(expirationDate: string | null | undefined): string {
  if (!expirationDate) {
    return '—';
  }

  const date = new Date(`${expirationDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return expirationDate;
  }

  return date.toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function getExpiryLabel(status: ExpiryStatus): string {
  switch (status) {
    case 'expired':
      return 'Expired';
    case 'expiring':
      return 'Expiring soon';
    case 'ok':
      return 'In stock';
    default:
      return 'No expiry';
  }
}
