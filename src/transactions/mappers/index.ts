import { Transaction } from '@/transactions/entities/transaction.entity';
import { TransactionToProfile } from '../types';
import { Banks } from '@/user/types';

export const mapTransactionsToProfile = (transactions: Transaction[]): TransactionToProfile[] => {
  return transactions.map((transaction) => ({
    id: transaction.id,
    type: transaction.type,
    paymentMethod: transaction.paymentMethod,
    amount: transaction.amount,
    recipient: transaction.recipient,
    description: transaction.description,
    category: transaction.category,
    subcategory: transaction.subcategory,
    createAt: transaction.createAt,
    creditCard: transaction.creditCard
  }));
};

export const mapTransactionToProfile = (transaction: Transaction): TransactionToProfile => ({
  id: transaction.id,
  type: transaction.type,
  paymentMethod: transaction.paymentMethod,
  amount: transaction.amount,
  recipient: transaction.recipient,
  description: transaction.description,
  category: transaction.category,
  subcategory: transaction.subcategory,
  createAt: transaction.createAt,
  creditCard: transaction.creditCard
});
