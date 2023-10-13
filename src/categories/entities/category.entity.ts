import { Column, Entity, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { CategoryType } from '../types';
import { Subcategory } from '@/subcategories/entities/subcategory.entity';

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
}
