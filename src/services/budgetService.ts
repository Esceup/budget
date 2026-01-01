import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { type User } from '../types';
import { ExpenseService } from './expenseService';
import { CategoryService } from './categoryService';

export class BudgetService {
  static async getBudgetSummary(userId: string) {
    try {
      // Получаем доход пользователя
      const userDoc = await getDoc(doc(db, 'users', userId));
      const userData = userDoc.data() as User;
      const monthlyIncome = userData?.monthlyIncome || 0;

      // Получаем все категории пользователя
      const categories = await CategoryService.getUserCategories(userId);
      
      // Получаем все расходы пользователя
      const allExpenses = await ExpenseService.getUserExpenses(userId);
      
      // Группируем расходы по категориям
      const byCategory = await Promise.all(
        categories.map(async (category) => {
          const categoryExpenses = allExpenses.filter(
            expense => expense.categoryId === category.id
          );
          
          const categoryTotal = categoryExpenses.reduce(
            (sum, expense) => sum + expense.amount,
            0
          );

          return {
            categoryId: category.id,
            categoryName: category.name,
            categoryColor: category.color,
            categoryIcon: category.icon,
            total: categoryTotal,
            expenses: categoryExpenses,
          };
        })
      );

      // Считаем общие суммы
      const totalExpenses = byCategory.reduce(
        (sum, category) => sum + category.total,
        0
      );

      const balance = monthlyIncome - totalExpenses;

      return {
        monthlyIncome,
        totalExpenses,
        balance,
        byCategory,
        currency: userData?.currency || '₽',
      };
    } catch (error) {
      console.error('Error getting budget summary:', error);
      throw error;
    }
  }
}