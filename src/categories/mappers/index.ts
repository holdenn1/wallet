import { CategoriesSortedByType, MappedCategoriesByType } from '../types';

export const mapCategoriesBeforeSendClient = (categories: CategoriesSortedByType): MappedCategoriesByType => {
  const income = categories.income.map((category) => ({
    type: category.type,
    category: category.category,
    categoryIcon: category.categoryIcon,
    categoryIconBackground: category.categoryIconBackground,
  }));

  return { cost: categories.cost, income };
};
