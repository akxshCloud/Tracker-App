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
  page: Page;
  label: string;
  icon: React.ReactNode;
  disabled?: boolean;
}

const mainNav: NavItem[] = [
  { page: "debt", label: "Debt Tracker", icon: <CreditCard className="h-5 w-5" /> },
  { page: "payments", label: "Payment History", icon: <History className="h-5 w-5" /> },
];

const futureNav: NavItem[] = [
  { page: "debt", label: "Dashboard", icon: <LayoutDashboard className="h-5 w-5" />, disabled: true },
  { page: "debt", label: "Habits", icon: <Dumbbell className="h-5 w-5" />, disabled: true },
  { page: "debt", label: "Goals", icon: <Target className="h-5 w-5" />, disabled: true },
];

const bottomNav: NavItem[] = [
  { page: "settings", label: "Settings", icon: <Settings className="h-5 w-5" /> },
];

export function Sidebar() {
  const { page, navigate } = useRouter();

  return (
    <aside className="flex h-screen w-16 flex-col items-center border-r border-sidebar-border bg-sidebar py-4 gap-2">
      {/* App icon */}
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-lg mb-2">
        LT
      </div>

      <Separator className="w-8" />

      {/* Main nav */}
      <nav className="flex flex-1 flex-col items-center gap-1 pt-2">
        {mainNav.map((item) => (
          <NavButton
            key={item.label}
            item={item}
            active={page === item.page && !item.disabled}
            onClick={() => !item.disabled && navigate(item.page)}
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

      {/* Bottom nav */}
      <nav className="flex flex-col items-center gap-1">
        {bottomNav.map((item) => (
          <NavButton
            key={item.label}
            item={item}
            active={page === item.page}
            onClick={() => navigate(item.page)}
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
          {item.icon}
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" className="text-xs">
        {item.label}
        {item.disabled && <span className="text-muted-foreground ml-1">(Coming soon)</span>}
      </TooltipContent>
    </Tooltip>
  );
}
