import { Banks } from '@/user/types';
import { Transaction } from '../entities/transaction.entity';

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
  bankName: Banks;
};

export type TransactionToProfile = Omit<Transaction, 'user' | 'updateAt'> 