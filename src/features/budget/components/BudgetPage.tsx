import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Landmark,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  LinkIcon,
  Unlink,
} from "lucide-react";
import { useBudgetStore } from "../store";
import { BUDGET_CATEGORIES, type BudgetCategory } from "../types";
import { startBankConnection, syncTransactions, disconnectBankFull } from "../sync";
import { formatCurrency, formatDate } from "@/lib/utils";

const fadeIn = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.04 } },
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function BudgetPage() {
  const {
    isConnected, isLoading, transactions, breakdown,
    selectedMonth, initialize, setMonth, loadTransactions,
    loadBreakdown, recategorise, budgetLimits, setBudgetLimit,
    uncategorisedCount, smartRecategorise,
  } = useBudgetStore();

  const [isSyncing, setIsSyncing] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [editingBudget, setEditingBudget] = useState<BudgetCategory | null>(null);
  const [budgetInput, setBudgetInput] = useState("");
  const budgetInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    initialize();
  }, [initialize]);

  async function handleConnect() {
    setIsConnecting(true);
    setStatus(null);
    try {
      const result = await startBankConnection();
      if (result.success) {
        setStatus({ type: "success", message: "Bank connected! Syncing transactions..." });
        await initialize();
        await handleSync();
      } else {
        setStatus({ type: "error", message: result.error ?? "Connection failed" });
      }
    } finally {
      setIsConnecting(false);
    }
  }

  async function handleSync() {
    setIsSyncing(true);
    try {
      const count = await syncTransactions(90);
      await loadTransactions();
      await loadBreakdown();
      setStatus({ type: "success", message: `Synced ${count} transactions` });
    } catch (err) {
      setStatus({ type: "error", message: err instanceof Error ? err.message : "Sync failed" });
    }
    setIsSyncing(false);
  }

  async function handleDisconnect() {
    await disconnectBankFull();
    await initialize();
    setStatus({ type: "success", message: "Bank disconnected" });
  }

  function prevMonth() {
    const m = selectedMonth.month === 1 ? 12 : selectedMonth.month - 1;
    const y = selectedMonth.month === 1 ? selectedMonth.year - 1 : selectedMonth.year;
    setMonth(y, m);
  }

  function nextMonth() {
    const m = selectedMonth.month === 12 ? 1 : selectedMonth.month + 1;
    const y = selectedMonth.month === 12 ? selectedMonth.year + 1 : selectedMonth.year;
    setMonth(y, m);
  }

  // Calculate totals — income sums are positive (credits), spending sums are negative (debits)
  const totalIncome = breakdown
    .filter((b) => b.category === "income")
    .reduce((s, b) => s + Math.abs(b.total), 0);
  const totalSpending = breakdown
    .filter((b) => b.category !== "income")
    .reduce((s, b) => s + Math.abs(b.total), 0);
  // Net flow uses raw signed sums so miscategorised refunds (credits in spending categories) reduce spending correctly
  const rawTotal = breakdown.reduce((s, b) => s + b.total, 0);
  const netFlow = rawTotal;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <motion.div className="space-y-8" variants={stagger} initial="initial" animate="animate">
      {/* Header */}
      <motion.div variants={fadeIn} className="flex items-end justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Budget</h1>
        </div>
        <div className="flex items-center gap-2">
          {isConnected ? (
            <>
              <Button variant="outline" size="sm" onClick={handleSync} disabled={isSyncing} className="gap-1.5">
                <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                {isSyncing ? "Syncing..." : "Sync"}
              </Button>
              <Button variant="ghost" size="sm" onClick={handleDisconnect} className="gap-1.5 text-destructive">
                <Unlink className="h-3.5 w-3.5" />
                Disconnect
              </Button>
            </>
          ) : (
            <Button size="sm" onClick={handleConnect} disabled={isConnecting} className="gap-1.5">
              <LinkIcon className="h-3.5 w-3.5" />
              {isConnecting ? "Connecting..." : "Connect Bank"}
            </Button>
          )}
        </div>
      </motion.div>

      {/* Status */}
      {status && (
        <motion.div variants={fadeIn} className={`rounded-xl border p-4 text-sm ${
          status.type === "success" ? "border-primary/20 bg-primary/5 text-primary" : "border-destructive/20 bg-destructive/5 text-destructive"
        }`}>
          {status.message}
        </motion.div>
      )}

      {!isConnected ? (
        /* Not connected state */
        <motion.div variants={fadeIn} className="card-elevated rounded-lg py-20 text-center space-y-4">
          <Landmark className="h-12 w-12 text-muted-foreground/30 mx-auto" />
          <div>
            <p className="font-semibold text-lg">Connect your bank account</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
              Link your debit account via TrueLayer to automatically import transactions.
              Your data stays on this device — nothing is sent to any server.
            </p>
          </div>
          <Button onClick={handleConnect} disabled={isConnecting} className="gap-2">
            <LinkIcon className="h-4 w-4" />
            {isConnecting ? "Opening bank login..." : "Connect Bank Account"}
          </Button>
        </motion.div>
      ) : (
        <>
          {/* Month selector */}
          <motion.div variants={fadeIn} className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={prevMonth} className="h-8 w-8">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-semibold">
              {MONTHS[selectedMonth.month - 1]} {selectedMonth.year}
            </span>
            <Button variant="ghost" size="icon" onClick={nextMonth} className="h-8 w-8">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </motion.div>

          {/* Summary cards */}
          <motion.div variants={fadeIn} className="grid grid-cols-3 gap-4">
            <div className="card-hero rounded-lg p-5 space-y-1">
              <p className="text-[10px] text-primary/60 uppercase tracking-widest font-semibold">Income</p>
              <p className="text-2xl font-bold font-mono tabular-nums text-positive">{formatCurrency(totalIncome)}</p>
            </div>
            <div className="card-elevated rounded-lg p-5 space-y-1">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Spending</p>
              <p className="text-2xl font-bold font-mono tabular-nums">{formatCurrency(totalSpending)}</p>
            </div>
            <div className="card-elevated rounded-lg p-5 space-y-1">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Net</p>
              <p className={`text-2xl font-bold font-mono tabular-nums ${netFlow >= 0 ? "text-positive" : "text-destructive"}`}>
                {netFlow >= 0 ? "+" : ""}{formatCurrency(netFlow)}
              </p>
            </div>
          </motion.div>

          {/* Uncategorised banner */}
          {uncategorisedCount > 0 && (
            <motion.div variants={fadeIn} className="flex items-center justify-between rounded-xl border border-amber-500/20 bg-amber-500/5 px-5 py-3">
              <div>
                <p className="text-sm font-semibold text-amber-400">{uncategorisedCount} uncategorised transactions</p>
                <p className="text-xs text-muted-foreground">Click the bell in the sidebar to review them</p>
              </div>
              <Button variant="outline" size="sm" className="text-xs gap-1.5 border-amber-500/30" onClick={async () => {
                const count = await smartRecategorise();
                setStatus({ type: "success", message: `Auto-categorised ${count} transactions` });
              }}>
                Auto-categorise
              </Button>
            </motion.div>
          )}

          {/* Category breakdown with budget limits */}
          <motion.div variants={fadeIn} className="card-elevated rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Spending by Category</h3>
              <p className="text-[10px] text-muted-foreground">Click a bar to set a budget limit</p>
            </div>
            <div className="space-y-4">
              {BUDGET_CATEGORIES.filter((c) => c.value !== "uncategorised" && c.value !== "income").map((cat) => {
                const data = breakdown.find((b) => b.category === cat.value);
                const total = data ? Math.abs(data.total) : 0;
                const count = data?.count ?? 0;
                const limit = budgetLimits.find((l) => l.category === cat.value)?.monthly_limit ?? 0;
                const percentOfLimit = limit > 0 ? (total / limit) * 100 : 0;
                const overBudget = limit > 0 && total > limit;

                return (
                  <div key={cat.value} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className={`font-medium ${cat.color}`}>{cat.label}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">{count} txns</span>
                        <span className={`font-mono tabular-nums font-semibold ${overBudget ? "text-destructive" : ""}`}>
                          {formatCurrency(total)}
                        </span>
                        {limit > 0 && (
                          <span className="text-[10px] text-muted-foreground font-mono">
                            / {formatCurrency(limit)}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      className="w-full h-2 bg-white/5 rounded-full overflow-hidden cursor-pointer hover:bg-white/10 transition-colors"
                      onClick={() => {
                        setEditingBudget(cat.value);
                        setBudgetInput(limit > 0 ? String(limit) : "");
                        setTimeout(() => budgetInputRef.current?.focus(), 50);
                      }}
                    >
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          overBudget ? "bg-destructive/70" : limit > 0 ? "bg-primary/50" : "bg-primary/30"
                        }`}
                        style={{ width: `${limit > 0 ? Math.min(percentOfLimit, 100) : Math.min((total / Math.max(...breakdown.filter(b => b.category !== "income").map((b) => Math.abs(b.total)), 1)) * 100, 100)}%` }}
                      />
                    </button>
                    {editingBudget === cat.value && (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground">£</span>
                        <input
                          ref={budgetInputRef}
                          type="number"
                          step="10"
                          min="0"
                          className="w-24 h-6 bg-background/80 border border-border/50 rounded px-2 text-xs font-mono focus:outline-none focus:border-primary"
                          value={budgetInput}
                          onChange={(e) => setBudgetInput(e.target.value)}
                          onBlur={async () => {
                            const val = parseFloat(budgetInput);
                            if (!isNaN(val) && val >= 0) {
                              await setBudgetLimit(cat.value, val);
                            }
                            setEditingBudget(null);
                          }}
                          onKeyDown={async (e) => {
                            if (e.key === "Enter") {
                              const val = parseFloat(budgetInput);
                              if (!isNaN(val) && val >= 0) {
                                await setBudgetLimit(cat.value, val);
                              }
                              setEditingBudget(null);
                            } else if (e.key === "Escape") {
                              setEditingBudget(null);
                            }
                          }}
                        />
                        <span className="text-[10px] text-muted-foreground">/ month</span>
                      </div>
                    )}
                    {overBudget && editingBudget !== cat.value && (
                      <p className="text-[10px] text-destructive">
                        {formatCurrency(total - limit)} over budget
                      </p>
                    )}
                  </div>
                );
              })}

              {/* Income row */}
              {(() => {
                const incomeData = breakdown.find((b) => b.category === "income");
                const incomeTotal = incomeData ? Math.abs(incomeData.total) : 0;
                return incomeTotal > 0 ? (
                  <>
                    <Separator className="bg-border/30" />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-positive font-medium">Income</span>
                      <span className="font-mono tabular-nums font-semibold text-positive">{formatCurrency(incomeTotal)}</span>
                    </div>
                  </>
                ) : null;
              })()}

              {/* Uncategorised */}
              {uncategorisedCount > 0 && (
                <>
                  <Separator className="bg-border/30" />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-amber-400">Uncategorised</span>
                    <span className="font-mono tabular-nums text-amber-400">
                      {formatCurrency(Math.abs(breakdown.find((b) => b.category === "uncategorised")?.total ?? 0))}
                    </span>
                  </div>
                </>
              )}
            </div>
          </motion.div>

          {/* Transaction list */}
          <motion.div variants={fadeIn} className="card-elevated rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-border/20">
              <h3 className="text-sm font-semibold">Transactions</h3>
              <p className="text-xs text-muted-foreground">{transactions.length} transactions this month</p>
            </div>
            {transactions.length === 0 ? (
              <div className="px-6 py-12 text-center text-muted-foreground text-sm">
                No transactions for this month. Try syncing or changing the month.
              </div>
            ) : (
              <div className="divide-y divide-border/10">
                {transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between px-6 py-3">
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">
                          {tx.merchant_name ?? tx.description}
                        </span>
                        <Select
                          value={tx.budget_category}
                          onValueChange={(v) => recategorise(tx, v as BudgetCategory)}
                        >
                          <SelectTrigger className="h-5 w-auto gap-1 border-0 bg-transparent p-0 text-[10px] text-muted-foreground hover:text-foreground">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {BUDGET_CATEGORIES.map((cat) => (
                              <SelectItem key={cat.value} value={cat.value} className="text-xs">
                                {cat.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate">{tx.description}</p>
                    </div>
                    <div className="text-right ml-4">
                      <p className={`font-mono tabular-nums font-semibold text-sm ${
                        tx.transaction_type === "CREDIT" ? "text-positive" : ""
                      }`}>
                        {tx.transaction_type === "CREDIT" ? "+" : "-"}{formatCurrency(Math.abs(tx.amount))}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-mono">{formatDate(tx.transaction_date)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </>
      )}
    </motion.div>
  );
}
