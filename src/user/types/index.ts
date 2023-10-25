import { PaymentMethod, TypeOperation } from '@/transactions/types';
import { User } from '../entities/user.entity';
import { CategoryType } from '@/categories/types';

export enum Banks {
  MONOBANK = 'monobank',
  PRIVAT_BANK = 'privat-bank',
  OSCHADBANK = 'oschadbank',
}

export type UserToProfile = Omit<
  User,
  'refreshTokens' | 'transactions' | 'createAt' | 'updateAt' | 'password'
>;

export type UpdateUserBalanceDataType = {
  userId: number;
  amount: number;
  paymentMethod: PaymentMethod;
  bank: string;
  typeOperation: TypeOperation;
 
};

export type UpdateUserCashBalanceData = Omit<UpdateUserBalanceDataType, 'bank' | 'paymentMethod'>

export type UpdateUserCreditCardBalanceData = Omit<UpdateUserBalanceDataType, 'paymentMethod'>

