import { useState } from "react";
import { WelcomeStep } from "./WelcomeStep";
import { AddDebtsStep } from "./AddDebtsStep";
import { BudgetStep } from "./BudgetStep";
import { ReviewStep } from "./ReviewStep";

type Step = "welcome" | "debts" | "budget" | "review";

const STEPS: Step[] = ["welcome", "debts", "budget", "review"];

export function OnboardingWizard() {
  const [currentStep, setCurrentStep] = useState<Step>("welcome");
  const currentIndex = STEPS.indexOf(currentStep);

  function next() {
    if (currentIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[currentIndex + 1]);
    }
  }

  function back() {
    if (currentIndex > 0) {
      setCurrentStep(STEPS[currentIndex - 1]);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-2xl space-y-8">
        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2">
          {STEPS.map((step, i) => (
            <div key={step} className="flex items-center gap-2">
              <div
                className={`h-2 w-8 rounded-full transition-colors ${
                  i <= currentIndex ? "bg-primary" : "bg-muted"
                }`}
              />
            </div>
          ))}
        </div>

        {currentStep === "welcome" && <WelcomeStep onNext={next} />}
        {currentStep === "debts" && <AddDebtsStep onNext={next} onBack={back} />}
        {currentStep === "budget" && <BudgetStep onNext={next} onBack={back} />}
        {currentStep === "review" && <ReviewStep onBack={back} />}
      </div>
    </div>
  );
}
