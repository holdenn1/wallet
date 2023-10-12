export enum CategoryType {
  COST = 'cost',
  INCOME = 'income',
}

type Category = {
  type: CategoryType;
  category: string;
  categoryIcon: string;
  categoryIconBackground: string;
  subcategories: Subcategory[];
};

type Subcategory = {
  type: CategoryType.COST;
  subcategory: string;
  subcategoryIcon: string;
  subcategoryIconBackground: string;
};

type CostCategory = Category;
type IncomeCategory = Omit<Category, 'subcategories'>;

export type CategoriesSortedByType = {
  cost: Category[];
  income: Category[];
};

export type MappedCategoriesByType = {
  cost: CostCategory[];
  income: IncomeCategory[];
}