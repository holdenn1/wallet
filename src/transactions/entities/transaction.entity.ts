import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PaymentMethod } from '../types';
import { CategoryType } from '@/categories/types';
import { Subcategory } from '@/subcategories/entities/subcategory.entity';

@Entity()
export class Transaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: CategoryType })
  type: CategoryType;

  @Column({ type: 'enum', enum: PaymentMethod })
  paymentMethod: PaymentMethod;

  @Column()
  amount: number;

  @Column({ nullable: true })
  recipient: string;

  @Column({ nullable: true })
  description: string;

  @ManyToOne(() => Subcategory, (subcategory) => subcategory.transaction)
  subcategory: Subcategory;

  @CreateDateColumn()
  createAt: Date;

  @UpdateDateColumn()
  updateAt: Date;
}
