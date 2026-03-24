import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PoundSterling, Settings } from "lucide-react";
import { useDebtStore } from "../../store";
import { minimumBudgetRequired } from "../../calculations";
import { formatCurrency } from "@/lib/utils";

export function EditBudgetDialog() {
  const { debts, monthlyBudget, setMonthlyBudget } = useDebtStore();
  const [open, setOpen] = useState(false);
  const [budget, setBudget] = useState(monthlyBudget);
  const minRequired = minimumBudgetRequired(debts);

  async function handleSave() {
    await setMonthlyBudget(budget);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (v) setBudget(monthlyBudget); }}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Monthly Budget</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="edit-budget">Amount (£/month)</Label>
            <div className="relative">
              <PoundSterling className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="edit-budget"
                type="number"
                step="10"
                min="0"
                className="pl-9 font-mono text-lg h-12"
                value={budget || ""}
                onChange={(e) => setBudget(parseFloat(e.target.value) || 0)}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Minimum payments total {formatCurrency(minRequired)}/mo
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={budget <= 0}>Save</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
