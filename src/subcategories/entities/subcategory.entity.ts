import {
  Column,
  Entity,

  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CategoryType } from '../../categories/types';
import { Category } from '../../categories/entities/category.entity';

@Entity()
export class Subcategory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: CategoryType })
  type: CategoryType;

  @Column()
  subcategory: string;

  @Column()
  subcategoryIcon: string;

  @Column()
  subcategoryIconBackground: string;

  @ManyToOne(() => Category, (category) => category.subcategories)
  category: Category;
}
