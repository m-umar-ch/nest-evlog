import { Injectable } from '@nestjs/common';
import { createError } from 'evlog';
import { useLogger } from 'evlog/nestjs';
import { isValidUserId } from '../common/helpers/id.helper';
import { USERS } from './users.data';
import type { User } from './users.types';

@Injectable()
export class UsersService {
  findById(id: string): User {
    const log = useLogger();
    log.set({ user: { id } });

    if (!isValidUserId(id)) {
      throw createError({
        message: 'Invalid user ID format',
        status: 400,
        why: `Expected usr_* format, got "${id}"`,
        fix: 'Use a valid user ID like usr_alice',
      });
    }

    const user = USERS.find((entry) => entry.id === id);
    if (!user) {
      throw createError({
        message: 'User not found',
        status: 404,
        why: `No user exists with id "${id}"`,
        fix: 'Check the user ID and try again',
      });
    }

    log.set({
      user: {
        name: user.name,
        plan: user.plan,
        loyaltyPoints: user.loyaltyPoints,
      },
    });

    return user;
  }

  validateForCheckout(userId: string): User {
    const user = this.findById(userId);

    const log = useLogger();
    log.set({
      checkout: {
        userValidated: true,
        eligiblePlan: user.plan !== 'free',
      },
    });

    return user;
  }

  deductLoyaltyPoints(userId: string, points: number): number {
    const user = this.findById(userId);
    const remaining = Math.max(0, user.loyaltyPoints - points);

    useLogger().set({
      loyalty: {
        pointsUsed: points,
        pointsRemaining: remaining,
      },
    });

    return remaining;
  }
}
