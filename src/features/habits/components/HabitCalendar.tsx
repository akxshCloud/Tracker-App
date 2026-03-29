import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { getHabitColor } from "@/lib/colors";
import { generateHeatMapData } from "../calculations";
import { useHabitStore } from "../store";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDate } from "@/lib/utils";

const LEVEL_OPACITY = [0, 0.2, 0.4, 0.65, 1];
const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];

export function HabitCalendar() {
  const { habits, completions } = useHabitStore();
  const [filterHabitId, setFilterHabitId] = useState<number | null>(null);

  const filteredHabits = filterHabitId
    ? habits.filter((h) => h.id === filterHabitId)
    : habits;

  const completionsByDate = useMemo(() => {
    const map = new Map<string, Set<number>>();
    for (const c of completions) {
      const existing = map.get(c.completed_date);
      if (existing) {
        existing.add(c.habit_id);
      } else {
        map.set(c.completed_date, new Set([c.habit_id]));
      }
    }
    return map;
  }, [completions]);

  const heatMapData = useMemo(
    () => generateHeatMapData(filteredHabits, completionsByDate, 52),
    [filteredHabits, completionsByDate],
  );

  const filterColor = filterHabitId
    ? getHabitColor(habits.find((h) => h.id === filterHabitId)?.color ?? "blue")
    : "oklch(0.68 0.16 250)";

  // Group into weeks (columns)
  const weeks: typeof heatMapData[] = [];
  for (let i = 0; i < heatMapData.length; i += 7) {
    weeks.push(heatMapData.slice(i, i + 7));
  }

  // Calculate month label positions
  const monthPositions: { label: string; x: number }[] = [];
  let lastMonth = -1;
  weeks.forEach((week, wi) => {
    const firstDay = week[0];
    if (firstDay) {
      const month = parseInt(firstDay.date.split("-")[1]) - 1;
      if (month !== lastMonth) {
        monthPositions.push({ label: MONTH_LABELS[month], x: wi });
        lastMonth = month;
      }
    }
  });

  return (
    <div className="card-elevated rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Activity</h3>
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <span>Less</span>
          {[0, 1, 2, 3, 4].map((level) => (
            <div
              key={level}
              className="h-2.5 w-2.5 rounded-[3px]"
              style={{
                backgroundColor: level === 0
                  ? "oklch(0.18 0.01 260)"
                  : filterColor,
                opacity: level === 0 ? 1 : LEVEL_OPACITY[level],
              }}
            />
          ))}
          <span>More</span>
        </div>
      </div>

      {/* Heat map grid */}
      <div className="overflow-x-auto">
        <div className="inline-flex flex-col gap-0.5" style={{ minWidth: "fit-content" }}>
          {/* Month labels */}
          <div className="relative ml-7 mb-1" style={{ height: "1rem" }}>
            {monthPositions.map((mp, i) => (
              <span
                key={i}
                className="text-[10px] text-muted-foreground absolute"
                style={{ left: mp.x * 13 }}
              >
                {mp.label}
              </span>
            ))}
          </div>

          {/* Day rows */}
          <div className="flex gap-0.5">
            {/* Day labels */}
            <div className="flex flex-col gap-0.5 mr-1">
              {DAY_LABELS.map((label, i) => (
                <div key={i} className="h-[11px] flex items-center">
                  <span className="text-[9px] text-muted-foreground w-5 text-right">
                    {label}
                  </span>
                </div>
              ))}
            </div>

            {/* Weeks */}
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-0.5">
                {week.map((day) => (
                  <Tooltip key={day.date}>
                    <TooltipTrigger asChild>
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: wi * 0.005 }}
                        className="h-[11px] w-[11px] rounded-[3px] cursor-pointer transition-all hover:ring-1 hover:ring-white/20"
                        style={{
                          backgroundColor: day.level === 0
                            ? "oklch(0.18 0.01 260)"
                            : filterColor,
                          opacity: day.level === 0 ? 1 : LEVEL_OPACITY[day.level],
                        }}
                      />
                    </TooltipTrigger>
                    <TooltipContent className="text-xs">
                      <p className="font-medium">{formatDate(day.date)}</p>
                      <p className="text-muted-foreground">
                        {day.count}/{day.total} habits completed
                      </p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filter pills */}
      {habits.length > 1 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          <Badge
            variant={filterHabitId === null ? "default" : "outline"}
            className="cursor-pointer text-[10px]"
            onClick={() => setFilterHabitId(null)}
          >
            All habits
          </Badge>
          {habits.map((h) => (
            <Badge
              key={h.id}
              variant={filterHabitId === h.id ? "default" : "outline"}
              className="cursor-pointer text-[10px]"
              onClick={() => setFilterHabitId(filterHabitId === h.id ? null : h.id)}
            >
              <div
                className="h-1.5 w-1.5 rounded-full mr-1"
                style={{ backgroundColor: getHabitColor(h.color) }}
              />
              {h.name}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
