import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pencil, Trash2 } from "lucide-react";
import { useDebtStore } from "../../store";
import { DEBT_CATEGORIES, type Debt } from "../../types";
import { formatCurrency } from "@/lib/utils";
import { EditDebtDialog } from "./EditDebtDialog";

export function DebtList() {
  const { debts, removeDebt } = useDebtStore();
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [deletingDebt, setDeletingDebt] = useState<Debt | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  if (debts.length === 0) return null;

  async function handleDelete() {
    if (!deletingDebt || isDeleting) return;
    setIsDeleting(true);
    setDeleteError("");
    try {
      await removeDebt(deletingDebt.id);
      setDeletingDebt(null);
    } catch (err) {
      console.error(err);
      setDeleteError("Failed to delete. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <div className="card-elevated rounded-2xl p-6 space-y-5">
        <div>
          <h3 className="text-sm font-semibold">Your Debts</h3>
          <p className="text-xs text-muted-foreground">{debts.length} active {debts.length === 1 ? "debt" : "debts"}</p>
        </div>

        <div className="space-y-3">
          {debts.map((debt) => {
            const percentPaid = debt.original_balance > 0
              ? ((debt.original_balance - debt.current_balance) / debt.original_balance) * 100
              : 0;

            return (
              <div
                key={debt.id}
                className="group rounded-xl bg-background/50 border border-border/50 p-4 space-y-3 hover:border-border transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{debt.name}</span>
                      <Badge variant="outline" className="text-[10px] font-medium border-border/50">
                        {DEBT_CATEGORIES.find((c) => c.value === debt.category)?.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {debt.interest_rate > 0 && (
                        <span className="text-destructive font-medium">{debt.interest_rate}% APR</span>
                      )}
                      {debt.interest_rate === 0 && (
                        <span className="text-positive font-medium">0% interest</span>
                      )}
                      {debt.minimum_payment > 0 && (
                        <span>Min: {formatCurrency(debt.minimum_payment)}/mo</span>
                      )}
                      {debt.due_day && (
                        <span>Due: {debt.due_day}{ordinal(debt.due_day)}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="text-right">
                      <p className="font-mono tabular-nums font-bold text-sm">
                        {formatCurrency(debt.current_balance)}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-mono tabular-nums">
                        of {formatCurrency(debt.original_balance)}
                      </p>
                    </div>
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setEditingDebt(debt)}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 hover:text-destructive"
                        onClick={() => setDeletingDebt(debt)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Progress value={percentPaid} className="h-1.5 flex-1 bg-white/5" />
                  <span className="text-[10px] text-muted-foreground font-mono tabular-nums w-10 text-right">
                    {Math.round(percentPaid)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Edit dialog */}
      {editingDebt && (
        <EditDebtDialog
          debt={editingDebt}
          open={!!editingDebt}
          onOpenChange={(open) => { if (!open) setEditingDebt(null); }}
        />
      )}

      {/* Delete confirmation */}
      <Dialog open={!!deletingDebt} onOpenChange={(open) => { if (!open) setDeletingDebt(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete Debt</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete <span className="font-semibold text-foreground">{deletingDebt?.name}</span>?
            This will also remove all associated payment records. This cannot be undone.
          </p>
          {deleteError && <p className="text-xs text-destructive">{deleteError}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setDeletingDebt(null)} disabled={isDeleting}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}
