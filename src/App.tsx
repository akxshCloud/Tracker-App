import { useEffect } from "react";
import { useDebtStore } from "@/features/debt/store";
import { OnboardingWizard } from "@/features/debt/components/onboarding/OnboardingWizard";
import { DebtDashboard } from "@/features/debt/components/dashboard/DebtDashboard";

function App() {
  const { isLoading, hasCompletedOnboarding, initialize } = useDebtStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="space-y-3 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!hasCompletedOnboarding) {
    return <OnboardingWizard />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl p-6">
        <DebtDashboard />
      </div>
    </div>
  );
}

export default App;
