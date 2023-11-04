import { Banks, UserToProfile } from '@/user/types';
import { Transaction } from '../entities/transaction.entity';
import { User } from '@/user/entities/user.entity';

export enum PaymentMethod {
  CREDIT_CARD = 'card',
  CASH = 'cash',
}

export enum TypeOperation {
  COST = 'cost',
  INCOME = 'income',
  TRANSFER = 'transfer',
}

export enum CorrectBallanceMethod {
  CORRECT = 'correct',
  CHANGE = 'change',
}

export enum BalanceType {
  CARD = 'card',
  CASH = 'cash',
}

export type UpdateBalanceData = {
  userId: number;
  correctBalance: number;
  balanceType: BalanceType;
  cardId: number;
};

export type TransactionToProfile = Omit<Transaction, 'user' | 'updateAt'>  | {
  user: UserToProfile
}