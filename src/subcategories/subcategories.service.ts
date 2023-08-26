import { Injectable } from '@nestjs/common';
import { CreateSubcategoryDto } from './dto/create-subcategory.dto';
import { UpdateSubcategoryDto } from './dto/update-subcategory.dto';

@Injectable()
export class SubcategoriesService {
  create(createSubcategoryDto: CreateSubcategoryDto) {
    return 'This action adds a new subcategory';
  }


}
