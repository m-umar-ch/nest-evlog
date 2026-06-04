import type { User } from '../../users/users.types';

export interface OrderSummary {
  orderId: string;
  totalCents: number;
  itemCount: number;
}

export function buildEmailSubject(orderId: string): string {
  return `Order confirmation — ${orderId}`;
}

export function buildEmailBody(user: User, summary: OrderSummary): string {
  return [
    `Hi ${user.name},`,
    '',
    `Your order ${summary.orderId} for ${summary.itemCount} item(s) has been confirmed.`,
    `Total charged: $${(summary.totalCents / 100).toFixed(2)}`,
    '',
    'Thank you for shopping with us!',
  ].join('\n');
}

export function selectNotificationChannel(plan: User['plan']): 'email' | 'email+sms' {
  return plan === 'enterprise' ? 'email+sms' : 'email';
}
