import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingDown, Target, BarChart3 } from "lucide-react";

interface WelcomeStepProps {
  onNext: () => void;
}

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  return (
    <Card className="border-0 bg-transparent shadow-none">
      <CardHeader className="text-center space-y-4 pb-8">
        <CardTitle className="text-4xl font-bold tracking-tight">
          Take Control of Your Debt
        </CardTitle>
        <p className="text-lg text-muted-foreground max-w-md mx-auto">
          Let's build a clear picture of where you stand and create a plan to get you debt-free.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4">
          <Feature
            icon={<TrendingDown className="h-5 w-5 text-primary" />}
            title="Track Every Penny"
            description="Add all your debts — credit cards, loans, BNPL — and see the full picture in one place."
          />
          <Feature
            icon={<Target className="h-5 w-5 text-primary" />}
            title="Smart Payoff Strategies"
            description="Compare avalanche (save on interest) vs snowball (quick wins) to find what works for you."
          />
          <Feature
            icon={<BarChart3 className="h-5 w-5 text-primary" />}
            title="See Your Debt-Free Date"
            description="Get a projected timeline showing exactly when each debt hits zero."
          />
        </div>
        <div className="flex justify-center pt-4">
          <Button size="lg" onClick={onNext} className="px-8">
            Let's Get Started
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Feature({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex items-start gap-4 rounded-lg border border-border bg-card p-4">
      <div className="mt-0.5">{icon}</div>
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
