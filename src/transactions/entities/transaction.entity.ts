import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PaymentMethod, TypeOperation } from '../types';
import { Category } from '@/categories/entities/category.entity';
import { User } from '@/user/entities/user.entity';
import { Subcategory } from '@/subcategories/entities/subcategory.entity';

@Entity()
export class Transaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: TypeOperation })
  type: TypeOperation;

  @Column({ type: 'enum', enum: PaymentMethod })
  paymentMethod: PaymentMethod;

  @Column()
  amount: number;

  @Column({ nullable: true })
  recipient: string;

  @Column({ nullable: true })
  description: string;

  @ManyToOne(() => Category, (category) => category.transaction)
  category: Category;

  @ManyToOne(() => Subcategory, (subcategory) => subcategory.transaction, { nullable: true })
  subcategory: Subcategory;

  @ManyToOne(() => User, (user) => user.transactions)
  user: User;

  @CreateDateColumn()
  createAt: Date;

  @UpdateDateColumn()
  updateAt: Date;
}
