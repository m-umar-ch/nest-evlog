import type { User } from './users.types';

export const USERS: User[] = [
  {
    id: 'usr_alice',
    name: 'Alice Chen',
    email: 'alice@example.com',
    plan: 'pro',
    loyaltyPoints: 1250,
  },
  {
    id: 'usr_bob',
    name: 'Bob Martinez',
    email: 'bob@example.com',
    plan: 'free',
    loyaltyPoints: 80,
  },
  {
    id: 'usr_carol',
    name: 'Carol Nguyen',
    email: 'carol@example.com',
    plan: 'enterprise',
    loyaltyPoints: 9800,
  },
];
