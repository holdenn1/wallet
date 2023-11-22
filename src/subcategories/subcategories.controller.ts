import { Controller, Post, Body } from '@nestjs/common';
import { SubcategoriesService } from './subcategories.service';
import { CreateSubcategoryDto } from './dto/create-subcategory.dto';
import { UpdateSubcategoryDto } from './dto/update-subcategory.dto';

@Controller('subcategories')
export class SubcategoriesController {
  constructor(private readonly subcategoriesService: SubcategoriesService) {}

  // @Post('create')
  // create(@Body() createSubcategoryDto: CreateSubcategoryDto) {
  //   return this.subcategoriesService.create(createSubcategoryDto);
  // }
}
