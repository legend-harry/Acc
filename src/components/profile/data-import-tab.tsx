"use client";

import { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { createClient } from "@/lib/supabase/client";
import { useClient } from "@/context/client-context";
import { useUser } from "@/context/user-context";
import { useProjects } from "@/hooks/use-database";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, Upload, Database, AlertCircle, CheckCircle2 } from "lucide-react";

type ImportTarget = "transactions" | "budgets" | "projects" | "employees";
type GenericRow = Record<string, unknown>;

type ParseResult = {
  rows: GenericRow[];
  headers: string[];
};

type ImportSummary = {
  inserted: number;
  skipped: number;
  skippedReasons: string[];
};

const TARGET_META: Record<ImportTarget, { label: string; required: string[]; example: string }> = {
  transactions: {
    label: "Transactions",
    required: ["amount"],
    example: "amount, type(expense|income), category, date, description, projectid",
  },
  budgets: {
    label: "Budgets",
    required: ["category", "amount"],
    example: "category, amount, projectid",
  },
  projects: {
    label: "Projects",
    required: ["name"],
    example: "name",
  },
  employees: {
    label: "Employees",
    required: ["name"],
    example: "name, role, salary|wage, wage_type, project_ids",
  },
};

const normalizeKey = (key: string) => key.trim().toLowerCase().replace(/[\s-]+/g, "_");

const getValue = (row: GenericRow, keys: string[]) => {
  const normalizedEntries = Object.entries(row).map(([k, v]) => [normalizeKey(k), v] as const);
  for (const key of keys) {
    const found = normalizedEntries.find(([k]) => k === key);
    if (found && found[1] !== "" && found[1] !== null && found[1] !== undefined) {
      return found[1];
    }
  }
  return undefined;
};

const toNumber = (value: unknown) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const numeric = Number(value.replace(/,/g, "").trim());
    return Number.isFinite(numeric) ? numeric : null;
  }
  return null;
};

const toIsoDate = (value: unknown) => {
  if (!value) return new Date().toISOString();

  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed) {
      const date = new Date(parsed.y, (parsed.m || 1) - 1, parsed.d || 1);
      if (!Number.isNaN(date.getTime())) return date.toISOString();
    }
  }

  if (typeof value === "string") {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date.toISOString();
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }

  return new Date().toISOString();
};

const parseProjectIds = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map((v) => String(v).trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(/[;,|]/)
      .map((v) => v.trim())
      .filter(Boolean);
  }
  return [];
};

const parseStructuredFile = async (file: File): Promise<ParseResult> => {
  if (file.name.toLowerCase().endsWith(".json")) {
    const text = await file.text();
    const parsed = JSON.parse(text);

    if (Array.isArray(parsed)) {
      const headers = parsed.length > 0 ? Object.keys(parsed[0] || {}) : [];
      return { rows: parsed as GenericRow[], headers };
    }

    if (parsed && typeof parsed === "object") {
      const maybeData = (parsed as Record<string, unknown>).data;
      if (Array.isArray(maybeData)) {
        const headers = maybeData.length > 0 ? Object.keys((maybeData[0] as GenericRow) || {}) : [];
        return { rows: maybeData as GenericRow[], headers };
      }
      return { rows: [parsed as GenericRow], headers: Object.keys(parsed as GenericRow) };
    }

    throw new Error("JSON must be an object or array of objects.");
  }

  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error("No sheets found in file.");
  }

  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<GenericRow>(sheet, { defval: "" });
  const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
  return { rows, headers };
};

const chunk = <T,>(arr: T[], size: number) => {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
};

export function DataImportTab() {
  const { toast } = useToast();
  const supabase = createClient();
  const { clientId } = useClient();
  const { selectedProfile } = useUser();
  const { projects } = useProjects();

  const [target, setTarget] = useState<ImportTarget>("transactions");
  const [defaultProjectId, setDefaultProjectId] = useState<string>("none");
  const [fileName, setFileName] = useState<string>("");
  const [parsedRows, setParsedRows] = useState<GenericRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string>("");
  const [summary, setSummary] = useState<ImportSummary | null>(null);

  const previewRows = useMemo(() => parsedRows.slice(0, 5), [parsedRows]);

  const handleFileChange = async (file: File | null) => {
    setSummary(null);
    setError("");
    setParsedRows([]);
    setHeaders([]);
    setFileName("");

    if (!file) return;

    setIsParsing(true);
    try {
      const { rows, headers: detectedHeaders } = await parseStructuredFile(file);
      setParsedRows(rows);
      setHeaders(detectedHeaders);
      setFileName(file.name);

      if (rows.length === 0) {
        setError("No rows found in the uploaded file.");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to parse file.";
      setError(msg);
    } finally {
      setIsParsing(false);
    }
  };

  const transformRows = (): { records: GenericRow[]; skipped: string[] } => {
    const records: GenericRow[] = [];
    const skipped: string[] = [];

    parsedRows.forEach((row, index) => {
      try {
        if (target === "transactions") {
          const amount = toNumber(getValue(row, ["amount", "total", "value"]));
          if (amount === null || amount <= 0) {
            skipped.push(`Row ${index + 2}: missing/invalid amount`);
            return;
          }

          const rawType = String(getValue(row, ["type", "transaction_type"]) || "expense").toLowerCase();
          const type = rawType === "income" ? "income" : "expense";

          const category = String(getValue(row, ["category", "head", "group"]) || (type === "income" ? "Income" : "Uncategorized"));
          const description = String(getValue(row, ["description", "title", "notes", "remark"]) || "Imported transaction");
          const date = toIsoDate(getValue(row, ["date", "transaction_date", "created_at"]));
          const projectid = String(getValue(row, ["projectid", "project_id", "projectid", "project"]) || "").trim() ||
            (defaultProjectId !== "none" ? defaultProjectId : "");

          records.push({
            client_id: clientId,
            profile_id: selectedProfile,
            amount,
            type,
            category,
            date,
            description,
            title: description.slice(0, 60),
            projectid,
          });
          return;
        }

        if (target === "budgets") {
          const category = String(getValue(row, ["category", "name", "head"]) || "").trim();
          const amount = toNumber(getValue(row, ["amount", "budget", "limit", "budget_amount"]));
          if (!category || amount === null) {
            skipped.push(`Row ${index + 2}: missing category/amount`);
            return;
          }

          const projectid = String(getValue(row, ["projectid", "project_id", "project"]) || "").trim() ||
            (defaultProjectId !== "none" ? defaultProjectId : "");

          records.push({
            client_id: clientId,
            profile_id: selectedProfile,
            category,
            amount,
            projectid,
          });
          return;
        }

        if (target === "projects") {
          const name = String(getValue(row, ["name", "project", "project_name", "title"]) || "").trim();
          if (!name) {
            skipped.push(`Row ${index + 2}: missing project name`);
            return;
          }

          records.push({
            client_id: clientId,
            profile_id: selectedProfile,
            name,
          });
          return;
        }

        if (target === "employees") {
          const name = String(getValue(row, ["name", "employee_name", "full_name"]) || "").trim();
          if (!name) {
            skipped.push(`Row ${index + 2}: missing employee name`);
            return;
          }

          const wage = toNumber(getValue(row, ["wage", "salary", "amount"])) ?? 0;
          const role = String(getValue(row, ["role", "designation", "title"]) || name);
          const wageTypeRaw = String(getValue(row, ["wage_type", "wagetype"]) || "daily").toLowerCase();
          const wageType = ["hourly", "daily", "monthly"].includes(wageTypeRaw) ? wageTypeRaw : "daily";
          const projectIds = parseProjectIds(getValue(row, ["project_ids", "projectids", "projects"]));

          records.push({
            client_id: clientId,
            profile_id: selectedProfile,
            name,
            role,
            salary: wage,
            wage,
            wage_type: wageType,
            project_ids: projectIds.length > 0 ? projectIds : defaultProjectId !== "none" ? [defaultProjectId] : [],
          });
        }
      } catch {
        skipped.push(`Row ${index + 2}: failed to transform`);
      }
    });

    return { records, skipped };
  };

  const handleImport = async () => {
    setError("");
    setSummary(null);

    if (!clientId || !selectedProfile) {
      setError("Missing client/profile context. Please sign in again.");
      return;
    }

    if (parsedRows.length === 0) {
      setError("Upload a file with at least one row before importing.");
      return;
    }

    const { records, skipped } = transformRows();
    if (records.length === 0) {
      setError("No valid rows found to import. Check column names and required fields.");
      setSummary({ inserted: 0, skipped: skipped.length, skippedReasons: skipped.slice(0, 12) });
      return;
    }

    setIsImporting(true);

    try {
      let inserted = 0;
      const batches = chunk(records, 200);

      for (const batch of batches) {
        const { error: insertError, data } = await supabase
          .from(target)
          .insert(batch)
          .select("id");

        if (insertError) {
          throw insertError;
        }

        inserted += data?.length ?? batch.length;
      }

      const resultSummary: ImportSummary = {
        inserted,
        skipped: skipped.length,
        skippedReasons: skipped.slice(0, 12),
      };

      setSummary(resultSummary);
      toast({
        title: "Import Completed",
        description: `Inserted ${inserted} row(s) into ${TARGET_META[target].label}.`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Import failed.";
      setError(msg);
      toast({
        variant: "destructive",
        title: "Import Failed",
        description: msg,
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Seed Existing Data
        </CardTitle>
        <CardDescription>
          Upload CSV, JSON, XLS, or XLSX files and import them into your database.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Target Table</Label>
            <Select value={target} onValueChange={(v) => setTarget(v as ImportTarget)}>
              <SelectTrigger>
                <SelectValue placeholder="Select destination" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="transactions">Transactions</SelectItem>
                <SelectItem value="budgets">Budgets</SelectItem>
                <SelectItem value="projects">Projects</SelectItem>
                <SelectItem value="employees">Employees</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Required: {TARGET_META[target].required.join(", ")}
            </p>
            <p className="text-xs text-muted-foreground">
              Example columns: {TARGET_META[target].example}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Default Project (optional)</Label>
            <Select value={defaultProjectId} onValueChange={setDefaultProjectId}>
              <SelectTrigger>
                <SelectValue placeholder="Use project from file" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No default project</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Used when a row does not include a project id.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Upload File</Label>
          <div className="flex items-center gap-3 rounded-lg border border-dashed p-3">
            <Upload className="h-4 w-4 text-muted-foreground" />
            <Input
              type="file"
              accept=".csv,.json,.xls,.xlsx"
              onChange={(event) => handleFileChange(event.target.files?.[0] ?? null)}
            />
          </div>
          {fileName && (
            <Badge variant="secondary">{fileName}</Badge>
          )}
        </div>

        {isParsing && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Parsing file...
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {summary && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              Inserted {summary.inserted} row(s), skipped {summary.skipped} row(s).
            </AlertDescription>
          </Alert>
        )}

        {summary?.skippedReasons && summary.skippedReasons.length > 0 && (
          <div className="rounded-md border p-3 space-y-1">
            <p className="text-sm font-medium">Skipped Row Details</p>
            {summary.skippedReasons.map((reason, idx) => (
              <p key={`${reason}-${idx}`} className="text-xs text-muted-foreground">{reason}</p>
            ))}
          </div>
        )}

        {headers.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Detected Columns</p>
            <div className="flex flex-wrap gap-2">
              {headers.slice(0, 24).map((header) => (
                <Badge key={header} variant="outline">{header}</Badge>
              ))}
            </div>
          </div>
        )}

        {previewRows.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Preview (first 5 rows)</p>
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-muted/60">
                    {headers.slice(0, 8).map((header) => (
                      <th key={header} className="px-2 py-2 text-left font-medium">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row, idx) => (
                    <tr key={`preview-${idx}`} className="border-t">
                      {headers.slice(0, 8).map((header) => (
                        <td key={`${idx}-${header}`} className="px-2 py-2 align-top">
                          {String(row[header] ?? "")}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <Button onClick={handleImport} disabled={isImporting || isParsing || parsedRows.length === 0} className="gap-2">
          {isImporting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Importing...
            </>
          ) : (
            <>
              <Database className="h-4 w-4" />
              Import into {TARGET_META[target].label}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
