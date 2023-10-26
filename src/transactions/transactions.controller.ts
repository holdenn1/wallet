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
@UseGuards(AccessTokenGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post('create')
  @UsePipes(new ValidationPipe())
  async create(@Req() res, @Body() createTransactionDto: CreateTransactionDto) {
    return await this.transactionsService.createTransaction(+res.user.sub, createTransactionDto);
  }
}
