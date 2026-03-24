import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PoundSterling, Plus } from "lucide-react";
import { useDebtStore } from "../../store";
import { formatCurrency } from "@/lib/utils";

export function RecordPaymentDialog() {
  const { debts, recordPayment } = useDebtStore();
  const [open, setOpen] = useState(false);
  const [debtId, setDebtId] = useState<string>("");
  const [amount, setAmount] = useState<number>(0);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const selectedDebt = debts.find((d) => d.id === Number(debtId));

  async function handleSubmit() {
    if (!debtId) { setError("Select a debt"); return; }
    if (amount <= 0) { setError("Enter an amount"); return; }

    await recordPayment(Number(debtId), amount, date, notes || undefined);
    setOpen(false);
    resetForm();
  }

  function resetForm() {
    setDebtId("");
    setAmount(0);
    setDate(new Date().toISOString().split("T")[0]);
    setNotes("");
    setError("");
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />
          Record Payment
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record a Payment</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Which debt?</Label>
            <Select value={debtId} onValueChange={setDebtId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a debt" />
              </SelectTrigger>
              <SelectContent>
                {debts.filter((d) => d.current_balance > 0).map((debt) => (
                  <SelectItem key={debt.id} value={String(debt.id)}>
                    {debt.name} — {formatCurrency(debt.current_balance)} remaining
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pay-amount">Amount (£)</Label>
            <div className="relative">
              <PoundSterling className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="pay-amount"
                type="number"
                step="0.01"
                min="0"
                className="pl-9 font-mono"
                placeholder="0.00"
                value={amount || ""}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              />
            </div>
            {selectedDebt && (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => setAmount(selectedDebt.minimum_payment)}
                >
                  Min ({formatCurrency(selectedDebt.minimum_payment)})
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => setAmount(selectedDebt.current_balance)}
                >
                  Full ({formatCurrency(selectedDebt.current_balance)})
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="pay-date">Date</Label>
            <Input
              id="pay-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="font-mono"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pay-notes">Notes (optional)</Label>
            <Input
              id="pay-notes"
              placeholder="e.g. Monthly payment"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              Record Payment
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
