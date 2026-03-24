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
import { Badge } from "@/components/ui/badge";
import { PoundSterling, Plus } from "lucide-react";
import { useDebtStore } from "../../store";
import { DEBT_CATEGORIES, type DebtFormData } from "../../types";

const emptyDebt: DebtFormData = {
  name: "",
  category: "credit_card",
  current_balance: 0,
  interest_rate: 0,
  minimum_payment: 0,
  due_day: null,
  notes: "",
};

export function AddDebtDialog() {
  const { addDebt } = useDebtStore();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<DebtFormData>({ ...emptyDebt });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Give this debt a name";
    if (form.current_balance <= 0) errs.current_balance = "Enter the balance";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    await addDebt(form);
    setOpen(false);
    setForm({ ...emptyDebt });
    setErrors({});
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setForm({ ...emptyDebt }); setErrors({}); } }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />
          Add Debt
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add a Debt</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="new-name">Name</Label>
            <Input
              id="new-name"
              placeholder="e.g. Barclaycard, Klarna"
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
                  className="cursor-pointer text-xs"
                  onClick={() => setForm({ ...form, category: cat.value })}
                >
                  {cat.label}
                </Badge>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="new-balance">Balance (£)</Label>
              <div className="relative">
                <PoundSterling className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="new-balance"
                  type="number"
                  step="0.01"
                  min="0"
                  className="pl-9 font-mono"
                  placeholder="0.00"
                  value={form.current_balance || ""}
                  onChange={(e) => setForm({ ...form, current_balance: parseFloat(e.target.value) || 0 })}
                />
              </div>
              {errors.current_balance && <p className="text-xs text-destructive">{errors.current_balance}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-rate">APR (%)</Label>
              <Input
                id="new-rate"
                type="number"
                step="0.1"
                min="0"
                className="font-mono"
                placeholder="0.0"
                value={form.interest_rate || ""}
                onChange={(e) => setForm({ ...form, interest_rate: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="new-min">Min payment (£/mo)</Label>
              <div className="relative">
                <PoundSterling className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="new-min"
                  type="number"
                  step="0.01"
                  min="0"
                  className="pl-9 font-mono"
                  placeholder="0.00"
                  value={form.minimum_payment || ""}
                  onChange={(e) => setForm({ ...form, minimum_payment: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-due">Due day</Label>
              <Input
                id="new-due"
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

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>Add Debt</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
