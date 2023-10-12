import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateSubcategoryDto } from './dto/create-subcategory.dto';
import { UpdateSubcategoryDto } from './dto/update-subcategory.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Subcategory } from './entities/subcategory.entity';
import { Repository } from 'typeorm';
import { CategoriesService } from '../categories/categories.service';

@Injectable()
export class SubcategoriesService {
  constructor(
    @InjectRepository(Subcategory)
    private subcategoryRepository: Repository<Subcategory>,

    private categoryService: CategoriesService,
  ) {}
  async create(createSubcategoryDto: CreateSubcategoryDto) {
    const subcategory = new Subcategory();
    subcategory.type = createSubcategoryDto.type;
    subcategory.subcategory = createSubcategoryDto.subcategory;
    subcategory.subcategoryIcon = createSubcategoryDto.subcategoryIcon;
    subcategory.subcategoryIconBackground = createSubcategoryDto.subcategoryIconBackground;

    const category = await this.categoryService.findCategoryByName(createSubcategoryDto.category);

    if (!category) {
      throw new NotFoundException(`Category "${createSubcategoryDto.category}" not found.`);
    }

    subcategory.category = category;

    return this.subcategoryRepository.save(subcategory);
  }
}
