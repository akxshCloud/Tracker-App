import {
  Target,
  Trophy,
  Star,
  Rocket,
  PiggyBank,
  GraduationCap,
  HeartPulse,
  Briefcase,
  Mountain,
  BookOpen,
  Dumbbell,
  Home,
} from "lucide-react";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  target: Target,
  trophy: Trophy,
  star: Star,
  rocket: Rocket,
  "piggy-bank": PiggyBank,
  "graduation-cap": GraduationCap,
  "heart-pulse": HeartPulse,
  briefcase: Briefcase,
  mountain: Mountain,
  "book-open": BookOpen,
  dumbbell: Dumbbell,
  home: Home,
};

interface GoalIconProps {
  name: string;
  className?: string;
  style?: React.CSSProperties;
}

export function GoalIcon({ name, className, style }: GoalIconProps) {
  const Icon = ICON_MAP[name] ?? Target;
  return <Icon className={className} style={style} />;
}
