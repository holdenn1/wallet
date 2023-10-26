import { IsString } from 'class-validator';
import { Banks } from '../types';

export class CreateCreditCardDto {
  @IsString()
  bankName: string;

  @IsString()
  balance: string;
}
