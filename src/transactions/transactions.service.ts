import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { CategoryType } from '@/categories/types';
import { UserService } from '@/user/user.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Transaction } from './entities/transaction.entity';
import { Repository } from 'typeorm';
import { CategoriesService } from '@/categories/categories.service';
import { SubcategoriesService } from '@/subcategories/subcategories.service';
import { CorrectBalanceDto } from './dto/correct-balance.dto';
import { CorrectBallanceMethod, BalanceType, UpdateBalanceData, TypeOperation, PaymentMethod } from './types';
import { Banks } from '@/user/types';
import { mapTransactionToProfile, mapTransactionsToProfile } from './mappers';
import { User } from '@/user/entities/user.entity';
import { CreditCard } from '@/user/entities/creditCard.entity';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

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
    const { amount, cardId, paymentMethod, typeOperation, category, subcategory } = dto;

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

    const foundSubcategory = subcategory?.length
      ? await this.subcategoryService.findSubcategoryByName(subcategory, category)
      : null;

    const updateUserData = await this.userService.updateUserBalance({
      amount: +amount,
      paymentMethod,
      typeOperation,
      cardId,
      userId,
    });

    if (!updateUserData) {
      throw new BadRequestException('Something went wrong');
    }

    const user = await this.userService.findOneUserById(userId);

    const transaction = await this.transactionRepository.save({
      type: typeOperation,
      paymentMethod,
      amount: +amount,
      recipient: dto.recipient,
      description: dto.description,
      category: foundCategory,
      subcategory: foundSubcategory,
      user,
      creditCard: (updateUserData as CreditCard).bankName && updateUserData,
    });

    return mapTransactionToProfile(transaction);
  }

  async updateBalance(userId: number, dto: CorrectBalanceDto) {
    const { correctBalance, balanceType, method, cardId } = dto;

    switch (method) {
      case CorrectBallanceMethod.CORRECT: {
        return await this.correctBalance({
          correctBalance: +correctBalance,
          balanceType,
          cardId,
          userId,
        });
      }
      case CorrectBallanceMethod.CHANGE: {
        return await this.changeBalance({
          correctBalance: +correctBalance,
          balanceType,
          cardId,
          userId,
        });
      }
      default: {
        throw new BadRequestException(`Method ${method} does not exist`);
      }
    }
  }

  async correctBalance(data: UpdateBalanceData) {
    const { correctBalance, balanceType, cardId, userId } = data;
    switch (balanceType) {
      case BalanceType.CASH: {
        return await this.correctCashBalance(userId, correctBalance);
      }
      case BalanceType.CARD: {
        return await this.correctCardBalance(userId, correctBalance, cardId);
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
        description: '',
        recipient: '',
      } as CreateTransactionDto);
    }
    if (correctBalance < user.cash) {
      const amountOperation = user.cash - correctBalance;

      return await this.createTransaction(userId, {
        amount: String(amountOperation),
        category: 'Other',
        typeOperation: TypeOperation.COST,
        paymentMethod: PaymentMethod.CASH,
        description: '',
        recipient: '',
      } as CreateTransactionDto);
    }
    return user;
  }

  async correctCardBalance(userId: number, correctBalance: number, cardId: number) {
    const userCard = await this.userService.getUserCreditCard(cardId);

    if (correctBalance > userCard.balance) {
      const amountOperation = correctBalance - userCard.balance;

      return await this.createTransaction(userId, {
        amount: String(amountOperation),
        category: 'Other',
        typeOperation: TypeOperation.INCOME,
        paymentMethod: PaymentMethod.CREDIT_CARD,
        cardId,
        description: '',
        recipient: '',
      } as CreateTransactionDto);
    }

    if (correctBalance < userCard.balance) {
      const amountOperation = userCard.balance - correctBalance;

      return await this.createTransaction(userId, {
        amount: String(amountOperation),
        category: 'Other',
        typeOperation: TypeOperation.COST,
        paymentMethod: PaymentMethod.CREDIT_CARD,
        cardId,
        description: '',
        recipient: '',
      } as CreateTransactionDto);
    }

    return userCard;
  }

  async changeBalance(data: UpdateBalanceData) {
    const { correctBalance, balanceType, cardId, userId } = data;
    switch (balanceType) {
      case BalanceType.CASH: {
        return await this.changeCashBalance(userId, correctBalance);
      }
      case BalanceType.CARD: {
        return await this.changeCardBalance(correctBalance, cardId);
      }
      default: {
        throw new BadRequestException(`Type ${balanceType} does not exist`);
      }
    }
  }

  async changeCashBalance(userId: number, correctBalance: number) {
    return await this.userService.updateUser(userId, { cash: correctBalance });
  }

  async changeCardBalance(correctBalance: number, cardId: number) {
    return await this.userService.updateCreditCardBalance(cardId, correctBalance);
  }

  async getTransactions(userId: number) {
    try {
      const transactions = await this.transactionRepository.find({
        relations: { user: true, category: true, subcategory: true, creditCard: true },
        where: { user: { id: userId } },
        order: {createAt: 'ASC'}
      });

      return mapTransactionsToProfile(transactions);
    } catch (e) {
      throw new BadRequestException(e);
    }
  }

  async updateTransaction(transactionId: number, dto: UpdateTransactionDto) {

    const transaction = await this.transactionRepository.findOne({
      relations: { user: true, creditCard: true },
      where: { id: transactionId },
    });

    if (!transaction) {
      throw new BadRequestException('Transaction not found');
    }

    if (transaction.paymentMethod === 'cash') {
      const cashBalance =
        transaction.type !== 'income'
          ? transaction.user.cash + transaction.amount - +dto.amount
          : transaction.user.cash + +dto.amount - transaction.amount;

      await this.userService.updateUser(transaction.user.id, { cash: cashBalance });
    } else {
      const card = await this.userService.getUserCreditCard(transaction.creditCard.id);

      const cardBalance =
        transaction.type !== 'income'
          ? card.balance + transaction.amount - +dto.amount
          : card.balance + +dto.amount - transaction.amount;

      await this.userService.updateCreditCardBalance(transaction.creditCard.id, cardBalance);
    }

    transaction.amount = +dto.amount ?? transaction.amount;
    transaction.createAt = dto.createAt ?? transaction.createAt;
    transaction.description = dto.description ?? transaction.description;
    transaction.recipient = dto.recipient ?? transaction.recipient;

    return this.transactionRepository.save(transaction);
  }

  async deleteTransaction(transactionId: number) {
    const transaction = await this.transactionRepository.findOne({
      relations: { user: true, creditCard: true },
      where: { id: transactionId },
    });

    if (transaction.type === 'income') {
      if (transaction.paymentMethod === 'cash') {
        const userIncomeCashBalance = transaction.user.cash - transaction.amount;
        await this.userService.updateUser(transaction.user.id, { cash: userIncomeCashBalance });
        return await this.transactionRepository.remove(transaction);
      }
      const userIncomeCardBalance = transaction.creditCard.balance - transaction.amount;
      await this.userService.updateCreditCardBalance(transaction.creditCard.id, userIncomeCardBalance);
      return await this.transactionRepository.remove(transaction);
    }
    if (transaction.paymentMethod === 'cash') {
      const userCostCardBalance = transaction.user.cash + transaction.amount;
      await this.userService.updateUser(transaction.user.id, { cash: userCostCardBalance });
      return await this.transactionRepository.remove(transaction);
    }
    const userCostCardBalance = transaction.creditCard.balance + transaction.amount;
    await this.userService.updateCreditCardBalance(transaction.creditCard.id, userCostCardBalance);
    return await this.transactionRepository.remove(transaction);
  }
}
