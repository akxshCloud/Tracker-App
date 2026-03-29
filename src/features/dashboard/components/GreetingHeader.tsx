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
      nudge = `${habitsRemaining} habit${habitsRemaining !== 1 ? "s" : ""} left today`;
    } else {
      nudge = "All habits done today";
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">{greeting}</h1>
      <p className="text-sm text-muted-foreground mt-0.5">
        {dateStr}
        {nudge && <span className="ml-2 text-primary">· {nudge}</span>}
      </p>
    </div>
  );
}
