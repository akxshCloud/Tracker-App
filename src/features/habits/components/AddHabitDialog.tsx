import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useHabitStore } from "../store";
import {
  HABIT_CATEGORIES,
  HABIT_COLORS,
  HABIT_ICONS,
  DAYS_OF_WEEK,
  type HabitFormData,
  type FrequencyType,
  type DayOfWeek,
} from "../types";
import { HabitIcon } from "./HabitIcon";

const FREQUENCY_OPTIONS: { value: FrequencyType; label: string }[] = [
  { value: "daily", label: "Every day" },
  { value: "specific_days", label: "Specific days" },
  { value: "times_per_week", label: "Times per week" },
];

const initialForm: HabitFormData = {
  name: "",
  description: "",
  icon: "circle-check",
  color: "blue",
  frequency_type: "daily",
  frequency_value: null,
  category: "general",
};

export function AddHabitDialog() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<HabitFormData>({ ...initialForm });
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>([]);
  const [timesPerWeek, setTimesPerWeek] = useState("3");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { addHabit } = useHabitStore();

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (form.frequency_type === "specific_days" && selectedDays.length === 0) {
      errs.frequency = "Select at least one day";
    }
    if (form.frequency_type === "times_per_week") {
      const n = parseInt(timesPerWeek);
      if (isNaN(n) || n < 1 || n > 7) errs.frequency = "Enter 1-7";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;

    let frequencyValue: string | null = null;
    if (form.frequency_type === "specific_days") {
      frequencyValue = JSON.stringify(selectedDays);
    } else if (form.frequency_type === "times_per_week") {
      frequencyValue = timesPerWeek;
    }

    await addHabit({ ...form, frequency_value: frequencyValue });
    setForm({ ...initialForm });
    setSelectedDays([]);
    setTimesPerWeek("3");
    setErrors({});
    setOpen(false);
  }

  function toggleDay(day: DayOfWeek) {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-3.5 w-3.5" /> Add Habit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Habit</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="habit-name">Name</Label>
            <Input
              id="habit-name"
              placeholder="e.g. Read for 30 minutes"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="habit-desc">Description (optional)</Label>
            <Input
              id="habit-desc"
              placeholder="Why this habit matters..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          {/* Frequency */}
          <div className="space-y-2">
            <Label>Frequency</Label>
            <div className="flex flex-wrap gap-1.5">
              {FREQUENCY_OPTIONS.map((opt) => (
                <Badge
                  key={opt.value}
                  variant={form.frequency_type === opt.value ? "default" : "outline"}
                  className="cursor-pointer text-xs"
                  onClick={() => setForm({ ...form, frequency_type: opt.value })}
                >
                  {opt.label}
                </Badge>
              ))}
            </div>

            {form.frequency_type === "specific_days" && (
              <div className="flex gap-1.5 pt-1">
                {DAYS_OF_WEEK.map((day) => (
                  <button
                    key={day.value}
                    onClick={() => toggleDay(day.value)}
                    className={`h-8 w-8 rounded-full text-xs font-medium transition-all ${
                      selectedDays.includes(day.value)
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
                    }`}
                  >
                    {day.short}
                  </button>
                ))}
              </div>
            )}

            {form.frequency_type === "times_per_week" && (
              <div className="flex items-center gap-2 pt-1">
                <Input
                  type="number"
                  min="1"
                  max="7"
                  value={timesPerWeek}
                  onChange={(e) => setTimesPerWeek(e.target.value)}
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">times per week</span>
              </div>
            )}

            {errors.frequency && <p className="text-xs text-destructive">{errors.frequency}</p>}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Category</Label>
            <div className="flex flex-wrap gap-1.5">
              {HABIT_CATEGORIES.map((cat) => (
                <Badge
                  key={cat.value}
                  variant={form.category === cat.value ? "default" : "outline"}
                  className="cursor-pointer text-xs"
                  onClick={() => setForm({ ...form, category: cat.value })}
                >
                  {cat.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Icon */}
          <div className="space-y-2">
            <Label>Icon</Label>
            <div className="flex flex-wrap gap-1.5">
              {HABIT_ICONS.map((icon) => (
                <button
                  key={icon.value}
                  onClick={() => setForm({ ...form, icon: icon.value })}
                  className={`h-9 w-9 rounded-lg flex items-center justify-center transition-all ${
                    form.icon === icon.value
                      ? "bg-primary/15 text-primary ring-1 ring-primary/30"
                      : "bg-muted/20 text-muted-foreground hover:bg-muted/40"
                  }`}
                >
                  <HabitIcon name={icon.value} className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex gap-2">
              {HABIT_COLORS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setForm({ ...form, color: c.value })}
                  className={`h-7 w-7 rounded-full transition-all ${
                    form.color === c.value ? "ring-2 ring-offset-2 ring-offset-background" : ""
                  }`}
                  style={{
                    backgroundColor: c.css,
                    "--tw-ring-color": form.color === c.value ? c.css : undefined,
                  } as React.CSSProperties}
                />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>Create Habit</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
