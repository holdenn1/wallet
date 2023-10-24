import { Module } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from './entities/transaction.entity';
import { UserModule } from '@/user/user.module';
import { CategoriesModule } from '@/categories/categories.module';
import { SubcategoriesModule } from '@/subcategories/subcategories.module';

@Module({
  imports: [TypeOrmModule.forFeature([Transaction]), UserModule, CategoriesModule, SubcategoriesModule],
  controllers: [TransactionsController],
  providers: [TransactionsService],
})
export class TransactionsModule {}
