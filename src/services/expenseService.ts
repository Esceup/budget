import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { type Expense, type ExpenseFormData } from '../types';

export class ExpenseService {
  static async getCategoryExpenses(categoryId: string): Promise<Expense[]> {
    try {
      const expensesRef = collection(db, 'expenses');
      const q = query(
        expensesRef,
        where('categoryId', '==', categoryId),
        orderBy('date', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date,
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as Expense[];
    } catch (error) {
      console.error('Error fetching expenses:', error);
      throw error;
    }
  }

  static async getUserExpenses(userId: string): Promise<Expense[]> {
    try {
      const expensesRef = collection(db, 'expenses');
      const q = query(
        expensesRef,
        where('userId', '==', userId),
        orderBy('date', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date,
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as Expense[];
    } catch (error) {
      console.error('Error fetching user expenses:', error);
      throw error;
    }
  }

  static async addExpense(
    userId: string,
    categoryId: string,
    data: ExpenseFormData
  ): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'expenses'), {
        userId,
        categoryId,
        ...data,
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding expense:', error);
      throw error;
    }
  }

  static async updateExpense(expenseId: string, data: Partial<ExpenseFormData>) {
    try {
      const expenseRef = doc(db, 'expenses', expenseId);
      await updateDoc(expenseRef, data);
    } catch (error) {
      console.error('Error updating expense:', error);
      throw error;
    }
  }

  static async deleteExpense(expenseId: string) {
    try {
      await deleteDoc(doc(db, 'expenses', expenseId));
    } catch (error) {
      console.error('Error deleting expense:', error);
      throw error;
    }
  }
}