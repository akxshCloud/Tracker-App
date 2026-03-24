import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, PoundSterling } from "lucide-react";
import { useDebtStore } from "../../store";
import { DEBT_CATEGORIES, type DebtFormData } from "../../types";
import { formatCurrency } from "@/lib/utils";

interface AddDebtsStepProps {
  onNext: () => void;
  onBack: () => void;
}

const emptyDebt: DebtFormData = {
  name: "",
  category: "credit_card",
  current_balance: 0,
  interest_rate: 0,
  minimum_payment: 0,
  due_day: null,
  notes: "",
};

export function AddDebtsStep({ onNext, onBack }: AddDebtsStepProps) {
  const { debts, addDebt, removeDebt } = useDebtStore();
  const [form, setForm] = useState<DebtFormData>({ ...emptyDebt });
  const [isAdding, setIsAdding] = useState(debts.length === 0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Give this debt a name";
    if (form.current_balance <= 0) errs.current_balance = "Enter the current balance";
    if (form.interest_rate < 0) errs.interest_rate = "Interest rate can't be negative";
    if (form.minimum_payment < 0) errs.minimum_payment = "Minimum payment can't be negative";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleAdd() {
    if (!validate()) return;
    await addDebt(form);
    setForm({ ...emptyDebt });
    setIsAdding(false);
  }

  const totalDebt = debts.reduce((sum, d) => sum + d.current_balance, 0);

  return (
    <Card className="border-0 bg-transparent shadow-none">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-2xl font-bold tracking-tight">
          Add Your Debts
        </CardTitle>
        <p className="text-muted-foreground">
          Add each debt you owe — credit cards, loans, BNPL, overdrafts. Everything.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Existing debts list */}
        {debts.length > 0 && (
          <div className="space-y-3">
            {debts.map((debt) => (
              <div
                key={debt.id}
                className="flex items-center justify-between rounded-lg border border-border bg-card p-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{debt.name}</p>
                    <Badge variant="secondary" className="text-xs">
                      {DEBT_CATEGORIES.find((c) => c.value === debt.category)?.label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span>{formatCurrency(debt.current_balance)}</span>
                    {debt.interest_rate > 0 && (
                      <span className="text-destructive">{debt.interest_rate}% APR</span>
                    )}
                    {debt.minimum_payment > 0 && (
                      <span>Min: {formatCurrency(debt.minimum_payment)}/mo</span>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeDebt(debt.id)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Separator />
            <div className="flex justify-between items-center px-1">
              <span className="text-sm text-muted-foreground">Total debt</span>
              <span className="font-semibold font-mono tabular-nums">{formatCurrency(totalDebt)}</span>
            </div>
          </div>
        )}

        {/* Add debt form */}
        {isAdding ? (
          <div className="space-y-4 rounded-lg border border-border bg-card p-4">
            <div className="space-y-2">
              <Label htmlFor="name">What's this debt called?</Label>
              <Input
                id="name"
                placeholder="e.g. Barclaycard, Klarna, Car Finance"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <div className="flex flex-wrap gap-2">
                {DEBT_CATEGORIES.map((cat) => (
                  <Badge
                    key={cat.value}
                    variant={form.category === cat.value ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setForm({ ...form, category: cat.value })}
                  >
                    {cat.label}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="balance">Current Balance (£)</Label>
                <div className="relative">
                  <PoundSterling className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="balance"
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
                <Label htmlFor="rate">Interest Rate (% APR)</Label>
                <Input
                  id="rate"
                  type="number"
                  step="0.1"
                  min="0"
                  className="font-mono"
                  placeholder="0.0"
                  value={form.interest_rate || ""}
                  onChange={(e) => setForm({ ...form, interest_rate: parseFloat(e.target.value) || 0 })}
                />
                {errors.interest_rate && <p className="text-xs text-destructive">{errors.interest_rate}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minimum">Minimum Payment (£/month)</Label>
                <div className="relative">
                  <PoundSterling className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="minimum"
                    type="number"
                    step="0.01"
                    min="0"
                    className="pl-9 font-mono"
                    placeholder="0.00"
                    value={form.minimum_payment || ""}
                    onChange={(e) => setForm({ ...form, minimum_payment: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                {errors.minimum_payment && <p className="text-xs text-destructive">{errors.minimum_payment}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="due_day">Due Day (optional)</Label>
                <Input
                  id="due_day"
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

            <div className="flex gap-2 justify-end pt-2">
              <Button variant="ghost" onClick={() => { setIsAdding(false); setErrors({}); }}>
                Cancel
              </Button>
              <Button onClick={handleAdd}>
                Add Debt
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            className="w-full border-dashed"
            onClick={() => setIsAdding(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Another Debt
          </Button>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-4">
          <Button variant="ghost" onClick={onBack}>
            Back
          </Button>
          <Button onClick={onNext} disabled={debts.length === 0}>
            Continue
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
