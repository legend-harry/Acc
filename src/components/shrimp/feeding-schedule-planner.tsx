"use client";

import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent } from 'react';
import * as XLSX from 'xlsx';
import { format, isValid, parseISO, differenceInDays } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Scatter } from 'recharts';
import { Upload, Sparkles, AlertCircle } from 'lucide-react';
import { useProjects } from '@/hooks/use-database';

const CULTURE_DAYS = 120;

// Calculate day of culture from seed date
export const calculateDayOfCulture = (seedDate: string | Date): number => {
  if (!seedDate) return 0;
  try {
    const parsed = typeof seedDate === 'string' ? parseISO(seedDate) : seedDate;
    if (!isValid(parsed)) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const seedDay = new Date(parsed);
    seedDay.setHours(0, 0, 0, 0);
    return Math.max(0, differenceInDays(today, seedDay));
  } catch {
    return 0;
  }
};

// Check if date is not today
export const isDateNotToday = (dateStr: string): boolean => {
  if (!dateStr) return false;
  try {
    const parsed = parseISO(dateStr);
    if (!isValid(parsed)) return false;
    const today = new Date();
    return format(parsed, 'yyyy-MM-dd') !== format(today, 'yyyy-MM-dd');
  } catch {
    return false;
  }
};

const clampNumber = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const toDate = (value: unknown) => {
  if (value instanceof Date && isValid(value)) return value;
  if (typeof value === 'number') {
    const dateCode = XLSX.SSF.parse_date_code(value);
    if (dateCode) {
      const { y, m, d } = dateCode;
      const excelDate = new Date(y, (m || 1) - 1, d || 1);
      return isValid(excelDate) ? excelDate : null;
    }
  }
  if (typeof value === 'string') {
    const parsed = parseISO(value);
    if (isValid(parsed)) return parsed;
    const fallback = new Date(value);
    return isValid(fallback) ? fallback : null;
  }
  return null;
};

const normalizeKey = (key: string) => key.trim().toLowerCase().replace(/[\s-]+/g, '_');

const findColumnKey = (keys: string[], candidates: string[]) => {
  for (const candidate of candidates) {
    const match = keys.find((key) => normalizeKey(key) === candidate);
    if (match) return match;
  }
  return null;
};

const FIELD_ALIASES = {
  startDate: ['start_date', 'culture_start_date', 'stocking_date'],
  initialStock: ['initial_stock', 'stocking_count', 'stock_count', 'count'],
  initialWeight: ['initial_weight_g', 'initial_weight', 'pl_weight_g'],
  maxWeight: ['max_weight_g', 'harvest_weight_g', 'target_weight_g'],
  dgr: ['daily_growth_rate', 'dgr', 'growth_rate'],
  fcr: ['fcr', 'feed_conversion_ratio'],
  survival: ['survival_rate', 'survival'],
  feedRate: ['feed_rate_percent', 'feed_rate', 'feeding_rate_percent'],
} as const;

const findFieldValue = (
  records: Record<string, unknown>[],
  aliases: readonly string[],
): unknown => {
  for (const record of records) {
    for (const key of Object.keys(record)) {
      if (aliases.includes(normalizeKey(key))) {
        const value = record[key];
        if (value !== undefined && value !== null && value !== '') {
          return value;
        }
      }
    }
  }
  return null;
};

const toNumber = (value: unknown) => {
  const numeric = typeof value === 'string' ? Number(value.trim()) : Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

type HistoricalPoint = {
  date: string;
  feed_kg: number;
};

type ProjectionPoint = {
  date: string;
  day: number;
  weight_g: number;
  biomass_kg: number;
  feed_kg: number;
};

const generateProjection = ({
  startDate,
  dgr,
  fcr,
  survival,
  initialCount,
  initialWeight,
  maxWeight,
  feedRatePercent,
}: {
  startDate: string;
  dgr: number;
  fcr: number;
  survival: number;
  initialCount: number;
  initialWeight: number;
  maxWeight: number;
  feedRatePercent: number;
}): ProjectionPoint[] => {
  // Guard: return empty if startDate is invalid
  if (!startDate) return [];
  const parsedStart = parseISO(startDate);
  if (!isValid(parsedStart)) return [];

  const dates: Date[] = Array.from({ length: CULTURE_DAYS }, (_, index) => {
    const day = new Date(parsedStart);
    day.setDate(day.getDate() + index);
    return day;
  });

  const k = Math.max(0.001, (dgr / 100) * 0.8);
  const t0 = Math.log(-Math.log(initialWeight / maxWeight)) / k;
  const dailySurvival = Math.pow(clampNumber(survival / 100, 0.5, 1), 1 / CULTURE_DAYS);
  const feedRate = Math.max(0, feedRatePercent / 100);

  const points: ProjectionPoint[] = [];
  let previousWeight = initialWeight;

  dates.forEach((date, index) => {
    const weight = maxWeight * Math.exp(-Math.exp(-k * (index - t0)));
    const count = initialCount * Math.pow(dailySurvival, index);
    const biomass = (weight * count) / 1000;
    const biomassGain = index === 0 ? 0 : ((weight - previousWeight) * count) / 1000;
    const feedByFcr = biomassGain * fcr;
    const feedByRate = biomass * feedRate;
    const feed = Math.max(feedByRate, feedByFcr);

    points.push({
      date: format(date, 'yyyy-MM-dd'),
      day: index + 1,
      weight_g: Math.max(0, weight),
      biomass_kg: Math.max(0, biomass),
      feed_kg: Math.max(0, feed),
    });

    previousWeight = weight;
  });

  return points;
};

export function FeedingSchedulePlanner({
  pondName,
  initialStock,
}: {
  pondName: string;
  initialStock?: number;
}) {
  const { projects, loading: projectsLoading } = useProjects();
  const [startDate, setStartDate] = useState('');
  const [project, setProject] = useState('');
  const [initialStockValue, setInitialStockValue] = useState<number | null>(null);
  const [initialWeight, setInitialWeight] = useState<number | null>(null);
  const [maxWeight, setMaxWeight] = useState<number | null>(null);
  const [feedRatePercent, setFeedRatePercent] = useState<number | null>(null);
  const [dgr, setDgr] = useState<number | null>(null);
  const [fcr, setFcr] = useState<number | null>(null);
  const [survival, setSurvival] = useState<number | null>(null);
  const [historicalData, setHistoricalData] = useState<HistoricalPoint[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadName, setUploadName] = useState<string | null>(null);
  const [reportUploadName, setReportUploadName] = useState<string | null>(null);
  const [analysisUploadName, setAnalysisUploadName] = useState<string | null>(null);
  const [dataSourceMessage, setDataSourceMessage] = useState<{ reports?: string; analysis?: string }>({});
  
  // New state for setup dialog and DOC
  const [showSetupDialog, setShowSetupDialog] = useState(false);
  const [dayOfCulture, setDayOfCulture] = useState(0);
  const [setupCompleted, setSetupCompleted] = useState(false);

  useEffect(() => {
    if (project) return;
    if (projects.length > 0) {
      const firstActive = projects.find((item) => !item.archived);
      setProject(firstActive?.id ?? projects[0].id);
    }
  }, [projects, project]);

  // Show setup dialog if date is not current and setup not completed
  useEffect(() => {
    if (startDate && !setupCompleted && isDateNotToday(startDate)) {
      setShowSetupDialog(true);
    }
  }, [startDate, setupCompleted]);

  // Auto-update day of culture based on seed date
  useEffect(() => {
    if (startDate) {
      const doc = calculateDayOfCulture(startDate);
      setDayOfCulture(doc);
      
      // Auto-update cycle day in journey map (this would tie to the pond data)
      // The DOC is now accessible for use in other components
    }
  }, [startDate]);

  // Update DOC daily to keep it current
  useEffect(() => {
    if (!startDate) return;
    
    const updateDOC = () => {
      const doc = calculateDayOfCulture(startDate);
      setDayOfCulture(doc);
    };
    
    // Update immediately
    updateDOC();
    
    // Then update at midnight every day
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const timeUntilMidnight = tomorrow.getTime() - now.getTime();
    const midnightTimeout = setTimeout(updateDOC, timeUntilMidnight);
    
    return () => clearTimeout(midnightTimeout);
  }, [startDate]);

  // Handle setup dialog completion
  const handleSetupComplete = () => {
    setSetupCompleted(true);
    setShowSetupDialog(false);
  };

  useEffect(() => {
    if (initialStockValue === null && initialStock && initialStock > 0) {
      setInitialStockValue(initialStock);
    }
  }, [initialStock, initialStockValue]);

  const handleNumericInput = (
    setter: (value: number | null) => void,
  ) => (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (value === '') {
      setter(null);
      return;
    }
    const numeric = toNumber(value);
    setter(numeric);
  };

  const applyExtractedFields = (fields: {
    startDate?: string | null;
    initialStock?: number | null;
    initialWeight?: number | null;
    maxWeight?: number | null;
    dgr?: number | null;
    fcr?: number | null;
    survival?: number | null;
    feedRatePercent?: number | null;
  }) => {
    if (fields.startDate) setStartDate(fields.startDate);
    if (fields.initialStock !== null && fields.initialStock !== undefined) setInitialStockValue(fields.initialStock);
    if (fields.initialWeight !== null && fields.initialWeight !== undefined) setInitialWeight(fields.initialWeight);
    if (fields.maxWeight !== null && fields.maxWeight !== undefined) setMaxWeight(fields.maxWeight);
    if (fields.dgr !== null && fields.dgr !== undefined) setDgr(fields.dgr);
    if (fields.fcr !== null && fields.fcr !== undefined) setFcr(fields.fcr);
    if (fields.survival !== null && fields.survival !== undefined) setSurvival(fields.survival);
    if (fields.feedRatePercent !== null && fields.feedRatePercent !== undefined) setFeedRatePercent(fields.feedRatePercent);
  };

  const parseStructuredFile = async (file: File) => {
    if (file.name.toLowerCase().endsWith('.json')) {
      const text = await file.text();
      const parsed = JSON.parse(text);
      return Array.isArray(parsed) ? parsed : [parsed];
    }

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) throw new Error('No sheets found in file.');
    const sheet = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
  };

  const extractFieldsFromRecords = (records: Record<string, unknown>[]) => {
    const startRaw = findFieldValue(records, FIELD_ALIASES.startDate);
    const initialStockRaw = findFieldValue(records, FIELD_ALIASES.initialStock);
    const initialWeightRaw = findFieldValue(records, FIELD_ALIASES.initialWeight);
    const maxWeightRaw = findFieldValue(records, FIELD_ALIASES.maxWeight);
    const dgrRaw = findFieldValue(records, FIELD_ALIASES.dgr);
    const fcrRaw = findFieldValue(records, FIELD_ALIASES.fcr);
    const survivalRaw = findFieldValue(records, FIELD_ALIASES.survival);
    const feedRateRaw = findFieldValue(records, FIELD_ALIASES.feedRate);

    const parsedDate = toDate(startRaw);

    return {
      startDate: parsedDate ? format(parsedDate, 'yyyy-MM-dd') : null,
      initialStock: toNumber(initialStockRaw),
      initialWeight: toNumber(initialWeightRaw),
      maxWeight: toNumber(maxWeightRaw),
      dgr: toNumber(dgrRaw),
      fcr: toNumber(fcrRaw),
      survival: toNumber(survivalRaw),
      feedRatePercent: toNumber(feedRateRaw),
    };
  };

  const missingFields = useMemo(() => {
    const missing: { key: string; label: string }[] = [];
    if (!startDate) missing.push({ key: 'startDate', label: 'Culture start date' });
    if (initialStockValue === null || initialStockValue <= 0) missing.push({ key: 'initialStock', label: 'Initial stock count' });
    if (initialWeight === null || initialWeight <= 0) missing.push({ key: 'initialWeight', label: 'Initial weight (g)' });
    if (maxWeight === null || maxWeight <= 0) missing.push({ key: 'maxWeight', label: 'Target/harvest weight (g)' });
    if (dgr === null || dgr <= 0) missing.push({ key: 'dgr', label: 'Daily growth rate (%)' });
    if (fcr === null || fcr <= 0) missing.push({ key: 'fcr', label: 'Feed conversion ratio' });
    if (survival === null || survival <= 0) missing.push({ key: 'survival', label: 'Survival rate (%)' });
    if (feedRatePercent === null || feedRatePercent <= 0) missing.push({ key: 'feedRate', label: 'Feeding rate (% biomass)' });
    return missing;
  }, [startDate, initialStockValue, initialWeight, maxWeight, dgr, fcr, survival, feedRatePercent]);

  const validationIssues = useMemo(() => {
    const issues: { key: string; label: string }[] = [];
    if (initialWeight !== null && maxWeight !== null && initialWeight >= maxWeight) {
      issues.push({ key: 'weightRange', label: 'Initial weight must be less than target weight' });
    }
    return issues;
  }, [initialWeight, maxWeight]);

  const isReady = missingFields.length === 0 && validationIssues.length === 0;

  const projection = useMemo(() => {
    if (!isReady) return [];
    return generateProjection({
      startDate,
      dgr: dgr as number,
      fcr: fcr as number,
      survival: survival as number,
      initialCount: initialStockValue as number,
      initialWeight: initialWeight as number,
      maxWeight: maxWeight as number,
      feedRatePercent: feedRatePercent as number,
    });
  }, [isReady, startDate, dgr, fcr, survival, initialStockValue, initialWeight, maxWeight, feedRatePercent]);

  const metrics = useMemo(() => {
    if (projection.length === 0) return null;
    const totalFeed = projection.reduce((sum, point) => sum + point.feed_kg, 0);
    const avgFeed = totalFeed / projection.length;
    const finalPoint = projection[projection.length - 1];
    return {
      avgFeed: Math.round(avgFeed * 10) / 10,
      totalFeed: Math.round(totalFeed),
      finalWeight: Math.round(finalPoint.weight_g * 10) / 10,
      finalBiomass: Math.round(finalPoint.biomass_kg),
    };
  }, [projection]);

  const formatMaybe = (value: number | null, digits: number, suffix = '') => {
    if (value === null || Number.isNaN(value)) return '--';
    return `${value.toFixed(digits)}${suffix}`;
  };

  const handleFileUpload = async (file: File | null) => {
    setUploadError(null);
    if (!file) {
      setHistoricalData([]);
      setUploadName(null);
      return;
    }

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) throw new Error('No sheets found in file.');

      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

      if (rows.length === 0) throw new Error('No rows found in uploaded file.');

      const keys = Object.keys(rows[0] || {});
      const dateKey = findColumnKey(keys, ['date', 'feed_date', 'day']);
      const feedKey = findColumnKey(keys, ['feed_kg', 'feedkg', 'feed', 'feed_amount']);

      if (!dateKey || !feedKey) {
        throw new Error('Expected columns named date and feed_kg (or similar).');
      }

      const parsed = rows
        .map((row) => {
          const rawDate = row[dateKey];
          const rawFeed = row[feedKey];
          const dateValue = toDate(rawDate);
          const feedValue = typeof rawFeed === 'string' ? Number(rawFeed) : Number(rawFeed);
          if (!dateValue || Number.isNaN(feedValue)) return null;
          return {
            date: format(dateValue, 'yyyy-MM-dd'),
            feed_kg: feedValue,
          };
        })
        .filter((row): row is HistoricalPoint => row !== null);

      if (parsed.length === 0) {
        throw new Error('No valid rows found. Ensure date and feed_kg columns are filled.');
      }

      setHistoricalData(parsed);
      setUploadName(file.name);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Failed to parse uploaded file.');
      setHistoricalData([]);
      setUploadName(null);
    }
  };

  const handleDataSourceUpload = async (
    file: File | null,
    source: 'reports' | 'analysis',
  ) => {
    setDataSourceMessage((prev) => ({ ...prev, [source]: undefined }));
    if (!file) {
      if (source === 'reports') setReportUploadName(null);
      if (source === 'analysis') setAnalysisUploadName(null);
      return;
    }

    try {
      const records = await parseStructuredFile(file);
      if (records.length === 0) throw new Error('No rows found in uploaded file.');

      const extracted = extractFieldsFromRecords(records);
      const filledKeys = Object.entries(extracted)
        .filter(([, value]) => value !== null && value !== undefined)
        .map(([key]) => key);

      if (filledKeys.length === 0) {
        setDataSourceMessage((prev) => ({
          ...prev,
          [source]: 'No recognized fields found. Expected fields like start_date, initial_stock, dgr, fcr, survival_rate, or feed_rate_percent.',
        }));
      } else {
        setDataSourceMessage((prev) => ({
          ...prev,
          [source]: `Imported fields: ${filledKeys.join(', ')}`,
        }));
      }

      applyExtractedFields(extracted);
      if (source === 'reports') setReportUploadName(file.name);
      if (source === 'analysis') setAnalysisUploadName(file.name);
    } catch (error) {
      setDataSourceMessage((prev) => ({
        ...prev,
        [source]: error instanceof Error ? error.message : 'Failed to parse uploaded file.',
      }));
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 via-sky-50 to-amber-50">
        <CardHeader className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="text-2xl">Feeding Schedule Planner</CardTitle>
              <CardDescription className="text-sm">
                Model projections for {pondName} and validate against historical feed.
              </CardDescription>
            </div>
            <Badge className="bg-emerald-600 text-white">120-day cycle</Badge>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <div className="space-y-6">
          <Card className="border border-emerald-200">
            <CardHeader>
              <CardTitle className="text-base">Culture Setup</CardTitle>
              <CardDescription>Set the culture start date and project.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Culture Start Date</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Initial Stock Count</Label>
                <Input
                  type="number"
                  min={0}
                  value={initialStockValue ?? ''}
                  onChange={handleNumericInput(setInitialStockValue)}
                  placeholder="Enter stocked shrimp count"
                />
              </div>
              <div className="space-y-2">
                <Label>Project</Label>
                <Select value={project} onValueChange={setProject} disabled={projectsLoading || projects.length === 0}>
                  <SelectTrigger>
                    <SelectValue placeholder={projectsLoading ? 'Loading projects...' : 'Choose a project'} />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!projectsLoading && projects.length === 0 && (
                  <p className="text-xs text-muted-foreground">No projects found in the database.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border border-sky-200">
            <CardHeader>
              <CardTitle className="text-base">Historical Feed Upload</CardTitle>
              <CardDescription>Optional upload with date + feed_kg.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 rounded-lg border border-dashed border-sky-300 bg-sky-50 px-3 py-4">
                <Upload className="h-5 w-5 text-sky-600" />
                <div className="flex-1 text-sm">
                  <p className="font-medium">Drag & drop or select a file</p>
                  <p className="text-xs text-muted-foreground">CSV, XLSX, XLS</p>
                </div>
                <Input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={(event) => handleFileUpload(event.target.files?.[0] ?? null)}
                />
              </div>
              {uploadName && (
                <Badge className="bg-sky-600 text-white">{uploadName}</Badge>
              )}
              {uploadError && (
                <Alert variant="destructive">
                  <AlertDescription>{uploadError}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <Card className="border border-slate-200">
            <CardHeader>
              <CardTitle className="text-base">Project Data Sources</CardTitle>
              <CardDescription>Upload reports or image analysis data to fill missing fields.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label>Reports Data (CSV/XLSX/JSON)</Label>
                <Input
                  type="file"
                  accept=".csv,.xlsx,.xls,.json"
                  onChange={(event) => handleDataSourceUpload(event.target.files?.[0] ?? null, 'reports')}
                />
                {reportUploadName && (
                  <Badge className="bg-slate-700 text-white">{reportUploadName}</Badge>
                )}
                {dataSourceMessage.reports && (
                  <Alert variant={dataSourceMessage.reports.startsWith('Imported') ? 'default' : 'destructive'}>
                    <AlertDescription>{dataSourceMessage.reports}</AlertDescription>
                  </Alert>
                )}
              </div>
              <div className="space-y-3">
                <Label>Image Analysis Data (CSV/XLSX/JSON)</Label>
                <Input
                  type="file"
                  accept=".csv,.xlsx,.xls,.json"
                  onChange={(event) => handleDataSourceUpload(event.target.files?.[0] ?? null, 'analysis')}
                />
                {analysisUploadName && (
                  <Badge className="bg-slate-700 text-white">{analysisUploadName}</Badge>
                )}
                {dataSourceMessage.analysis && (
                  <Alert variant={dataSourceMessage.analysis.startsWith('Imported') ? 'default' : 'destructive'}>
                    <AlertDescription>{dataSourceMessage.analysis}</AlertDescription>
                  </Alert>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Recognized fields include: start_date, initial_stock, initial_weight_g, max_weight_g, dgr, fcr, survival_rate, feed_rate_percent.
              </p>
            </CardContent>
          </Card>

          <Card className="border border-amber-200">
            <CardHeader>
              <CardTitle className="text-base">Model Controls</CardTitle>
              <CardDescription>Enter biology inputs and adjust with sliders.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label>Initial Weight (g)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={initialWeight ?? ''}
                    onChange={handleNumericInput(setInitialWeight)}
                    placeholder="Enter post-larvae weight"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Target/Harvest Weight (g)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={maxWeight ?? ''}
                    onChange={handleNumericInput(setMaxWeight)}
                    placeholder="Enter target harvest weight"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Feeding Rate (% Biomass)</Label>
                    <Badge className="bg-amber-100 text-amber-900">{formatMaybe(feedRatePercent, 1, '%')}</Badge>
                  </div>
                  <Input
                    type="number"
                    min={0}
                    value={feedRatePercent ?? ''}
                    onChange={handleNumericInput(setFeedRatePercent)}
                    placeholder="Enter daily feeding rate"
                  />
                  <Slider
                    value={[feedRatePercent ?? 1]}
                    min={0.5}
                    max={10}
                    step={0.1}
                    onValueChange={(value) => setFeedRatePercent(value[0])}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Daily Growth Rate (%)</Label>
                    <Badge className="bg-amber-100 text-amber-900">{formatMaybe(dgr, 2, '%')}</Badge>
                  </div>
                  <Input
                    type="number"
                    min={0}
                    value={dgr ?? ''}
                    onChange={handleNumericInput(setDgr)}
                    placeholder="Enter daily growth rate"
                  />
                  <Slider value={[dgr ?? 0.5]} min={0.5} max={5} step={0.05} onValueChange={(value) => setDgr(value[0])} />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Feed Conversion Ratio</Label>
                    <Badge className="bg-amber-100 text-amber-900">{formatMaybe(fcr, 2)}</Badge>
                  </div>
                  <Input
                    type="number"
                    min={0}
                    value={fcr ?? ''}
                    onChange={handleNumericInput(setFcr)}
                    placeholder="Enter target FCR"
                  />
                  <Slider value={[fcr ?? 0.8]} min={0.8} max={3} step={0.05} onValueChange={(value) => setFcr(value[0])} />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Survival Rate (%)</Label>
                    <Badge className="bg-amber-100 text-amber-900">{formatMaybe(survival, 0, '%')}</Badge>
                  </div>
                  <Input
                    type="number"
                    min={0}
                    value={survival ?? ''}
                    onChange={handleNumericInput(setSurvival)}
                    placeholder="Enter expected survival rate"
                  />
                  <Slider value={[survival ?? 50]} min={50} max={100} step={1} onValueChange={(value) => setSurvival(value[0])} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {!isReady && (
            <Card className="border border-rose-200 bg-rose-50">
              <CardHeader>
                <CardTitle className="text-base">Required data missing</CardTitle>
                <CardDescription>Add the following inputs or upload files that contain them.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {missingFields.map((field) => (
                  <div key={field.key} className="text-sm text-rose-900">
                    - {field.label}
                  </div>
                ))}
                {validationIssues.map((issue) => (
                  <div key={issue.key} className="text-sm text-rose-900">
                    - {issue.label}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
          <Card className="border border-slate-200">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-600" />
                Projected vs Historical Feed
              </CardTitle>
              <CardDescription>Line = model projection • Points = uploaded feed data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[360px] w-full">
                {isReady ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={projection} margin={{ top: 10, right: 24, left: 0, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="4 4" stroke="#d9e2ec" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(value) => {
                          const parsed = parseISO(String(value));
                          return isValid(parsed) ? format(parsed, 'MMM d') : value;
                        }}
                        minTickGap={16}
                      />
                      <YAxis
                        tickFormatter={(value) => `${value} kg`}
                        width={72}
                      />
                      <Tooltip
                        formatter={(value: number) => [`${value.toFixed(2)} kg`, 'Feed']}
                        labelFormatter={(value) => {
                          const parsed = parseISO(String(value));
                          return isValid(parsed) ? format(parsed, 'MMM d, yyyy') : value;
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="feed_kg"
                        name="Projected feed"
                        stroke="#0ea5e9"
                        strokeWidth={3}
                        dot={false}
                      />
                      {historicalData.length > 0 && (
                        <Scatter
                          data={historicalData}
                          name="Historical feed"
                          fill="#f97316"
                          line={false}
                        />
                      )}
                    </ComposedChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    Add required inputs to generate the projection.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {metrics && (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Card className="kpi-card hover-lift border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50 animate-fade-up">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <Sparkles className="h-4 w-4 text-emerald-600" />
                    </div>
                  </div>
                  <p className="text-xs text-emerald-700 font-medium">Avg Daily Feed</p>
                  <p className="text-2xl font-bold text-emerald-900 animate-counter-up">{metrics.avgFeed} kg</p>
                </CardContent>
              </Card>
              <Card className="kpi-card hover-lift border-sky-200 bg-gradient-to-br from-sky-50 to-blue-50 animate-fade-up" style={{ animationDelay: '75ms' }}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center">
                      <Upload className="h-4 w-4 text-sky-600" />
                    </div>
                  </div>
                  <p className="text-xs text-sky-700 font-medium">Total Feed (120d)</p>
                  <p className="text-2xl font-bold text-sky-900 animate-counter-up">{metrics.totalFeed} kg</p>
                </CardContent>
              </Card>
              <Card className="kpi-card hover-lift border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50 animate-fade-up" style={{ animationDelay: '150ms' }}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                    </div>
                  </div>
                  <p className="text-xs text-amber-700 font-medium">Final Weight</p>
                  <p className="text-2xl font-bold text-amber-900 animate-counter-up">{metrics.finalWeight} g</p>
                </CardContent>
              </Card>
              <Card className="kpi-card hover-lift border-slate-200 bg-gradient-to-br from-slate-50 to-gray-50 animate-fade-up" style={{ animationDelay: '225ms' }}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                      <Sparkles className="h-4 w-4 text-slate-600" />
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 font-medium">Final Biomass</p>
                  <p className="text-2xl font-bold text-slate-900 animate-counter-up">{metrics.finalBiomass} kg</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Growth Trajectory & Biomass Charts */}
          {isReady && projection.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2">
              {/* Weight Growth Trajectory */}
              <Card className="border border-slate-200 hover-lift">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    Weight Growth Trajectory
                  </CardTitle>
                  <CardDescription className="text-xs">Projected average shrimp weight over {CULTURE_DAYS} days</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[240px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={projection.filter((_, i) => i % 3 === 0)} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                        <defs>
                          <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.25}/>
                            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.02}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" />
                        <XAxis
                          dataKey="date"
                          tickFormatter={(value) => {
                            const parsed = parseISO(String(value));
                            return isValid(parsed) ? format(parsed, 'MMM d') : value;
                          }}
                          tick={{ fontSize: 10 }}
                          minTickGap={20}
                        />
                        <YAxis tickFormatter={(v) => `${v.toFixed(0)}g`} width={45} tick={{ fontSize: 10 }} />
                        <Tooltip
                          formatter={(v: number) => [`${v.toFixed(2)}g`, 'Weight']}
                          labelFormatter={(value) => {
                            const parsed = parseISO(String(value));
                            return isValid(parsed) ? format(parsed, 'MMM d, yyyy') : value;
                          }}
                        />
                        <Line type="monotone" dataKey="weight_g" fill="url(#weightGradient)" stroke="#06b6d4" strokeWidth={2.5} dot={false} name="Avg Weight (g)" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Biomass Buildup */}
              <Card className="border border-slate-200 hover-lift">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    Biomass Buildup
                  </CardTitle>
                  <CardDescription className="text-xs">Total pond biomass progression over culture cycle</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[240px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={projection.filter((_, i) => i % 3 === 0)} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                        <defs>
                          <linearGradient id="biomassGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.02}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" />
                        <XAxis
                          dataKey="date"
                          tickFormatter={(value) => {
                            const parsed = parseISO(String(value));
                            return isValid(parsed) ? format(parsed, 'MMM d') : value;
                          }}
                          tick={{ fontSize: 10 }}
                          minTickGap={20}
                        />
                        <YAxis tickFormatter={(v) => `${v.toFixed(0)}kg`} width={50} tick={{ fontSize: 10 }} />
                        <Tooltip
                          formatter={(v: number) => [`${v.toFixed(1)} kg`, 'Biomass']}
                          labelFormatter={(value) => {
                            const parsed = parseISO(String(value));
                            return isValid(parsed) ? format(parsed, 'MMM d, yyyy') : value;
                          }}
                        />
                        <Line type="monotone" dataKey="biomass_kg" fill="url(#biomassGradient)" stroke="#10b981" strokeWidth={2.5} dot={false} name="Biomass (kg)" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <Alert className="border-amber-200 bg-amber-50">
            <AlertDescription>
              Projections use user-entered inputs and uploaded data sources. Adjust parameters or upload files to refine the model. Visit the <strong>Harvest</strong> tab for profit optimization.
            </AlertDescription>
          </Alert>
        </div>
      </div>

      {/* Initial Setup Dialog - Similar to Pond Creation */}
      <Dialog open={showSetupDialog} onOpenChange={setShowSetupDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Feed Chart Setup</DialogTitle>
            <DialogDescription>
              Culture start date is not today ({format(new Date(), 'MMM dd, yyyy')}). Please confirm your feed chart parameters for day {dayOfCulture} of culture.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Current Day of Culture */}
            <div className="rounded-lg bg-sky-50 border border-sky-200 p-4">
              <p className="text-xs text-sky-700 mb-1">Current Day of Culture</p>
              <p className="text-3xl font-bold text-sky-900">{dayOfCulture}</p>
              <p className="text-xs text-sky-600 mt-2">
                Seeded: {startDate && isValid(parseISO(startDate)) ? format(parseISO(startDate), 'MMM dd, yyyy') : 'N/A'} • Culture start date will be used for projections
              </p>
            </div>

            {/* Key Parameters Summary */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded bg-slate-100 p-2">
                <p className="text-muted-foreground">Initial Stock</p>
                <p className="font-semibold">
                  {initialStockValue ? `${(initialStockValue / 1000).toFixed(1)}K` : '--'}
                </p>
              </div>
              <div className="rounded bg-slate-100 p-2">
                <p className="text-muted-foreground">Initial Weight</p>
                <p className="font-semibold">{initialWeight ? `${initialWeight}g` : '--'}</p>
              </div>
              <div className="rounded bg-slate-100 p-2">
                <p className="text-muted-foreground">FCR</p>
                <p className="font-semibold">{fcr ? fcr.toFixed(2) : '--'}</p>
              </div>
              <div className="rounded bg-slate-100 p-2">
                <p className="text-muted-foreground">Survival</p>
                <p className="font-semibold">{survival ? `${survival.toFixed(0)}%` : '--'}</p>
              </div>
            </div>

            {/* Alert about missing data */}
            {missingFields.length > 0 && (
              <Alert className="border-amber-200 bg-amber-50">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="ml-2 text-xs text-amber-900">
                  <p className="font-semibold mb-1">Missing fields:</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    {missingFields.slice(0, 3).map((field) => (
                      <li key={field.key}>{field.label}</li>
                    ))}
                    {missingFields.length > 3 && (
                      <li>+ {missingFields.length - 3} more</li>
                    )}
                  </ul>
                  <p className="mt-2">Upload files or enter values to complete the model.</p>
                </AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowSetupDialog(false)}
              >
                Edit Parameters
              </Button>
              <Button
                className="flex-1 bg-sky-600 hover:bg-sky-700"
                onClick={handleSetupComplete}
              >
                Proceed ({dayOfCulture > 0 ? `Day ${dayOfCulture}` : 'Today'})
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Day of Culture Display (floating indicator) */}
      {dayOfCulture > 0 && (
        <div className="fixed bottom-6 right-6 rounded-full bg-gradient-to-br from-sky-500 to-sky-600 text-white p-4 shadow-lg flex items-center justify-center w-16 h-16">
          <div className="text-center">
            <p className="text-xs font-semibold opacity-90">Day</p>
            <p className="text-xl font-bold">{dayOfCulture}</p>
          </div>
        </div>
      )}
    </div>
  );
}
