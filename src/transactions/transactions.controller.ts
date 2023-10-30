import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  UseGuards,
  Req,
  UsePipes,
  ValidationPipe,
  Param,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { AccessTokenGuard } from '@/auth/guards/accessToken.guard';
import { CorrectBalanceDto } from './dto/correct-balance.dto';
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

  @Get('get-transactions/:userId')
  getTransactions(@Param('userId') userId: string) {
    return this.transactionsService.getTransactions(+userId)
  }
}
