import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { PoundSterling } from "lucide-react";
import { useDebtStore } from "../../store";
import { DEBT_CATEGORIES, type Debt, type DebtFormData } from "../../types";

interface EditDebtDialogProps {
  debt: Debt;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditDebtDialog({ debt, open, onOpenChange }: EditDebtDialogProps) {
  const { updateDebt } = useDebtStore();
  const [form, setForm] = useState<DebtFormData>({
    name: debt.name,
    category: debt.category,
    current_balance: debt.current_balance,
    interest_rate: debt.interest_rate,
    minimum_payment: debt.minimum_payment,
    due_day: debt.due_day,
    notes: debt.notes ?? "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setForm({
        name: debt.name,
        category: debt.category,
        current_balance: debt.current_balance,
        interest_rate: debt.interest_rate,
        minimum_payment: debt.minimum_payment,
        due_day: debt.due_day,
        notes: debt.notes ?? "",
      });
      setErrors({});
    }
  }, [open, debt]);

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (form.current_balance < 0) errs.current_balance = "Balance can't be negative";
    if (form.interest_rate < 0) errs.interest_rate = "APR can't be negative";
    if (form.minimum_payment < 0) errs.minimum_payment = "Can't be negative";
    if (form.due_day !== null && (form.due_day < 1 || form.due_day > 31)) errs.due_day = "Must be 1–31";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    try {
      await updateDebt(debt.id, form);
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      setErrors({ submit: "Failed to update. Please try again." });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Debt</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Name</Label>
            <Input
              id="edit-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <div className="flex flex-wrap gap-1.5">
              {DEBT_CATEGORIES.map((cat) => (
                <Badge
                  key={cat.value}
                  variant={form.category === cat.value ? "default" : "outline"}
                  className="cursor-pointer text-xs border-border/50 hover:border-border transition-colors"
                  onClick={() => setForm({ ...form, category: cat.value })}
                >
                  {cat.label}
                </Badge>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="edit-balance">Balance (£)</Label>
              <div className="relative">
                <PoundSterling className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="edit-balance"
                  type="number"
                  step="0.01"
                  min="0"
                  className="pl-9 font-mono"
                  value={form.current_balance}
                  onChange={(e) => setForm({ ...form, current_balance: parseFloat(e.target.value) || 0 })}
                />
              </div>
              {errors.current_balance && <p className="text-xs text-destructive">{errors.current_balance}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-rate">APR (%)</Label>
              <Input
                id="edit-rate"
                type="number"
                step="0.1"
                min="0"
                className="font-mono"
                value={form.interest_rate}
                onChange={(e) => setForm({ ...form, interest_rate: parseFloat(e.target.value) || 0 })}
              />
              {errors.interest_rate && <p className="text-xs text-destructive">{errors.interest_rate}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="edit-min">Min payment (£/mo)</Label>
              <div className="relative">
                <PoundSterling className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="edit-min"
                  type="number"
                  step="0.01"
                  min="0"
                  className="pl-9 font-mono"
                  value={form.minimum_payment}
                  onChange={(e) => setForm({ ...form, minimum_payment: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-due">Due day</Label>
              <Input
                id="edit-due"
                type="number"
                min="1"
                max="31"
                className="font-mono"
                placeholder="e.g. 15"
                value={form.due_day ?? ""}
                onChange={(e) => setForm({ ...form, due_day: e.target.value ? parseInt(e.target.value) : null })}
              />
            </div>
          </div>

          {errors.submit && <p className="text-xs text-destructive">{errors.submit}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
