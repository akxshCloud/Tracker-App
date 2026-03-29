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

export function GreetingHeader(_props: GreetingHeaderProps) {
  const greeting = getGreeting();
  const dateStr = getFormattedDate();

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">{greeting}</h1>
      <p className="text-sm text-muted-foreground mt-0.5">{dateStr}</p>
    </div>
  );
}
