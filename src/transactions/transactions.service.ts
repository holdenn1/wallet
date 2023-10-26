import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { CategoryType } from '@/categories/types';
import { UserService } from '@/user/user.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Transaction } from './entities/transaction.entity';
import { Repository } from 'typeorm';
import { CategoriesService } from '@/categories/categories.service';
import { SubcategoriesService } from '@/subcategories/subcategories.service';
import { CorrectBalanceDto } from './dto/update-balance.dto';
import { CorrectBallanceMethod, BalanceType, UpdateBalanceData, TypeOperation, PaymentMethod } from './types';
import { Banks } from '@/user/types';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    private userService: UserService,
    private categoryService: CategoriesService,
    private subcategoryService: SubcategoriesService,
  ) {}

  async createTransaction(userId: number, dto: CreateTransactionDto) {
    const { amount, bankName, paymentMethod, typeOperation, category, subcategory } = dto;

    const foundCategory = await this.categoryService.findCategoryByName(category);

    if (!foundCategory) {
      throw new BadRequestException(`Category - ${dto.category} not found`);
    }

    if (foundCategory.type !== (typeOperation as unknown as CategoryType) && foundCategory.type !== 'other') {
      throw new BadRequestException('This category does not exist in the category list');
    }

    if (foundCategory.type === 'other' && typeOperation === 'transfer') {
      throw new BadRequestException('Category other does not exist in the transfer list');
    }

    const foundSubcategory = subcategory.length
      ? await this.subcategoryService.findSubcategoryByName(subcategory, category)
      : null;

    const userData = await this.userService.updateUserBalance({
      amount: +amount,
      paymentMethod,
      typeOperation,
      bankName,
      userId,
    });

    if (!userData) {
      throw new BadRequestException('Something went wrong');
    }

    const user = await this.userService.findOneUserById(userId);

    return await this.transactionRepository.save({
      type: typeOperation,
      paymentMethod,
      amount: +amount,
      recipient: dto.recipient,
      description: dto.description,
      category: foundCategory,
      subcategory: foundSubcategory,
      user,
    });
  }

  async updateBalance(userId: number, dto: CorrectBalanceDto) {
    const { correctBalance, balanceType, method, bankName } = dto;

    switch (method) {
      case CorrectBallanceMethod.CORRECT: {
        return await this.correctBalance({ correctBalance: +correctBalance, balanceType, bankName, userId });
      }
      case CorrectBallanceMethod.CHANGE: {
        return await this.changeBalance({ correctBalance: +correctBalance, balanceType, bankName, userId });
      }
      default: {
        throw new BadRequestException(`Method ${method} does not exist`);
      }
    }
  }

  async correctBalance(data: UpdateBalanceData) {
    const { correctBalance, balanceType, bankName, userId } = data;
    switch (balanceType) {
      case BalanceType.CASH: {
        return await this.correctCashBalance(userId, correctBalance);
      }
      case BalanceType.CARD: {
        return await this.correctCardBalance(userId, correctBalance, bankName);
      }
      default: {
        throw new BadRequestException(`Type ${balanceType} does not exist`);
      }
    }
  }

  async correctCashBalance(userId: number, correctBalance: number) {
    const user = await this.userService.findOneUserById(userId);

    if (correctBalance > user.cash) {
      const amountOperation = correctBalance - user.cash;

      return await this.createTransaction(userId, {
        amount: String(amountOperation),
        category: 'Other',
        typeOperation: TypeOperation.INCOME,
        paymentMethod: PaymentMethod.CASH,
      } as CreateTransactionDto);
    }
    const amountOperation = user.cash - correctBalance;

    return await this.createTransaction(userId, {
      amount: String(amountOperation),
      category: 'Other',
      typeOperation: TypeOperation.COST,
      paymentMethod: PaymentMethod.CASH,
    } as CreateTransactionDto);
  }

  async correctCardBalance(userId: number, correctBalance: number, bankName: Banks) {
    const userCard = await this.userService.getUserCreditCard(userId, bankName);

    if (correctBalance > userCard.balance) {
      const amountOperation = correctBalance - userCard.balance;

      return await this.createTransaction(userId, {
        amount: String(amountOperation),
        category: 'Other',
        typeOperation: TypeOperation.INCOME,
        paymentMethod: PaymentMethod.CREDIT_CARD,
        bankName,
      } as CreateTransactionDto);
    }
    const amountOperation = userCard.balance - correctBalance;

    return await this.createTransaction(userId, {
      amount: String(amountOperation),
      category: 'Other',
      typeOperation: TypeOperation.COST,
      paymentMethod: PaymentMethod.CREDIT_CARD,
      bankName,
    } as CreateTransactionDto);
  }

  async changeBalance(data: UpdateBalanceData) {
    const { correctBalance, balanceType, bankName, userId } = data;
    switch (balanceType) {
      case BalanceType.CASH: {
        return await this.changeCashBalance(userId, correctBalance);
      }
      case BalanceType.CARD: {
        return await this.changeCardBalance(userId, correctBalance, bankName);
      }
      default: {
        throw new BadRequestException(`Type ${balanceType} does not exist`);
      }
    }
  }

  async changeCashBalance(userId: number, correctBalance: number) {
    return await this.userService.updateUser(userId, { cash: correctBalance });
  }

  async changeCardBalance(userId: number, correctBalance: number, bankName: Banks) {
    return await this.userService.updateCreditCardBalance(userId, bankName, correctBalance);
  }
}
