import { CategoryType } from '../types';
import { IsString } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  type: CategoryType;
  @IsString()
  category: string;
  @IsString()
  categoryIcon: string;
  @IsString()
  categoryIconBackground: string;
}
