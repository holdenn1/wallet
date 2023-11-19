import { IsNumber, IsOptional, IsString } from 'class-validator';
import { BalanceType, CorrectBallanceMethod } from '../types';

export class CorrectBalanceDto {
  @IsString()
  method: CorrectBallanceMethod;

  @IsString()
  balanceType: BalanceType;

  @IsNumber()
  @IsOptional()
  cardId: number

  @IsString()
  correctBalance: string;
}
