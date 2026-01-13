'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useDocuments } from '@/hooks/use-shrimp';
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
  const { documents } = useDocuments(pondId);

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

  const parsedMinerals = useMemo(() => {
    const docsWithMinerals = documents.filter(doc => doc.minerals);
    if (!docsWithMinerals.length) return [] as MineralData[];

    return docsWithMinerals.map(doc => {
      const m = doc.minerals || {};
      return {
        date: doc.uploadDate?.split('T')[0] || doc.uploadDate || 'unknown',
        phosphorus: Number(m.phosphorus ?? 0),
        potassium: Number(m.potassium ?? 0),
        nitrogen: Number(m.nitrogen ?? 0),
        calcium: Number(m.calcium ?? 0),
        magnesium: Number(m.magnesium ?? 0),
        sulphur: Number(m.sulphur ?? 0),
        boron: Number(m.boron ?? 0),
        ironPPM: Number(m.ironPPM ?? m.iron ?? 0),
      } as MineralData;
    });
  }, [documents]);

  const mineralData: MineralData[] = parsedMinerals;

  if (!mineralData.length) {
    return (
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-lg">Minerals - {pondName}</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="border-blue-200 bg-blue-50">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800 ml-2">
              Upload test result documents with mineral data to populate this chart.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const latestData = mineralData[mineralData.length - 1];

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
              <LineChart data={mineralData}>
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
              <LineChart data={mineralData}>
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
              <LineChart data={mineralData}>
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
