"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DollarSign, TrendingUp, TrendingDown, PieChart as PieChartIcon, AlertTriangle, Plus, Link as LinkIcon } from 'lucide-react';
import { db } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import { useUser } from '@/context/user-context';
import { useProjects } from '@/hooks/use-database';
import { usePonds } from '@/hooks/use-shrimp';
import { AddExpenseDialog } from '@/components/add-expense-dialog';

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
  const { projects } = useProjects();
  const { ponds, updatePond } = usePonds();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<FinancialMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activePondData = ponds.find(p => p.id === pondId);
  const linkedProject = projects.find(p => p.id === linkedProjectId);
  const activeProjects = projects.filter(p => !p.archived);

  useEffect(() => {
    if (!selectedProfile) {
      setError('No profile selected');
      setLoading(false);
      return;
    }

    if (!linkedProjectId) {
      setLoading(false);
      return;
    }

    // Read from the root transactions node, filtered by projectId
    const transactionsRef = ref(db, 'transactions');
    
    const unsubscribe = onValue(transactionsRef, (snapshot) => {
      try {
        const allData = snapshot.val();
        
        if (!allData) {
          setMetrics(null);
          setLoading(false);
          return;
        }

        // Filter transactions for this pond's linked project
        const allTransactions = Object.values(allData) as any[];
        const transactions = allTransactions.filter(tx => tx.projectId === linkedProjectId);

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

  if (!linkedProjectId) {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="pt-6">
          <div className="text-center py-6 space-y-4">
            <LinkIcon className="h-10 w-10 text-amber-500 mx-auto" />
            <div>
              <p className="font-semibold text-amber-900">No Project Linked</p>
              <p className="text-sm text-amber-700 mt-1">
                Link this pond to a project to track expenses and revenue, then add transactions against that project.
              </p>
            </div>
            {activeProjects.length > 0 && (
              <div className="flex gap-2 justify-center flex-wrap">
                {activeProjects.slice(0, 5).map(p => (
                  <Button
                    key={p.id}
                    size="sm"
                    variant="outline"
                    className="border-amber-400 text-amber-900"
                    onClick={() => updatePond(pondId, { linkedProjectId: p.id })}
                  >
                    Link to {p.name}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 space-y-4">
            <p className="text-gray-600 font-medium">
              No transactions yet for <span className="font-bold">{linkedProject?.name || linkedProjectId}</span>
            </p>
            <p className="text-sm text-gray-500">Add income or expense transactions linked to this project to see financial analytics here.</p>
            <AddExpenseDialog>
              <Button className="gap-2 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white">
                <Plus className="h-4 w-4" /> Add Transaction
              </Button>
            </AddExpenseDialog>
          </div>
        </CardContent>
      </Card>
    );
  }

  const COLORS = ['#2563eb', '#059669', '#d97706', '#dc2626', '#7c3aed', '#0891b2', '#be185d', '#65a30d', '#ea580c', '#6366f1'];

  // Convert cost by category to array for charts
  const costDataArray = Object.entries(metrics.costByCategory).map(([name, value]) => ({
    name,
    value,
    percentage: Math.round((value / metrics.totalExpenses) * 100),
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Badge className="bg-blue-600">{activePondData?.name || pondId}</Badge>
          {linkedProject && <span className="text-sm text-gray-500">→ <span className="font-medium text-gray-700">{linkedProject.name}</span></span>}
        </div>
        <AddExpenseDialog>
          <Button size="sm" className="gap-1.5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white">
            <Plus className="h-3.5 w-3.5" /> Add Transaction
          </Button>
        </AddExpenseDialog>
      </div>

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
              <TrendingUp className="h-5 w-5 text-blue-500" />
              Monthly Revenue vs Expenses
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
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }} formatter={(value) => `₹${(Number(value) || 0).toLocaleString()}`} />
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

      {/* Cost Breakdown Donut Chart */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-blue-500" />
              Cost Breakdown
            </CardTitle>
            <CardDescription>Expense distribution by category</CardDescription>
          </CardHeader>
          <CardContent>
            {costDataArray.length > 0 ? (
              <div className="flex flex-col items-center gap-4">
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={costDataArray}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={95}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {costDataArray.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => `\u20B9${(Number(value) || 0).toLocaleString()}`}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Legend */}
                <div className="w-full grid grid-cols-2 gap-x-4 gap-y-1.5">
                  {costDataArray.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <div
                        className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                        style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                      />
                      <span className="text-gray-600 truncate flex-1">{item.name}</span>
                      <span className="text-gray-900 font-medium tabular-nums">{item.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
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
              <DollarSign className="h-5 w-5 text-emerald-500" />
              Expense Details
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
              <TrendingUp className="h-5 w-5 text-green-600" />
              Financial Recommendations
            </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            <li className="flex gap-2">
              <Badge variant="outline" className="bg-green-100 text-green-800 flex-shrink-0">
                <TrendingUp className="h-3 w-3" />
              </Badge>
              <span className="text-sm text-gray-700">Track all expenses in database to enable financial analysis</span>
            </li>
            <li className="flex gap-2">
              <Badge variant="outline" className="bg-blue-100 text-blue-800 flex-shrink-0">
                <AlertTriangle className="h-3 w-3" />
              </Badge>
              <span className="text-sm text-gray-700">Record revenue transactions to monitor profitability</span>
            </li>
            <li className="flex gap-2">
              <Badge variant="outline" className="bg-orange-100 text-orange-800 flex-shrink-0">
                <AlertTriangle className="h-3 w-3" />
              </Badge>
              <span className="text-sm text-gray-700">Review expense categories for cost optimization opportunities</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
