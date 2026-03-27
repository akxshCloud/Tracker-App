interface GreetingHeaderProps {
  habitsRemaining: number;
  habitsTotal: number;
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

export function GreetingHeader({ habitsRemaining, habitsTotal }: GreetingHeaderProps) {
  const greeting = getGreeting();
  const dateStr = getFormattedDate();

  let nudge: string | null = null;
  if (habitsTotal > 0) {
    if (habitsRemaining > 0) {
      nudge = `You have ${habitsRemaining} habit${habitsRemaining !== 1 ? "s" : ""} left today`;
    } else {
      nudge = "All habits done today!";
    }
  }

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
