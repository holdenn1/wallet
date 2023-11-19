import { CategoryType } from '../types';
import { Column, Entity, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Subcategory } from 'src/subcategories/entities/subcategory.entity';
import { Transaction } from 'src/transactions/entities/transaction.entity';

@Entity()
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: CategoryType })
  type: CategoryType;

  @Column()
  category: string;

  @Column()
  categoryIcon: string;

  @Column()
  categoryIconBackground: string;

  @OneToMany(() => Subcategory, (subcategory) => subcategory.category)
  subcategories: Subcategory[];

  @OneToMany(() => Transaction, (transaction) => transaction.category)
  transaction: Transaction[];
}
