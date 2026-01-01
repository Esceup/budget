export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  monthlyIncome: number;
  currency: string;
}

export interface Category {
  id: string;
  userId: string;
  name: string;
  color: string;
  icon: string;
  createdAt: Date;
}

export interface Expense {
  id: string;
  categoryId: string;
  userId: string;
  name: string;
  amount: number;
  date: string; // ISO string
  description?: string;
  createdAt: Date;
}

export interface BudgetSummary {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  byCategory: {
    categoryId: string;
    categoryName: string;
    total: number;
    expenses: Expense[];
  }[];
}

// Типы для форм
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData extends LoginFormData {
  name: string;
  monthlyIncome: number;
}

export interface CategoryFormData {
  name: string;
  color: string;
  icon: string;
}

export interface ExpenseFormData {
  name: string;
  amount: number;
  date: string;
  description?: string;
}