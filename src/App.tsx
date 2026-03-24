import { useEffect } from "react";
import { useDebtStore } from "@/features/debt/store";
import { useRouter } from "@/lib/router";
import { OnboardingWizard } from "@/features/debt/components/onboarding/OnboardingWizard";
import { DebtDashboard } from "@/features/debt/components/dashboard/DebtDashboard";
import { PaymentHistory } from "@/features/debt/components/PaymentHistory";
import { SettingsPage } from "@/features/settings/SettingsPage";
import { Sidebar } from "@/components/Sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";

function App() {
  const { isLoading, hasCompletedOnboarding, initialize } = useDebtStore();
  const { page } = useRouter();

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
    <div className="flex h-screen bg-background">
      <Sidebar />
      <ScrollArea className="flex-1">
        <main className="mx-auto max-w-6xl p-6">
          {page === "debt" && <DebtDashboard />}
          {page === "payments" && <PaymentHistory />}
          {page === "settings" && <SettingsPage />}
        </main>
      </ScrollArea>
    </div>
  );
}

export default App;
