import type { ComponentType } from "react";
import { cn } from "@/lib/utils";
import { useRouter, type Page } from "@/lib/router";
import {
  CreditCard,
  History,
  Settings,
  LayoutDashboard,
  Dumbbell,
  Target,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface NavItem {
  page?: Page;
  label: string;
  Icon: ComponentType<{ className?: string }>;
  disabled?: boolean;
}

const mainNav: NavItem[] = [
  { page: "debt", label: "Debt Tracker", Icon: CreditCard },
  { page: "payments", label: "Payment History", Icon: History },
];

const futureNav: NavItem[] = [
  { label: "Dashboard", Icon: LayoutDashboard, disabled: true },
  { label: "Habits", Icon: Dumbbell, disabled: true },
  { label: "Goals", Icon: Target, disabled: true },
];

const bottomNav: NavItem[] = [
  { page: "settings", label: "Settings", Icon: Settings },
];

export function Sidebar() {
  const { page, navigate } = useRouter();

  return (
    <aside className="flex h-screen w-16 flex-col items-center border-r border-sidebar-border bg-sidebar py-4 gap-2">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-lg mb-2">
        LT
      </div>

      <Separator className="w-8" />

      <nav className="flex flex-1 flex-col items-center gap-1 pt-2">
        {mainNav.map((item) => (
          <NavButton
            key={item.label}
            item={item}
            active={!!item.page && page === item.page}
            onClick={() => item.page && navigate(item.page)}
          />
        ))}

        <Separator className="w-8 my-2" />

        {futureNav.map((item) => (
          <NavButton
            key={item.label}
            item={item}
            active={false}
            onClick={() => {}}
          />
        ))}
      </nav>

      <nav className="flex flex-col items-center gap-1">
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
            "flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
            active
              ? "bg-sidebar-accent text-sidebar-primary"
              : item.disabled
                ? "text-sidebar-foreground/20 cursor-not-allowed"
                : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          )}
        >
          <Icon className="h-5 w-5" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" className="text-xs">
        {item.label}
        {item.disabled && <span className="text-muted-foreground ml-1">(Coming soon)</span>}
      </TooltipContent>
    </Tooltip>
  );
}
