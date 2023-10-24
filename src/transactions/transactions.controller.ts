import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { AccessTokenGuard } from '@/auth/guards/accessToken.guard';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post('create')
  @UseGuards(AccessTokenGuard)
  async create(@Req() res, @Body() createTransactionDto: CreateTransactionDto) {
    return await this.transactionsService.createTransaction(+res.user.sub, createTransactionDto);
  }
}
