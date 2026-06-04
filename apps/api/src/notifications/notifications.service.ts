import { Injectable } from '@nestjs/common';
import { useLogger } from 'evlog/nestjs';
import type { User } from '../users/users.types';
import {
  buildEmailBody,
  buildEmailSubject,
  selectNotificationChannel,
  type OrderSummary,
} from './helpers/template.helper';

export interface NotificationResult {
  channel: 'email' | 'email+sms';
  subject: string;
  delivered: boolean;
  sentAt: string;
}

@Injectable()
export class NotificationsService {
  sendOrderConfirmation(user: User, summary: OrderSummary): NotificationResult {
    const log = useLogger();
    const channel = selectNotificationChannel(user.plan);
    const subject = buildEmailSubject(summary.orderId);
    const body = buildEmailBody(user, summary);

    log.set({
      notification: {
        type: 'order_confirmation',
        channel,
        recipient: user.email,
        subject,
        bodyLength: body.length,
      },
    });

    const result: NotificationResult = {
      channel,
      subject,
      delivered: true,
      sentAt: new Date().toISOString(),
    };

    log.set({ notification: { delivered: result.delivered } });

    return result;
  }
}
