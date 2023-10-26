import { IsString } from 'class-validator';
import { Banks } from '../types';

export class CreateCreditCardDto {
  @IsString()
  bankName: Banks;

  @IsString()
  balance: string;
}
