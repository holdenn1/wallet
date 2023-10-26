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
  bankName: Banks

  @IsString()
  paymentMethod: PaymentMethod;

  @IsString()
  @IsOptional()
  description: string;

  @IsString()
  @IsOptional()
  recipient: string;

  @IsString()
  category: string;

  @IsString()
  @IsOptional()
  subcategory: string ;
}
