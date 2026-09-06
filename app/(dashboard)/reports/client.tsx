"use client";

import * as React from "react";
import { format, subDays, startOfYear, endOfYear } from "date-fns";
import {
  PageSearch,
  Download,
  Calendar,
  Filter,
  Spark,
  CheckCircle,
  Table,
} from "iconoir-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface Account {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
}

interface ReportsClientProps {
  accounts: Account[];
  categories: Category[];
  transactionCount: number;
  currency: string;
}

export function ReportsClient({
  accounts,
  categories,
  transactionCount,
  currency,
}: ReportsClientProps) {
  const [datePreset, setDatePreset] = React.useState("ALL");
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [selectedAccount, setSelectedAccount] = React.useState("ALL");
  const [selectedType, setSelectedType] = React.useState("ALL");
  const [isExporting, setIsExporting] = React.useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      if (selectedAccount !== "ALL") params.append("accountId", selectedAccount);
      if (selectedType !== "ALL") params.append("type", selectedType);

      const url = `/api/v1/transactions/export?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to generate report");

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `financial-report-${format(new Date(), "yyyy-MM-dd")}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err: any) {
      alert(err.message || "Failed to export report");
    } finally {
      setIsExporting(false);
    }
  };

  const handlePresetChange = (preset: string) => {
    setDatePreset(preset);
    const now = new Date();
    if (preset === "30_DAYS") {
      setStartDate(format(subDays(now, 30), "yyyy-MM-dd"));
      setEndDate(format(now, "yyyy-MM-dd"));
    } else if (preset === "THIS_YEAR") {
      setStartDate(format(startOfYear(now), "yyyy-MM-dd"));
      setEndDate(format(endOfYear(now), "yyyy-MM-dd"));
    } else if (preset === "ALL") {
      setStartDate("");
      setEndDate("");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          Financial Reports & Statements
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Export structured CSV reports with custom filters for tax preparation and auditing.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Export Form */}
        <Card className="lg:col-span-2 bg-card/40 backdrop-blur-xl border-border/40 rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
              <PageSearch className="w-5 h-5 text-primary" />
              Custom Report Generator
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Select date ranges and filters to generate a customized transaction statement.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            {/* Range Presets */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Date Range</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant={datePreset === "ALL" ? "default" : "outline"}
                  onClick={() => handlePresetChange("ALL")}
                  className="rounded-xl text-xs h-9"
                >
                  All Time
                </Button>
                <Button
                  type="button"
                  variant={datePreset === "THIS_YEAR" ? "default" : "outline"}
                  onClick={() => handlePresetChange("THIS_YEAR")}
                  className="rounded-xl text-xs h-9"
                >
                  This Year
                </Button>
                <Button
                  type="button"
                  variant={datePreset === "30_DAYS" ? "default" : "outline"}
                  onClick={() => handlePresetChange("30_DAYS")}
                  className="rounded-xl text-xs h-9"
                >
                  Last 30 Days
                </Button>
              </div>
            </div>

            {/* Custom Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">From Date</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setDatePreset("CUSTOM");
                    setStartDate(e.target.value);
                  }}
                  className="bg-background/50 border-input/60 rounded-xl text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">To Date</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setDatePreset("CUSTOM");
                    setEndDate(e.target.value);
                  }}
                  className="bg-background/50 border-input/60 rounded-xl text-xs"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Account Filter</Label>
                <Select value={selectedAccount} onValueChange={(val) => setSelectedAccount(val ?? "ALL")}>
                  <SelectTrigger className="bg-background/50 border-input/60 rounded-xl text-xs">
                    <SelectValue placeholder="All Accounts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Accounts</SelectItem>
                    {accounts.map((acc) => (
                      <SelectItem key={acc.id} value={acc.id}>
                        {acc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Transaction Type</Label>
                <Select value={selectedType} onValueChange={(val) => setSelectedType(val ?? "ALL")}>
                  <SelectTrigger className="bg-background/50 border-input/60 rounded-xl text-xs">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Types</SelectItem>
                    <SelectItem value="EXPENSE">Expense Only</SelectItem>
                    <SelectItem value="INCOME">Income Only</SelectItem>
                    <SelectItem value="TRANSFER">Transfer Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              onClick={handleExport}
              disabled={isExporting}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 rounded-xl h-11 text-xs sm:text-sm font-medium cursor-pointer"
            >
              {isExporting ? (
                <>
                  <Spark className="w-4 h-4 animate-spin mr-2" />
                  Generating Statement...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Download CSV Statement
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Info card */}
        <div className="space-y-4">
          <Card className="bg-card/40 backdrop-blur-xl border-border/40 rounded-2xl shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Spark className="w-4 h-4 text-primary" />
                Statement Features
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-muted-foreground">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Compatible with Excel, Apple Numbers, and Google Sheets</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Includes category tags, account details, and recurring flags</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Clean formatting with date timestamps and net cash flow</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/40 backdrop-blur-xl border-border/40 rounded-2xl shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Table className="w-4 h-4 text-primary" />
                Database Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-border/20">
                <span className="text-muted-foreground">Total Transactions</span>
                <span className="font-semibold text-foreground">{transactionCount}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/20">
                <span className="text-muted-foreground">Active Accounts</span>
                <span className="font-semibold text-foreground">{accounts.length}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Categories</span>
                <span className="font-semibold text-foreground">{categories.length}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
