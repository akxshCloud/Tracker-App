import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useDebtStore } from "@/features/debt/store";
import { useRouter } from "@/lib/router";
import { OnboardingWizard } from "@/features/debt/components/onboarding/OnboardingWizard";
import { DebtDashboard } from "@/features/debt/components/dashboard/DebtDashboard";
import { PaymentSchedule } from "@/features/debt/components/PaymentSchedule";
import { PaymentHistory } from "@/features/debt/components/PaymentHistory";
import { SettingsPage } from "@/features/settings/SettingsPage";
import { Sidebar } from "@/components/Sidebar";
import { checkAndNotify } from "@/features/debt/notifications";
import { UpdateChecker } from "@/components/UpdateChecker";
import { ScrollArea } from "@/components/ui/scroll-area";

function App() {
  const { isLoading, hasCompletedOnboarding, initialize } = useDebtStore();
  const { page } = useRouter();

  useEffect(() => {
    initialize().then(() => {
      // Check for payment reminders after data loads
      const { debts } = useDebtStore.getState();
      if (debts.length > 0) {
        checkAndNotify(debts).catch(console.debug);
      }
    });
  }, [initialize]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          className="space-y-3 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto" />
        </motion.div>
      </div>
    );
  }

  if (!hasCompletedOnboarding) {
    return <OnboardingWizard />;
  }

  return (
    <div className="flex h-screen bg-background">
      <UpdateChecker />
      <Sidebar />
      <ScrollArea className="flex-1">
        <main className="mx-auto max-w-6xl p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={page}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            >
              {page === "debt" && <DebtDashboard />}
              {page === "schedule" && <PaymentSchedule />}
              {page === "payments" && <PaymentHistory />}
              {page === "settings" && <SettingsPage />}
            </motion.div>
          </AnimatePresence>
        </main>
      </ScrollArea>
    </div>
  );
}

export default App;
