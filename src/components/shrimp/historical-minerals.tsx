'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

interface MineralData {
  date: string;
  phosphorus: number;
  potassium: number;
  nitrogen: number;
  calcium: number;
  magnesium: number;
  sulphur: number;
  boron: number;
  ironPPM: number;
}

interface MineralGraphProps {
  pondName: string;
  pondId: string;
}

export function HistoricalMineralGraphs({ pondName, pondId }: MineralGraphProps) {
  // Mock data - replace with real data from your API
  const mockData: MineralData[] = [
    {
      date: '2026-01-05',
      phosphorus: 45,
      potassium: 120,
      nitrogen: 85,
      calcium: 200,
      magnesium: 60,
      sulphur: 30,
      boron: 0.8,
      ironPPM: 2.5,
    },
    {
      date: '2026-01-06',
      phosphorus: 48,
      potassium: 125,
      nitrogen: 88,
      calcium: 205,
      magnesium: 62,
      sulphur: 31,
      boron: 0.85,
      ironPPM: 2.6,
    },
    {
      date: '2026-01-07',
      phosphorus: 50,
      potassium: 130,
      nitrogen: 90,
      calcium: 210,
      magnesium: 64,
      sulphur: 32,
      boron: 0.9,
      ironPPM: 2.7,
    },
    {
      date: '2026-01-08',
      phosphorus: 52,
      potassium: 135,
      nitrogen: 92,
      calcium: 215,
      magnesium: 66,
      sulphur: 33,
      boron: 0.88,
      ironPPM: 2.8,
    },
    {
      date: '2026-01-09',
      phosphorus: 55,
      potassium: 140,
      nitrogen: 95,
      calcium: 220,
      magnesium: 68,
      sulphur: 34,
      boron: 0.95,
      ironPPM: 2.9,
    },
    {
      date: '2026-01-10',
      phosphorus: 58,
      potassium: 145,
      nitrogen: 98,
      calcium: 225,
      magnesium: 70,
      sulphur: 35,
      boron: 1.0,
      ironPPM: 3.0,
    },
    {
      date: '2026-01-11',
      phosphorus: 60,
      potassium: 150,
      nitrogen: 100,
      calcium: 230,
      magnesium: 72,
      sulphur: 36,
      boron: 1.05,
      ironPPM: 3.1,
    },
  ];

  const mineralColors = {
    phosphorus: '#FF6B6B',      // Red
    potassium: '#4ECDC4',       // Teal
    nitrogen: '#45B7D1',        // Blue
    calcium: '#FFA07A',         // Light Salmon
    magnesium: '#98D8C8',       // Mint
    sulphur: '#F7DC6F',         // Yellow
    boron: '#BB8FCE',           // Purple
    ironPPM: '#85C1E2',         // Steel Blue
  };

  const mineralLabels = {
    phosphorus: 'Phosphorus (P)',
    potassium: 'Potassium (K)',
    nitrogen: 'Nitrogen (N)',
    calcium: 'Calcium (Ca)',
    magnesium: 'Magnesium (Mg)',
    sulphur: 'Sulphur (S)',
    boron: 'Boron (B)',
    ironPPM: 'Iron (PPM)',
  };

  const optimalRanges: Record<string, { min: number; max: number; unit: string }> = {
    phosphorus: { min: 40, max: 70, unit: 'ppm' },
    potassium: { min: 100, max: 160, unit: 'ppm' },
    nitrogen: { min: 70, max: 120, unit: 'ppm' },
    calcium: { min: 180, max: 250, unit: 'ppm' },
    magnesium: { min: 50, max: 80, unit: 'ppm' },
    sulphur: { min: 25, max: 40, unit: 'ppm' },
    boron: { min: 0.5, max: 2.0, unit: 'ppm' },
    ironPPM: { min: 1.5, max: 4.0, unit: 'ppm' },
  };

  const latestData = mockData[mockData.length - 1];

  const getMineralStatus = (key: string, value: number) => {
    const range = optimalRanges[key];
    if (value < range.min) return { status: 'Deficient', color: 'bg-red-100 border-red-500 text-red-900', icon: '📉' };
    if (value > range.max) return { status: 'Excess', color: 'bg-orange-100 border-orange-500 text-orange-900', icon: '📈' };
    return { status: 'Optimal', color: 'bg-green-100 border-green-500 text-green-900', icon: '✅' };
  };

  return (
    <div className="space-y-6">
      {/* Current Mineral Status */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-lg">Current Mineral Status - {pondName}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(optimalRanges).map(([key, range]) => {
              const value = latestData[key as keyof MineralData] as number;
              const statusInfo = getMineralStatus(key, value);
              return (
                <div key={key} className={`p-3 rounded-lg border-2 ${statusInfo.color}`}>
                  <p className="text-sm font-semibold">{statusInfo.icon} {mineralLabels[key as keyof typeof mineralLabels]}</p>
                  <p className="text-lg font-bold mt-1">{typeof value === 'number' ? value.toFixed(1) : value} {range.unit}</p>
                  <p className="text-xs mt-1">
                    Range: {range.min}-{range.max} {range.unit}
                  </p>
                  <Badge variant="outline" className="mt-2 text-xs">
                    {statusInfo.status}
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Macronutrients Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">📊 Macronutrients Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={mockData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                stroke="#666"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                stroke="#666"
                label={{ value: 'Concentration (ppm)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '2px solid #666',
                  borderRadius: '8px',
                  padding: '10px',
                }}
                formatter={(value) => (typeof value === 'number' ? value.toFixed(1) : value)}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="nitrogen"
                stroke={mineralColors.nitrogen}
                strokeWidth={2}
                dot={{ r: 4 }}
                name={mineralLabels.nitrogen}
              />
              <Line
                type="monotone"
                dataKey="phosphorus"
                stroke={mineralColors.phosphorus}
                strokeWidth={2}
                dot={{ r: 4 }}
                name={mineralLabels.phosphorus}
              />
              <Line
                type="monotone"
                dataKey="potassium"
                stroke={mineralColors.potassium}
                strokeWidth={2}
                dot={{ r: 4 }}
                name={mineralLabels.potassium}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Secondary Nutrients Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">⚗️ Secondary Nutrients Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={mockData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                stroke="#666"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                stroke="#666"
                label={{ value: 'Concentration (ppm)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '2px solid #666',
                  borderRadius: '8px',
                  padding: '10px',
                }}
                formatter={(value) => (typeof value === 'number' ? value.toFixed(1) : value)}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="calcium"
                stroke={mineralColors.calcium}
                strokeWidth={2}
                dot={{ r: 4 }}
                name={mineralLabels.calcium}
              />
              <Line
                type="monotone"
                dataKey="magnesium"
                stroke={mineralColors.magnesium}
                strokeWidth={2}
                dot={{ r: 4 }}
                name={mineralLabels.magnesium}
              />
              <Line
                type="monotone"
                dataKey="sulphur"
                stroke={mineralColors.sulphur}
                strokeWidth={2}
                dot={{ r: 4 }}
                name={mineralLabels.sulphur}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Micronutrients Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">🔬 Micronutrients Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={mockData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                stroke="#666"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                stroke="#666"
                label={{ value: 'Concentration (ppm)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '2px solid #666',
                  borderRadius: '8px',
                  padding: '10px',
                }}
                formatter={(value) => (typeof value === 'number' ? value.toFixed(2) : value)}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="boron"
                stroke={mineralColors.boron}
                strokeWidth={2}
                dot={{ r: 4 }}
                name={mineralLabels.boron}
              />
              <Line
                type="monotone"
                dataKey="ironPPM"
                stroke={mineralColors.ironPPM}
                strokeWidth={2}
                dot={{ r: 4 }}
                name={mineralLabels.ironPPM}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Optimal Minerals</p>
            <p className="text-3xl font-bold text-green-600">
              {Object.entries(optimalRanges).filter(([key]) => {
                const value = latestData[key as keyof MineralData] as number;
                const range = optimalRanges[key];
                return value >= range.min && value <= range.max;
              }).length}/{Object.keys(optimalRanges).length}
            </p>
            <p className="text-xs text-gray-500 mt-2">Within recommended ranges</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-amber-50">
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Deficient Minerals</p>
            <p className="text-3xl font-bold text-orange-600">
              {Object.entries(optimalRanges).filter(([key]) => {
                const value = latestData[key as keyof MineralData] as number;
                const range = optimalRanges[key];
                return value < range.min;
              }).length}
            </p>
            <p className="text-xs text-gray-500 mt-2">Need supplementation</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-rose-50">
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Excess Minerals</p>
            <p className="text-3xl font-bold text-red-600">
              {Object.entries(optimalRanges).filter(([key]) => {
                const value = latestData[key as keyof MineralData] as number;
                const range = optimalRanges[key];
                return value > range.max;
              }).length}
            </p>
            <p className="text-xs text-gray-500 mt-2">May require intervention</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
