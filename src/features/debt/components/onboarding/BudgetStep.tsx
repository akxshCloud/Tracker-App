import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PoundSterling, AlertTriangle } from "lucide-react";
import { useDebtStore } from "../../store";
import { minimumBudgetRequired } from "../../calculations";
import { formatCurrency } from "@/lib/utils";

interface BudgetStepProps {
  onNext: () => void;
  onBack: () => void;
}

export function BudgetStep({ onNext, onBack }: BudgetStepProps) {
  const { debts, monthlyBudget, setMonthlyBudget } = useDebtStore();
  const [budget, setBudget] = useState(monthlyBudget || 0);
  const minimumRequired = minimumBudgetRequired(debts);
  const belowMinimum = budget > 0 && budget < minimumRequired;

  async function handleContinue() {
    await setMonthlyBudget(budget);
    onNext();
  }

  return (
    <Card className="border-0 bg-transparent shadow-none">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-2xl font-bold tracking-tight">
          Set Your Monthly Budget
        </CardTitle>
        <p className="text-muted-foreground">
          How much can you put toward debt each month? This includes all minimum payments plus any extra you can afford.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="budget">Monthly Debt Budget (£)</Label>
          <div className="relative">
            <PoundSterling className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              id="budget"
              type="number"
              step="10"
              min="0"
              className="pl-10 text-2xl font-mono h-14"
              placeholder="0.00"
              value={budget || ""}
              onChange={(e) => setBudget(parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>

        {/* Minimum payment info */}
        <div className="rounded-lg border border-border bg-card p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total minimum payments</span>
            <span className="font-mono tabular-nums">{formatCurrency(minimumRequired)}/mo</span>
          </div>
          {budget > minimumRequired && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Extra toward debt</span>
              <span className="font-mono tabular-nums text-primary">
                +{formatCurrency(budget - minimumRequired)}/mo
              </span>
            </div>
          )}
        </div>

        {belowMinimum && (
          <div className="flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
            <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-destructive">Below minimum payments</p>
              <p className="text-xs text-muted-foreground">
                Your minimums total {formatCurrency(minimumRequired)}/mo.
                Setting a lower budget means you won't cover all minimum payments, which can result in late fees and credit score damage.
              </p>
            </div>
          </div>
        )}

        {budget > minimumRequired && (
          <p className="text-sm text-muted-foreground text-center">
            The extra {formatCurrency(budget - minimumRequired)} will be directed at your priority debt each month — this is what accelerates your payoff.
          </p>
        )}

        <div className="flex justify-between pt-4">
          <Button variant="ghost" onClick={onBack}>
            Back
          </Button>
          <Button onClick={handleContinue} disabled={budget <= 0}>
            Continue
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
