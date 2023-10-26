import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { CategoryType } from '@/categories/types';
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

  async createTransaction(userId: number, dto: CreateTransactionDto) {
    const { amount, bank, paymentMethod, typeOperation, category, subcategory } = dto;

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
      bank,
      userId,
    });

    if (!userData) {
      throw new BadRequestException('Something went wrong');
    }

    const user = await this.userService.findOneUserById(userId);

    if (!user) {
      throw new BadRequestException('User not found');
    }

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
}
