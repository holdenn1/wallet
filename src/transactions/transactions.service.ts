import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { CategoryType } from '@/categories/types';
import { TypeOperation } from './types';
import { UserService } from '@/user/user.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Transaction } from './entities/transaction.entity';
import { Repository } from 'typeorm';
import { CategoriesService } from '@/categories/categories.service';
import { SubcategoriesService } from '@/subcategories/subcategories.service';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    private userService: UserService,
    private categoryService: CategoriesService,
    private subcategoryService: SubcategoriesService,
  ) {}

  async createTransaction(userId: number, createTransactionDto: CreateTransactionDto) {
    const { amount, bank, paymentMethod, typeOperation } = createTransactionDto;
    const userData = await this.userService.updateUserBalance(
      userId,
      +amount,
      paymentMethod,
      bank,
      typeOperation,
    );
    if (!userData) {
      throw new BadRequestException('Something went wrong');
    }

    const user = await this.userService.findOneUserById(userId);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const category = await this.categoryService.findCategoryByName(createTransactionDto.category);

    if (!category) {
      throw new BadRequestException(`Category - ${createTransactionDto.category} not found`);
    }

    const subcategory = createTransactionDto.subcategory.length
      ? await this.subcategoryService.findSubcategoryByName(createTransactionDto.subcategory)
      : null;

    return await this.transactionRepository.save({
      type: typeOperation,
      paymentMethod,
      amount: +amount,
      recipient: createTransactionDto.recipient,
      description: createTransactionDto.description,
      category,
      subcategory,
      user,
    });
  }
}
