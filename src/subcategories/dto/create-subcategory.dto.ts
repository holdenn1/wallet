import {CategoryType} from "../../categories/types";
import {IsOptional, IsString} from "class-validator";
import {Category} from "../../categories/entities/category.entity";

export class CreateSubcategoryDto {
    @IsString()
    type: CategoryType;
    @IsString()
    subcategory: string;
    @IsString()
    subcategoryIcon: string;
    @IsString()
    subcategoryIconBackground: string;
    @IsOptional()
    @IsString()
    category: string
}
