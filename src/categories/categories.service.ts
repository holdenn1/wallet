import { Injectable } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { Repository } from 'typeorm';
import { CategoriesSortedByType } from './types';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}
  
  async create(createCategoryDto: CreateCategoryDto) {
    return await this.categoryRepository.save(createCategoryDto);
  }

  async findCategoryByName(name: string) {
    return await this.categoryRepository.findOne({ where: { category: name } });
  }

  async findAllCategoriesWithThemSubcategories() {
    const categories = await this.categoryRepository.find({
      relations: { subcategories: true },
    });

    const sortedCategoriesByType = categories.reduce((acum, category) => {
      const categoryType = category.type;

      if (!acum[categoryType]) {
        acum[categoryType] = [];
      }

      acum[categoryType].push(category);
      return acum;
    }, {}) as CategoriesSortedByType;

    return sortedCategoriesByType;
  }
}
