/**
 * Conversational AI Chat endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { get, ref } from 'firebase/database';

export async function POST(request: NextRequest) {
  try {
    const { query, projectId } = await request.json();

    const transactionsRef = ref(db, 'transactions');
    const budgetsRef = ref(db, 'budgets');

    const [transactionsSnapshot, budgetsSnapshot] = await Promise.all([
      get(transactionsRef),
      get(budgetsRef),
    ]);

    const transactionsData = transactionsSnapshot.val();
    const budgetsData = budgetsSnapshot.val();
    const transactions = transactionsData ? Object.values(transactionsData) as any[] : [];
    const budgets = budgetsData ? Object.values(budgetsData) as any[] : [];

    const filteredTransactions = projectId
      ? transactions.filter((tx) => tx.projectId === projectId)
      : transactions;

    if (filteredTransactions.length === 0) {
      return NextResponse.json(
        {
          response: 'No transactions found in the database. Add transactions to enable financial insights.',
          suggestedNextQuestions: ['How do I add transactions?', 'Where can I upload receipts?'],
          missingFields: ['transactions'],
        },
        { status: 200 }
      );
    }

    const totalIncome = filteredTransactions
      .filter((tx) => tx.type === 'income')
      .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
    const totalExpense = filteredTransactions
      .filter((tx) => tx.type === 'expense')
      .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

    const expenseByCategory: Record<string, number> = {};
    filteredTransactions
      .filter((tx) => tx.type === 'expense')
      .forEach((tx) => {
        const amount = Number(tx.amount || 0);
        const category = tx.category || 'Uncategorized';
        expenseByCategory[category] = (expenseByCategory[category] || 0) + amount;
      });

    const topCategory = Object.entries(expenseByCategory).sort((a, b) => b[1] - a[1])[0];
    const queryLower = query.toLowerCase();

    let response = '';
    if (queryLower.includes('expense') || queryLower.includes('cost')) {
      response = `Your recorded expenses total ${totalExpense.toFixed(2)}. Top expense category: ${topCategory ? `${topCategory[0]} (${topCategory[1].toFixed(2)})` : 'none'}.`;
    } else if (queryLower.includes('income') || queryLower.includes('revenue')) {
      response = `Your recorded income totals ${totalIncome.toFixed(2)} across ${filteredTransactions.filter((tx) => tx.type === 'income').length} entries.`;
    } else if (queryLower.includes('budget')) {
      response = budgets.length === 0
        ? 'No budgets found in the database. Add budgets to track plan vs actual.'
        : `There are ${budgets.length} budget entries recorded. Review budget vs actual in the dashboard.`;
    } else {
      response = `You have ${filteredTransactions.length} transactions recorded. Total income: ${totalIncome.toFixed(2)}. Total expenses: ${totalExpense.toFixed(2)}.`;
    }

    const suggestedNextQuestions = [
      'Show my top expense categories',
      'Do I have budgets set up?',
      'Which project has the highest spend?',
    ];

    return NextResponse.json(
      {
        response,
        suggestedNextQuestions,
        missingFields: budgets.length === 0 ? ['budgets'] : [],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}
