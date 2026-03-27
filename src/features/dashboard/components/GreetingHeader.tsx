import { useMemo } from "react";

interface GreetingHeaderProps {
  habitsRemaining: number;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getFormattedDate(): string {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
}

export function GreetingHeader({ habitsRemaining }: GreetingHeaderProps) {
  const greeting = useMemo(getGreeting, []);
  const dateStr = useMemo(getFormattedDate, []);

  // Find nearest due payment
  const nudge = useMemo(() => {
    if (habitsRemaining > 0) {
      return `You have ${habitsRemaining} habit${habitsRemaining !== 1 ? "s" : ""} left today`;
    }
    if (habitsRemaining === 0) {
      return "All habits done today!";
    }
    return null;
  }, [habitsRemaining]);

  return (
    <div className="space-y-1">
      <h1 className="text-3xl font-bold tracking-tight">
        {greeting}
      </h1>
      <p className="text-sm text-muted-foreground">{dateStr}</p>
      {nudge && (
        <p className="text-xs text-primary/70 pt-1">{nudge}</p>
      )}
    </div>
  );
}
