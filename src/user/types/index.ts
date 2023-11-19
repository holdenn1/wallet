import { PaymentMethod, TypeOperation } from 'src/transactions/types';
import { User } from '../entities/user.entity';

export enum Banks {
  MONOBANK = 'MonoBank',
  PRIVAT_BANK = 'PrivatBank',
  OSCHADBANK = 'OschadBank',
}

export type UserToProfile = Omit<
  User,
  'refreshTokens' | 'transactions' | 'createAt' | 'updateAt' | 'password'
> ;

export type UpdateUserBalanceDataType = {
  userId: number;
  amount: number;
  paymentMethod: PaymentMethod;
  cardId: number;
  typeOperation: TypeOperation;
 
};

export type UpdateUserCashBalanceData = Omit<UpdateUserBalanceDataType, 'cardId' | 'paymentMethod'>

export type UpdateUserCreditCardBalanceData = Omit<UpdateUserBalanceDataType, 'paymentMethod'>

