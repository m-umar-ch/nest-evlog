import { Injectable } from '@nestjs/common';
import { createError } from 'evlog';
import { useLogger } from 'evlog/nestjs';
import { generateId } from '../common/helpers/id.helper';
import { formatCurrency } from '../common/helpers/money.helper';
import {
  isCardExpired,
  maskCardNumber,
  simulateAuthorization,
  validateCardBrand,
  type CardDetails,
  type PaymentResult,
} from './helpers/card.helper';

@Injectable()
export class PaymentsService {
  charge(amountCents: number, card: CardDetails): PaymentResult {
    const log = useLogger();
    log.set({
      payment: {
        amount: formatCurrency(amountCents),
        card: maskCardNumber(card.last4),
        brand: card.brand,
      },
    });

    if (!validateCardBrand(card.brand)) {
      throw createError({
        message: 'Unsupported card brand',
        status: 402,
        why: `Brand "${card.brand}" is not accepted`,
        fix: 'Use Visa, Mastercard, or Amex',
      });
    }

    if (isCardExpired(card.expiryMonth, card.expiryYear)) {
      throw createError({
        message: 'Card expired',
        status: 402,
        why: `Card expired ${card.expiryMonth}/${card.expiryYear}`,
        fix: 'Update your payment method',
      });
    }

    const status = simulateAuthorization(amountCents, card.last4);

    if (status === 'declined') {
      throw createError({
        message: 'Payment declined',
        status: 402,
        why: 'Card declined by payment processor',
        fix: 'Try a different payment method',
        link: 'https://docs.example.com/payments/declined',
      });
    }

    const result: PaymentResult = {
      transactionId: generateId('txn'),
      amountCents,
      status,
      processedAt: new Date().toISOString(),
    };

    log.set({
      payment: {
        status: result.status,
        transactionId: result.transactionId,
      },
    });

    return result;
  }
}
