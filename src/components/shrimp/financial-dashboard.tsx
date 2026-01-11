"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, PieChart, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, DollarSign, AlertCircle, Wand2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function FinancialDashboard({ pondId }: { pondId: string }) {
  const { toast } = useToast();
  const [isOptimizing, setIsOptimizing] = useState(false);

  // Sample financial data
  const costData = [
    { category: 'Feed', amount: 4500, percentage: 45 },
    { category: 'Labor', amount: 2500, percentage: 25 },
    { category: 'Energy', amount: 1500, percentage: 15 },
    { category: 'Probiotics', amount: 800, percentage: 8 },
    { category: 'Other', amount: 700, percentage: 7 },
  ];

  const projectionData = [
    { month: 'Week 1', revenue: 0, costs: 2000, profit: -2000 },
    { month: 'Week 2', revenue: 500, costs: 2100, profit: -1600 },
    { month: 'Week 4', revenue: 2500, costs: 2300, profit: 200 },
    { month: 'Week 8', revenue: 8000, costs: 2500, profit: 5500 },
    { month: 'Week 12', revenue: 15000, costs: 2700, profit: 12300 },
    { month: 'Harvest', revenue: 45000, costs: 3000, profit: 42000 },
  ];

  const trendData = [
    { week: '1', fcr: 1.2, costPerKg: 8.5 },
    { week: '2', fcr: 1.3, costPerKg: 8.2 },
    { week: '4', fcr: 1.4, costPerKg: 7.8 },
    { week: '8', fcr: 1.5, costPerKg: 7.2 },
    { week: '12', fcr: 1.4, costPerKg: 6.8 },
  ];

  const handleOptimizeCosts = async () => {
    setIsOptimizing(true);
    try {
      const response = await fetch('/api/ai/optimize-costs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pondId,
          currentFCR: 1.4,
          currentCostPerKg: 6.8,
          totalCosts: 10000,
        }),
      });

      const data = await response.json();
      toast({
        title: "Cost Optimization Analysis",
        description: "Review recommendations to reduce expenses",
      });
    } catch (error) {
      console.error('Cost optimization error:', error);
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: "Could not generate optimization suggestions",
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  const totalCosts = costData.reduce((sum, item) => sum + item.amount, 0);
  const totalRevenue = 45000;
  const roi = ((totalRevenue - totalCosts) / totalCosts * 100).toFixed(1);

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Invested</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalCosts.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Current cycle</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Projected Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">At harvest</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Projected ROI</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{roi}%</div>
            <p className="text-xs text-muted-foreground mt-1">Return on investment</p>
          </CardContent>
        </Card>
      </div>

      {/* Cost Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Cost Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={costData}
                dataKey="amount"
                nameKey="category"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              />
              <Tooltip formatter={(value) => `$${value}`} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-4">
            {costData.map(item => (
              <div key={item.category} className="text-center">
                <p className="text-sm font-semibold">{item.category}</p>
                <p className="text-lg font-bold text-blue-600">${item.amount}</p>
                <p className="text-xs text-muted-foreground">{item.percentage}%</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Revenue & Profit Projection */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue & Profit Projection</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={projectionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => `$${value}`} />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2} name="Revenue" />
              <Line type="monotone" dataKey="costs" stroke="#ef4444" strokeWidth={2} name="Costs" />
              <Line type="monotone" dataKey="profit" stroke="#3b82f6" strokeWidth={2} name="Profit" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* FCR & Cost Per KG Trend */}
      <Card>
        <CardHeader>
          <CardTitle>FCR & Cost Efficiency Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" label={{ value: 'Week', position: 'insideBottomRight', offset: -5 }} />
              <YAxis yAxisId="left" label={{ value: 'FCR', angle: -90, position: 'insideLeft' }} />
              <YAxis yAxisId="right" orientation="right" label={{ value: '$/kg', angle: 90, position: 'insideRight' }} />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="fcr" fill="#8884d8" name="FCR" />
              <Bar yAxisId="right" dataKey="costPerKg" fill="#82ca9d" name="Cost/kg" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* AI Cost Optimization */}
      <Card className="border-2 border-purple-200 bg-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-purple-600" />
            AI Cost Optimization
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Optimize Your Expenses</p>
              <p className="text-sm text-muted-foreground mt-1">AI analysis can identify cost-saving opportunities based on your FCR trends and feeding efficiency</p>
            </div>
          </div>
          <Button
            onClick={handleOptimizeCosts}
            disabled={isOptimizing}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            {isOptimizing ? 'Analyzing...' : 'Generate Cost Optimization Plan'}
          </Button>
        </CardContent>
      </Card>

      {/* Market Price Converter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Market Price Converter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Current Market Price</p>
              <p className="text-2xl font-bold">$12/kg</p>
              <Badge className="mt-2">Market Rate</Badge>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Your Cost Per KG</p>
              <p className="text-2xl font-bold">$6.80</p>
              <Badge variant="outline" className="mt-2">Efficient</Badge>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Gross Margin</p>
              <p className="text-2xl font-bold text-green-600">$5.20/kg</p>
              <Badge variant="outline" className="mt-2">43% Margin</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
