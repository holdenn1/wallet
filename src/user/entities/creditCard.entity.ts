import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';
import { Banks } from '../types';
import { Transaction } from '@/transactions/entities/transaction.entity';

@Entity()
export class CreditCard {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: Banks })
  bankName: string;

  @Column({ default: 0 })
  balance: number;

  @Column()
  bankIcon:string

  @Column()
  bankBackgroundColor: string

  @ManyToOne(() => User, (user) => user.creditCard, {onDelete: 'CASCADE'})
  user: User;

  @OneToMany(() => Transaction, transaction => transaction.creditCard)
  transactions: Transaction[]
}
