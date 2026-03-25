import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Separator } from "@/components/ui/separator";
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
    if (form.current_balance < 0) errs.current_balance = "Can't be negative";
    if (form.interest_rate < 0) errs.interest_rate = "Can't be negative";
    if (form.minimum_payment < 0) errs.minimum_payment = "Can't be negative";
    if (form.due_day !== null && (form.due_day < 1 || form.due_day > 31)) errs.due_day = "1–31";
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
      <DialogContent className="sm:max-w-[420px] gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="text-lg">Edit Debt</DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-5">
          {/* Name + Category row */}
          <div className="grid grid-cols-5 gap-3">
            <div className="col-span-3 space-y-1.5">
              <Label htmlFor="edit-name" className="text-[11px] text-muted-foreground">Name</Label>
              <Input
                id="edit-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="bg-background/50 border-border/50 h-10"
              />
              {errors.name && <p className="text-[10px] text-destructive">{errors.name}</p>}
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-[11px] text-muted-foreground">Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as DebtFormData["category"] })}>
                <SelectTrigger className="w-full bg-background/50 border-border/50 !h-10 text-xs dark:bg-background/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEBT_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value} className="text-xs">
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator className="bg-border/30" />

          {/* Financial details — 2x2 grid */}
          <div className="grid grid-cols-2 gap-x-3 gap-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-balance" className="text-[11px] text-muted-foreground">Balance</Label>
              <div className="relative">
                <PoundSterling className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  id="edit-balance"
                  type="number"
                  step="0.01"
                  min="0"
                  className="pl-8 font-mono text-sm bg-background/50 border-border/50 h-10"
                  value={form.current_balance}
                  onChange={(e) => setForm({ ...form, current_balance: parseFloat(e.target.value) || 0 })}
                />
              </div>
              {errors.current_balance && <p className="text-[10px] text-destructive">{errors.current_balance}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-rate" className="text-[11px] text-muted-foreground">APR (%)</Label>
              <Input
                id="edit-rate"
                type="number"
                step="0.1"
                min="0"
                className="font-mono text-sm bg-background/50 border-border/50 h-10"
                value={form.interest_rate}
                onChange={(e) => setForm({ ...form, interest_rate: parseFloat(e.target.value) || 0 })}
              />
              {errors.interest_rate && <p className="text-[10px] text-destructive">{errors.interest_rate}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-min" className="text-[11px] text-muted-foreground">Min payment / mo</Label>
              <div className="relative">
                <PoundSterling className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  id="edit-min"
                  type="number"
                  step="0.01"
                  min="0"
                  className="pl-8 font-mono text-sm bg-background/50 border-border/50 h-10"
                  value={form.minimum_payment}
                  onChange={(e) => setForm({ ...form, minimum_payment: parseFloat(e.target.value) || 0 })}
                />
              </div>
              {errors.minimum_payment && <p className="text-[10px] text-destructive">{errors.minimum_payment}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-due" className="text-[11px] text-muted-foreground">Due day of month</Label>
              <Input
                id="edit-due"
                type="number"
                min="1"
                max="31"
                className="font-mono text-sm bg-background/50 border-border/50 h-10"
                placeholder="—"
                value={form.due_day ?? ""}
                onChange={(e) => setForm({ ...form, due_day: e.target.value ? parseInt(e.target.value) : null })}
              />
              {errors.due_day && <p className="text-[10px] text-destructive">{errors.due_day}</p>}
            </div>
          </div>

          {errors.submit && <p className="text-xs text-destructive">{errors.submit}</p>}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSave}>Save Changes</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
