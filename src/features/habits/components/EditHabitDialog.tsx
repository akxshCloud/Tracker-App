import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
  type Habit,
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

interface EditHabitDialogProps {
  habit: Habit | null;
  onClose: () => void;
}

export function EditHabitDialog({ habit, onClose }: EditHabitDialogProps) {
  const { updateHabit } = useHabitStore();
  const [form, setForm] = useState<HabitFormData>({
    name: "",
    description: "",
    icon: "circle-check",
    color: "blue",
    frequency_type: "daily",
    frequency_value: null,
    category: "general",
  });
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>([]);
  const [timesPerWeek, setTimesPerWeek] = useState("3");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (habit) {
      setForm({
        name: habit.name,
        description: habit.description ?? "",
        icon: habit.icon,
        color: habit.color,
        frequency_type: habit.frequency_type,
        frequency_value: habit.frequency_value,
        category: habit.category,
      });
      if (habit.frequency_type === "specific_days" && habit.frequency_value) {
        setSelectedDays(JSON.parse(habit.frequency_value));
      } else {
        setSelectedDays([]);
      }
      if (habit.frequency_type === "times_per_week" && habit.frequency_value) {
        setTimesPerWeek(habit.frequency_value);
      }
    }
  }, [habit]);

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
    if (!habit || !validate()) return;

    let frequencyValue: string | null = null;
    if (form.frequency_type === "specific_days") {
      frequencyValue = JSON.stringify(selectedDays);
    } else if (form.frequency_type === "times_per_week") {
      frequencyValue = timesPerWeek;
    }

    await updateHabit(habit.id, { ...form, frequency_value: frequencyValue });
    onClose();
  }

  function toggleDay(day: DayOfWeek) {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  }

  return (
    <Dialog open={!!habit} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Habit</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          <div className="space-y-2">
            <Label htmlFor="edit-habit-name">Name</Label>
            <Input
              id="edit-habit-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-habit-desc">Description (optional)</Label>
            <Input
              id="edit-habit-desc"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

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

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>Save Changes</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
