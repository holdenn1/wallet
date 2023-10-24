import { IsOptional, IsString } from 'class-validator';
import { PaymentMethod, TypeOperation } from '../types';
import { Banks } from '@/user/types';

export class CreateTransactionDto {
  
  @IsString()
  typeOperation: TypeOperation;

  @IsString()
  amount: string;

  @IsString()
  @IsOptional()
  bank: string

  @IsString()
  paymentMethod: PaymentMethod;

  @IsString()
  description: string;

  @IsString()
  recipient: string;

  @IsString()
  category: string;

  @IsString()
  @IsOptional()
  subcategory: string ;
}
