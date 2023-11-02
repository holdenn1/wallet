import { IsOptional, IsString } from 'class-validator';
import { BalanceType, CorrectBallanceMethod } from '../types';
import { Banks } from '@/user/types';

export class CorrectBalanceDto {
  @IsString()
  method: CorrectBallanceMethod;

  @IsString()
  balanceType: BalanceType;

  
  @IsOptional()
  bankId: number

  @IsString()
  correctBalance: string;
}
