import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateSubcategoryDto } from './dto/create-subcategory.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Subcategory } from './entities/subcategory.entity';
import { Repository } from 'typeorm';
import { CategoriesService } from '@/categories/categories.service';

@Injectable()
export class SubcategoriesService {
  constructor(
    @InjectRepository(Subcategory)
    private subcategoryRepository: Repository<Subcategory>,

    private categoryService: CategoriesService,
  ) {}
  async create(dto: CreateSubcategoryDto) {
    const subcategory = new Subcategory();
    subcategory.type = dto.type;
    subcategory.subcategory = dto.subcategory;
    subcategory.subcategoryIcon = dto.subcategoryIcon;
    subcategory.subcategoryIconBackground = dto.subcategoryIconBackground;

    const category = await this.categoryService.findCategoryByName(dto.category);

    if (!category) {
      throw new NotFoundException(`Category "${dto.category}" not found.`);
    }

    subcategory.category = category;

    return this.subcategoryRepository.save(subcategory);
  }

  async findSubcategoryByName(subcategory: string, category: string) {
    return await this.subcategoryRepository.findOne({
      relations: { category: true },
      where: { subcategory, category: { category } },
    });
  }
}
