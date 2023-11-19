import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { CategoryType } from 'src/categories/types';
import { UserService } from 'src/user/user.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Transaction } from './entities/transaction.entity';
import { Between, Repository } from 'typeorm';
import { CategoriesService } from 'src/categories/categories.service';
import { SubcategoriesService } from 'src/subcategories/subcategories.service';
import { CorrectBalanceDto } from './dto/correct-balance.dto';
import {
  CorrectBallanceMethod,
  BalanceType,
  UpdateBalanceData,
  TypeOperation,
  PaymentMethod,
  Period,
} from './types';
import { Banks } from '@/user/types';
import { mapTransactionToProfile } from './mappers';
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

    if (!user) {
      throw new BadRequestException('User does not exist');
    }

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

    if (!user) {
      throw new BadRequestException('User does not exist');
    }

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

  async getTransactionByPeriod(userId: number,period: Period,page: number, pageSize: number) {
    const skip = (page - 1) * pageSize;

    const currentDate = new Date();
    const startDate = new Date();

    if (period === 'today') {
      startDate.setHours(0, 0, 0, 0); 
    } else if (period === 'week') {
      startDate.setDate(currentDate.getDate() - 7);
    } else if (period === 'month') {
      startDate.setMonth(currentDate.getMonth() - 1);
    } else if (period === 'year') {
      startDate.setFullYear(currentDate.getFullYear() - 1);
    } else {
      return [];
    }

    const records = await this.transactionRepository.find({
      relations: { user: true, category: true, subcategory: true, creditCard: true },
      where: {
        user: {id: userId},
        createAt: Between(startDate, currentDate),
      },
      order: { createAt: 'DESC' },
      skip,
      take: pageSize,
    });

    return records;
  }

  async getMonthlySummary(userId: number) {
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    const userTransactions = await this.transactionRepository.find({
      relations: { user: true },
      where: {
        user: { id: userId },
        createAt: Between(startOfMonth, endOfMonth),
      },
    });

    const costs = [];
    const incomes = [];

    userTransactions.forEach((transaction) => {
      if (transaction.type === 'cost' || transaction.type === 'transfer') {
        costs.push(transaction.amount);
      } else if (transaction.type === 'income') {
        incomes.push(transaction.amount);
      }
    });

    const totalCosts = costs.reduce((sum, cost) => sum + cost, 0);
    const totalIncome = incomes.reduce((sum, income) => sum + income, 0);

    return {
      totalCosts,
      totalIncome,
    };
  }

  async getMonthlyCosts(userId: number) {
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    const costs = await this.transactionRepository.find({
      relations: { user: true, category: true },
      where: {
        user: { id: userId },
        type: TypeOperation.COST,
        createAt: Between(startOfMonth, endOfMonth),
      },
    });

    const groupedCosts = costs.reduce((acc, cost) => {
      if (!acc[cost.category?.category]) {
        acc[cost.category?.category] = 0;
      }
      acc[cost.category?.category] += cost.amount;
      return acc;
    }, {});



    const totalAmount = Object.values(groupedCosts).reduce(
      (acc: number, amount: number) => acc + amount,
      0,
    ) as number;

    const result = Object.keys(groupedCosts).map((category) => {
      return {
        category,
        amount: groupedCosts[category],
        percentage: (groupedCosts[category] / totalAmount) * 100,
      };
    });

    
    return result;
  }
}
