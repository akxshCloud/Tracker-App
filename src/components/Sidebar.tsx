import type { ComponentType } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useRouter, type Page } from "@/lib/router";
import {
  Home,
  CreditCard,
  Calendar,
  Wallet,
  Receipt,
  CheckSquare,
  Target,
  Settings,
  Lightbulb,
  LightbulbOff,
  Monitor,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ReviewBell } from "@/features/budget/components/ReviewPanel";
import { useThemeStore } from "@/lib/theme";
import pulseIcon from "@/assets/pulse-icon.svg";

interface NavItem {
  page: Page;
  label: string;
  Icon: ComponentType<{ className?: string }>;
}

const mainNav: NavItem[] = [
  { page: "dashboard", label: "Dashboard", Icon: Home },
  { page: "debt", label: "Debt Tracker", Icon: CreditCard },
  { page: "schedule", label: "Payment Plan", Icon: Calendar },
  { page: "budget", label: "Budget", Icon: Wallet },
  { page: "payments", label: "Payment History", Icon: Receipt },
  { page: "habits", label: "Habits", Icon: CheckSquare },
  { page: "goals", label: "Goals", Icon: Target },
];

const bottomNav: NavItem[] = [
  { page: "settings", label: "Settings", Icon: Settings },
];

export function Sidebar() {
  const { page, navigate } = useRouter();
  const { mode, cycleMode } = useThemeStore();

  const ThemeIcon = mode === "light" ? Lightbulb : mode === "dark" ? LightbulbOff : Monitor;
  const themeLabel = mode === "system" ? "System" : mode === "light" ? "Light" : "Dark";

  return (
    <aside className="flex h-screen w-[240px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      {/* App identity + theme toggle */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <img src={pulseIcon} alt="Pulse" className="h-7 w-7" />
          <span
            className="text-[17px] font-semibold tracking-tight"
            style={{ color: "var(--th-foreground)" }}
          >
            Pulse
          </span>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={cycleMode}
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <ThemeIcon className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="text-xs">
            Theme: {themeLabel}
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Main navigation */}
      <nav className="flex-1 flex flex-col gap-0.5 px-3 py-3 overflow-y-auto">
        {mainNav.map((item) => (
          <NavButton
            key={item.label}
            item={item}
            active={page === item.page}
            onClick={() => navigate(item.page)}
          />
        ))}
      </nav>

      {/* Bottom section */}
      <div className="px-3 py-3 border-t border-sidebar-border">
        <ReviewBell />
        {bottomNav.map((item) => (
          <NavButton
            key={item.label}
            item={item}
            active={page === item.page}
            onClick={() => navigate(item.page)}
          />
        ))}
      </div>
    </aside>
  );
}

function NavButton({
  item,
  active,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  onClick: () => void;
}) {
  const { Icon, label } = item;
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors duration-150",
        active
          ? "text-primary bg-primary/8"
          : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent",
      )}
    >
      {active && (
        <motion.div
          layoutId="sidebar-active"
          className="absolute inset-0 rounded-md bg-primary/8"
          transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
        />
      )}
      <Icon className="h-4 w-4 relative z-10 shrink-0" />
      <span className="relative z-10">{label}</span>
    </button>
  );
}
