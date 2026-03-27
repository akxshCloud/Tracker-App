import {
  CircleCheck,
  Dumbbell,
  BookOpen,
  Brain,
  Droplets,
  Moon,
  Pencil,
  Music,
  Heart,
  Code,
  Wallet,
  Users,
  Salad,
  Footprints,
  Pill,
  Sun,
} from "lucide-react";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  "circle-check": CircleCheck,
  dumbbell: Dumbbell,
  "book-open": BookOpen,
  brain: Brain,
  droplets: Droplets,
  moon: Moon,
  pencil: Pencil,
  music: Music,
  heart: Heart,
  code: Code,
  wallet: Wallet,
  users: Users,
  salad: Salad,
  footprints: Footprints,
  pill: Pill,
  sun: Sun,
};

interface HabitIconProps {
  name: string;
  className?: string;
  style?: React.CSSProperties;
}

export function HabitIcon({ name, className, style }: HabitIconProps) {
  const Icon = ICON_MAP[name] ?? CircleCheck;
  return <Icon className={className} style={style} />;
}
