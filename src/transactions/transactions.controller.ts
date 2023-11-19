import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  UseGuards,
  Req,
  UsePipes,
  ValidationPipe,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { AccessTokenGuard } from 'src/auth/guards/accessToken.guard';
import { CorrectBalanceDto } from './dto/correct-balance.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { Period } from './types';
@UseGuards(AccessTokenGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post('create')
  @UsePipes(new ValidationPipe())
  create(@Req() req, @Body() createTransactionDto: CreateTransactionDto) {
    return this.transactionsService.createTransaction(+req.user.sub, createTransactionDto);
  }

  @Put('correct/balance')
  @UsePipes(new ValidationPipe())
  updateBalance(@Req() req, @Body() correctBalanceDto: CorrectBalanceDto) {
    return this.transactionsService.updateBalance(+req.user.sub, correctBalanceDto);
  }

  @Put('update/transaction/:transactionId')
  updateTransaction(
    @Param('transactionId') transactionId: string,
    @Body() updateTransactionDto: UpdateTransactionDto,
  ) {
    return this.transactionsService.updateTransaction(+transactionId, updateTransactionDto);
  }

  @Delete('delete-transaction/:transactionId')
  deleteTransaction(@Param('transactionId') transactionId: string) {
    return this.transactionsService.deleteTransaction(+transactionId);
  }

  @Get('get-transaction/by-period')
  getTransactionByPeriod(
    @Req() req,
    @Query('period') period: Period,
    @Query('page') page: string,
    @Query('pageSize') pageSize: string,
  ) {
    return this.transactionsService.getTransactionByPeriod(+req.user.sub, period, +page, +pageSize);
  }

  @Get('monthly-summary')
  getMonthlySummary(@Req() req) {
    return this.transactionsService.getMonthlySummary(+req.user.sub);
  }

  @Get('monthly/costs')
  getMonthlyCosts(@Req() req) {
    return this.transactionsService.getMonthlyCosts(+req.user.sub);
  }
}
