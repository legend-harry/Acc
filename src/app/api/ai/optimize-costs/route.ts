import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { get, ref } from 'firebase/database';

// This endpoint generates cost optimization recommendations
export async function POST(req: NextRequest) {
  try {
    const { pondId, profile, projectId } = await req.json();

    if (!profile) {
      return NextResponse.json(
        { error: 'Missing profile' },
        { status: 400 }
      );
    }

    let linkedProjectId = projectId as string | undefined;

    if (!linkedProjectId && pondId) {
      const pondRef = ref(db, `shrimp/${profile}/ponds/${pondId}`);
      const pondSnapshot = await get(pondRef);
      const pondData = pondSnapshot.val();
      linkedProjectId = pondData?.linkedProjectId || undefined;
    }

    if (!linkedProjectId) {
      return NextResponse.json({
        recommendations: [],
        projectedSavings: null,
        timeline: null,
        missingFields: ['linkedProjectId'],
      });
    }

    const projectTxRef = ref(db, `projects/${linkedProjectId}/transactions`);
    const projectSnapshot = await get(projectTxRef);
    let transactionsData = projectSnapshot.val();

    if (!transactionsData) {
      const globalTxRef = ref(db, 'transactions');
      const globalSnapshot = await get(globalTxRef);
      const globalData = globalSnapshot.val();
      if (globalData) {
        const filtered = Object.values(globalData).filter((tx: any) => tx.projectId === linkedProjectId);
        transactionsData = filtered.length > 0 ? filtered : null;
      }
    }

    if (!transactionsData) {
      return NextResponse.json({
        recommendations: [],
        projectedSavings: null,
        timeline: null,
        missingFields: ['transactions'],
      });
    }

    const transactions = Array.isArray(transactionsData) ? transactionsData : Object.values(transactionsData);
    const expenses = transactions.filter((tx: any) => tx.type === 'expense');

    if (expenses.length === 0) {
      return NextResponse.json({
        recommendations: [],
        projectedSavings: null,
        timeline: null,
        missingFields: ['expenseTransactions'],
      });
    }

    const categoryTotals: Record<string, number> = {};
    let totalCosts = 0;

    expenses.forEach((tx: any) => {
      const amount = Number(tx.amount);
      if (!Number.isFinite(amount)) return;
      totalCosts += amount;
      const category = tx.category || 'Uncategorized';
      categoryTotals[category] = (categoryTotals[category] || 0) + amount;
    });

    const topCategories = Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    const recommendations = topCategories.map(([category, amount]) => (
      `Review ${category} spend (current total ${amount.toFixed(2)}). Identify vendor optimizations and usage controls.`
    ));

    const projectedSavings = totalCosts > 0 ? Math.round(totalCosts * 0.08) : null;

    return NextResponse.json({
      recommendations,
      projectedSavings,
      timeline: '2-4 weeks after implementing changes',
      missingFields: [],
    });
  } catch (error) {
    console.error('Cost optimization error:', error);
    return NextResponse.json(
      { error: 'Failed to generate optimization plan' },
      { status: 500 }
    );
  }
}
