import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  BadRequestException,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { AccessTokenGuard } from '@/auth/guards/accessToken.guard';
import { CorrectBalanceDto } from './dto/update-balance.dto';
@UseGuards(AccessTokenGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post('create')
  @UsePipes(new ValidationPipe())
  create(@Req() req, @Body() createTransactionDto: CreateTransactionDto) {
    return this.transactionsService.createTransaction(+req.user.sub, createTransactionDto);
  }

  @Patch('correct/balance')
  @UsePipes(new ValidationPipe())
  updateBalance(@Req() req, @Body() correctBalanceDto: CorrectBalanceDto) {
    return this.transactionsService.updateBalance(+req.user.sub, correctBalanceDto);
  }
}
