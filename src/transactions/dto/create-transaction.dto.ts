import { IsNumber, IsOptional, IsString } from 'class-validator';
import { PaymentMethod, TypeOperation } from '../types';

export class CreateTransactionDto {
  @IsString()
  typeOperation: TypeOperation;

  @IsString()
  amount: string;

  @IsNumber()
  @IsOptional()
  cardId: number;

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
  subcategory: string;
}
