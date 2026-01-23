"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DollarSign, TrendingUp, TrendingDown, PieChart as PieChartIcon, AlertTriangle } from 'lucide-react';
import { db } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import { useUser } from '@/context/user-context';

interface FinancialMetrics {
  totalRevenue: number;
  totalExpenses: number;
  totalProfit: number;
  costByCategory: Record<string, number>;
  monthlyTrends: Array<{ month: string; revenue: number; expenses: number; profit: number }>;
  fcr: number;
}

export function FinancialDashboard({ pondId, linkedProjectId }: { pondId: string; linkedProjectId?: string | null }) {
  const { selectedProfile } = useUser();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<FinancialMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedProfile) {
      setError('No profile selected');
      setLoading(false);
      return;
    }

    if (!linkedProjectId) {
      setError('This pond is not linked to any project');
      setLoading(false);
      return;
    }

    // Fetch transactions from the linked project
    const transactionsRef = ref(db, `projects/${linkedProjectId}/transactions`);
    
    const unsubscribe = onValue(transactionsRef, (snapshot) => {
      try {
        const transactionsData = snapshot.val();
        
        if (!transactionsData) {
          // No transaction data yet
          setMetrics(null);
          setLoading(false);
          return;
        }

        // Convert to array
        const transactions = Object.values(transactionsData) as any[];

        // Calculate metrics from database
        let totalRevenue = 0;
        let totalExpenses = 0;
        const costByCategory: Record<string, number> = {};

        transactions.forEach((tx) => {
          const amount = tx.amount || 0;
          if (tx.type === 'income') {
            totalRevenue += amount;
          } else if (tx.type === 'expense') {
            totalExpenses += amount;
            const category = tx.category || 'Other';
            costByCategory[category] = (costByCategory[category] || 0) + amount;
          }
        });

        const totalProfit = totalRevenue - totalExpenses;

        // Group transactions by month for trends
        const monthlyMap: Record<string, { revenue: number; expenses: number }> = {};
        transactions.forEach((tx) => {
          const date = new Date(tx.date || tx.createdAt || new Date());
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          
          if (!monthlyMap[monthKey]) {
            monthlyMap[monthKey] = { revenue: 0, expenses: 0 };
          }

          if (tx.type === 'income') {
            monthlyMap[monthKey].revenue += tx.amount || 0;
          } else {
            monthlyMap[monthKey].expenses += tx.amount || 0;
          }
        });

        // Convert to array and format
        const monthlyTrends = Object.entries(monthlyMap)
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([month, data]) => ({
            month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short' }),
            revenue: data.revenue,
            expenses: data.expenses,
            profit: data.revenue - data.expenses,
          }));

        // Calculate FCR (simplified - based on expense to revenue ratio)
        const fcr = totalRevenue > 0 ? (totalExpenses / totalRevenue) : 0;

        setMetrics({
          totalRevenue,
          totalExpenses,
          totalProfit,
          costByCategory,
          monthlyTrends,
          fcr,
        });
        setLoading(false);
      } catch (err) {
        console.error('Error processing financial data:', err);
        setError('Error processing transaction data');
        setLoading(false);
      }
    }, (error) => {
      console.error('Database error:', error);
      setError('Unable to fetch financial data');
      setLoading(false);
    });

    return unsubscribe;
  }, [linkedProjectId, selectedProfile]);

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-40">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-600">Loading financial data...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert>
            <AlertDescription>
              No financial transactions recorded yet for this pond.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  // Convert cost by category to array for charts
  const costDataArray = Object.entries(metrics.costByCategory).map(([name, value]) => ({
    name,
    value,
    percentage: Math.round((value / metrics.totalExpenses) * 100),
  }));

  return (
    <div className="space-y-6">
      {/* Pond Identifier */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600">📍 Financial Analytics for:</span>
            <Badge className="bg-blue-600">{pondId}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Financial Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">₹{(metrics.totalRevenue / 100000).toFixed(1)}L</div>
            <p className="text-xs text-green-600 mt-1">From database transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-orange-600" />
              Total Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">₹{(metrics.totalExpenses / 100000).toFixed(1)}L</div>
            <p className="text-xs text-orange-600 mt-1">Across all categories</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Net Profit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">₹{(metrics.totalProfit / 100000).toFixed(1)}L</div>
            <p className={`text-xs mt-1 ${metrics.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {metrics.totalProfit >= 0 ? '+' : ''}{((metrics.totalProfit / metrics.totalRevenue) * 100 || 0).toFixed(1)}% margin
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <PieChartIcon className="h-4 w-4 text-blue-600" />
              Cost Ratio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{(metrics.fcr * 100).toFixed(1)}%</div>
            <p className="text-xs text-blue-600 mt-1">Expense to Revenue</p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📈 Monthly Revenue vs Expenses - Pond {pondId}
          </CardTitle>
          <CardDescription>Trend analysis from database transactions</CardDescription>
        </CardHeader>
        <CardContent>
          {metrics.monthlyTrends.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metrics.monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#666" />
                <YAxis label={{ value: 'Amount (₹)', angle: -90, position: 'insideLeft' }} stroke="#666" />
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }} formatter={(value) => `₹${value.toLocaleString()}`} />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#10b981" name="Revenue" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="expenses" stroke="#ef4444" name="Expenses" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="profit" stroke="#3b82f6" name="Profit" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-500">
              No transaction data available yet
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cost Breakdown Pie Chart */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🥧 Cost Breakdown - {pondId}
            </CardTitle>
            <CardDescription>Expense distribution from database</CardDescription>
          </CardHeader>
          <CardContent>
            {costDataArray.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={costDataArray}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name} ${percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {costDataArray.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-80 flex items-center justify-center text-gray-500">
                No expense data available yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cost Details Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              💰 Expense Details - {pondId}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {costDataArray.length > 0 ? (
              <div className="space-y-3">
                {costDataArray.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                      />
                      <span className="font-medium text-sm text-gray-700">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-900">₹{(item.value / 1000).toFixed(0)}K</div>
                      <div className="text-xs text-gray-600">{item.percentage}%</div>
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between p-2 bg-blue-50 rounded font-semibold border border-blue-200">
                <span>Total Expenses</span>
                <span>₹{(metrics.totalExpenses / 100000).toFixed(1)}L</span>
              </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                No expense categories recorded yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            💡 Financial Recommendations for {pondId}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            <li className="flex gap-2">
              <Badge variant="outline" className="bg-green-100 text-green-800 flex-shrink-0">✓</Badge>
              <span className="text-sm text-gray-700">Track all expenses in database to enable financial analysis</span>
            </li>
            <li className="flex gap-2">
              <Badge variant="outline" className="bg-blue-100 text-blue-800 flex-shrink-0">ℹ️</Badge>
              <span className="text-sm text-gray-700">Record revenue transactions to monitor profitability</span>
            </li>
            <li className="flex gap-2">
              <Badge variant="outline" className="bg-orange-100 text-orange-800 flex-shrink-0">⚠️</Badge>
              <span className="text-sm text-gray-700">Review expense categories for cost optimization opportunities</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
