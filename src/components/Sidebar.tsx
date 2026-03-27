import type { ComponentType } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useRouter, type Page } from "@/lib/router";
import {
  CreditCard,
  CalendarClock,
  Wallet,
  History,
  Settings,
  LayoutDashboard,
  Dumbbell,
  Target,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ReviewBell } from "@/features/budget/components/ReviewPanel";

interface NavItem {
  page?: Page;
  label: string;
  Icon: ComponentType<{ className?: string }>;
  disabled?: boolean;
}

const mainNav: NavItem[] = [
  { page: "debt", label: "Debt Tracker", Icon: CreditCard },
  { page: "schedule", label: "Payment Plan", Icon: CalendarClock },
  { page: "budget", label: "Budget", Icon: Wallet },
  { page: "payments", label: "Payment History", Icon: History },
];

const lifeNav: NavItem[] = [
  { page: "habits", label: "Habits", Icon: Dumbbell },
  { page: "goals", label: "Goals", Icon: Target },
];

const futureNav: NavItem[] = [
  { label: "Dashboard", Icon: LayoutDashboard, disabled: true },
];

const bottomNav: NavItem[] = [
  { page: "settings", label: "Settings", Icon: Settings },
];

export function Sidebar() {
  const { page, navigate } = useRouter();

  return (
    <aside className="flex h-screen w-[68px] flex-col items-center border-r border-sidebar-border bg-sidebar py-5 gap-1">
      {/* App brand */}
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 mb-4">
        <div className="h-5 w-5 rounded-md bg-primary" />
      </div>

      {/* Divider */}
      <div className="w-8 h-px bg-sidebar-border mb-2" />

      {/* Main nav */}
      <nav className="flex flex-1 flex-col items-center gap-0.5 pt-1">
        {mainNav.map((item) => (
          <NavButton
            key={item.label}
            item={item}
            active={!!item.page && page === item.page}
            onClick={() => item.page && navigate(item.page)}
          />
        ))}

        <div className="w-8 h-px bg-sidebar-border my-3" />

        {lifeNav.map((item) => (
          <NavButton
            key={item.label}
            item={item}
            active={!!item.page && page === item.page}
            onClick={() => item.page && navigate(item.page)}
          />
        ))}

        <div className="w-8 h-px bg-sidebar-border my-3" />

        {futureNav.map((item) => (
          <NavButton
            key={item.label}
            item={item}
            active={false}
            onClick={() => {}}
          />
        ))}
      </nav>

      {/* Bottom nav */}
      <nav className="flex flex-col items-center gap-1">
        <ReviewBell />
        {bottomNav.map((item) => (
          <NavButton
            key={item.label}
            item={item}
            active={!!item.page && page === item.page}
            onClick={() => item.page && navigate(item.page)}
          />
        ))}
      </nav>
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
  const { Icon } = item;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          className={cn(
            "relative flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200",
            active
              ? "text-primary"
              : item.disabled
                ? "text-sidebar-foreground/15 cursor-not-allowed"
                : "text-sidebar-foreground/40 hover:text-sidebar-foreground/70 hover:bg-sidebar-accent",
          )}
        >
          {active && (
            <motion.div
              layoutId="sidebar-active"
              className="absolute inset-0 rounded-xl bg-primary/10 glow-sm"
              transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
            />
          )}
          {active && (
            <motion.div
              layoutId="sidebar-indicator"
              className="absolute -left-[14px] top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-primary"
              transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
            />
          )}
          <Icon className="h-[18px] w-[18px] relative z-10" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={12} className="text-xs font-medium">
        {item.label}
        {item.disabled && <span className="text-muted-foreground ml-1">(Soon)</span>}
      </TooltipContent>
    </Tooltip>
  );
}
