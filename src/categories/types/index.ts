export enum CategoryType {
  COST = 'cost',
  INCOME = 'income',
  TRANSFER = 'transfer',
  OTHER = 'other'
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


export type CategoriesSortedByType = {
  cost: Category[];
  income: Category[];
};

