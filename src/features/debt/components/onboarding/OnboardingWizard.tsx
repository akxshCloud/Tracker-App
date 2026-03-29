import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { WelcomeStep } from "./WelcomeStep";
import { AddDebtsStep } from "./AddDebtsStep";
import { BudgetStep } from "./BudgetStep";
import { ReviewStep } from "./ReviewStep";

type Step = "welcome" | "debts" | "budget" | "review";

const STEPS: Step[] = ["welcome", "debts", "budget", "review"];

export function OnboardingWizard() {
  const [currentStep, setCurrentStep] = useState<Step>("welcome");
  const [direction, setDirection] = useState(1);
  const currentIndex = STEPS.indexOf(currentStep);

  function next() {
    if (currentIndex < STEPS.length - 1) {
      setDirection(1);
      setCurrentStep(STEPS[currentIndex + 1]);
    }
  }

  function back() {
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentStep(STEPS[currentIndex - 1]);
    }
  }

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-2xl space-y-8">
        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2">
          {STEPS.map((step, i) => (
            <motion.div
              key={step}
              className="h-1.5 rounded-full transition-colors"
              animate={{
                width: i === currentIndex ? 32 : 16,
                backgroundColor: i <= currentIndex
                  ? "#2E7CF6"
                  : "var(--th-dot-empty)",
              }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            />
          ))}
        </div>

        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          >
            {currentStep === "welcome" && <WelcomeStep onNext={next} />}
            {currentStep === "debts" && <AddDebtsStep onNext={next} onBack={back} />}
            {currentStep === "budget" && <BudgetStep onNext={next} onBack={back} />}
            {currentStep === "review" && <ReviewStep onBack={back} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
