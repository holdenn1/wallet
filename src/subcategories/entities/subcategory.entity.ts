import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Subcategory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  subcategory: string;
}
