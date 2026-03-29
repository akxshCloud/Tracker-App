import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Bell, Check, ChevronRight } from "lucide-react";
import { useBudgetStore } from "../store";
import { BUDGET_CATEGORIES, type BudgetCategory } from "../types";
import { formatCurrency, formatDate } from "@/lib/utils";

export function ReviewBell() {
  const uncategorisedCount = useBudgetStore((s) => s.uncategorisedCount);
  const [open, setOpen] = useState(false);

  if (uncategorisedCount === 0) return null;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="relative flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors">
          <Bell className="h-4 w-4 shrink-0" />
          <span>Review</span>
          <span className="ml-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-white px-1">
            {uncategorisedCount > 99 ? "99+" : uncategorisedCount}
          </span>
        </button>
      </SheetTrigger>
      <SheetContent className="w-[420px] sm:w-[420px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Review Transactions</SheetTitle>
          <p className="text-xs text-muted-foreground">
            {uncategorisedCount} transactions need categorising
          </p>
        </SheetHeader>
        <ReviewList onDone={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}

function ReviewList({ onDone }: { onDone: () => void }) {
  const { transactions, recategorise, smartRecategorise } = useBudgetStore();
  const uncategorised = transactions.filter((t) => t.budget_category === "uncategorised");
  const [currentIndex, setCurrentIndex] = useState(0);

  if (uncategorised.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-3">
        <Check className="h-10 w-10 text-positive" />
        <p className="font-semibold">All caught up!</p>
        <p className="text-xs text-muted-foreground">No uncategorised transactions.</p>
        <Button size="sm" onClick={onDone}>Close</Button>
      </div>
    );
  }

  const tx = uncategorised[currentIndex];
  if (!tx) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-3">
        <Check className="h-10 w-10 text-positive" />
        <p className="font-semibold">All done!</p>
        <Button size="sm" onClick={onDone}>Close</Button>
      </div>
    );
  }

  async function handleCategorise(category: BudgetCategory) {
    await recategorise(tx, category);
    // After categorisation, the uncategorised array shrinks by 1.
    // Clamp the index so we don't skip the next item.
    setCurrentIndex((i) => Math.min(i, Math.max(0, uncategorised.length - 2)));
  }

  return (
    <div className="space-y-6 pt-4">
      {/* Progress */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{currentIndex + 1} of {uncategorised.length}</span>
        <Button variant="ghost" size="sm" className="text-xs h-7" onClick={async () => {
          const count = await smartRecategorise();
          if (count > 0) setCurrentIndex(0);
        }}>
          Auto-categorise remaining
        </Button>
      </div>

      {/* Transaction card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tx.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="card-elevated rounded-xl p-5 space-y-3"
        >
          <div className="space-y-1">
            <p className="font-semibold text-sm">{tx.merchant_name ?? tx.description}</p>
            {tx.merchant_name && (
              <p className="text-[10px] text-muted-foreground truncate">{tx.description}</p>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-mono">{formatDate(tx.transaction_date)}</span>
            <span className={`font-mono tabular-nums font-bold ${tx.transaction_type === "CREDIT" ? "text-positive" : ""}`}>
              {tx.transaction_type === "CREDIT" ? "+" : "-"}{formatCurrency(Math.abs(tx.amount))}
            </span>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Category buttons */}
      <div className="space-y-2">
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">
          What category is this?
        </p>
        <div className="grid grid-cols-2 gap-2">
          {BUDGET_CATEGORIES.filter((c) => c.value !== "uncategorised").map((cat) => (
            <button
              key={cat.value}
              onClick={() => handleCategorise(cat.value)}
              className="flex items-center justify-between rounded-lg border border-border/50 bg-background/50 px-3 py-2.5 text-sm hover:border-primary/30 hover:bg-primary/5 transition-all group"
            >
              <span className={cat.color}>{cat.label}</span>
              <ChevronRight className="h-3 w-3 text-muted-foreground/30 group-hover:text-primary transition-colors" />
            </button>
          ))}
        </div>
      </div>

      {/* Skip */}
      <Button
        variant="ghost"
        size="sm"
        className="w-full text-xs"
        onClick={() => setCurrentIndex((i) => Math.min(i + 1, uncategorised.length - 1))}
      >
        Skip for now
      </Button>
    </div>
  );
}
