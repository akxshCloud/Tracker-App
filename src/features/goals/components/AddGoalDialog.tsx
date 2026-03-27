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
import { useGoalStore } from "../store";
import {
  GOAL_CATEGORIES,
  GOAL_COLORS,
  GOAL_ICONS,
  TARGET_TYPES,
  type GoalFormData,
  type TargetType,
} from "../types";
import { GoalIcon } from "./GoalIcon";

const initialForm: GoalFormData = {
  name: "",
  description: "",
  category: "personal",
  icon: "target",
  color: "blue",
  target_type: "percentage",
  target_value: 100,
  unit: "",
  target_date: "",
};

export function AddGoalDialog() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<GoalFormData>({ ...initialForm });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { addGoal } = useGoalStore();

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (form.target_type !== "boolean" && form.target_type !== "percentage") {
      if (form.target_value <= 0) errs.target = "Target must be greater than 0";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    await addGoal(form);
    setForm({ ...initialForm });
    setErrors({});
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-3.5 w-3.5" /> Add Goal
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Goal</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="goal-name">Name</Label>
            <Input
              id="goal-name"
              placeholder="e.g. Save £10,000 emergency fund"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="goal-desc">Description (optional)</Label>
            <Input
              id="goal-desc"
              placeholder="Why this goal matters..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          {/* Target type */}
          <div className="space-y-2">
            <Label>Target type</Label>
            <div className="grid grid-cols-2 gap-2">
              {TARGET_TYPES.map((tt) => (
                <button
                  key={tt.value}
                  onClick={() => {
                    const updates: Partial<GoalFormData> = { target_type: tt.value as TargetType };
                    if (tt.value === "percentage") updates.target_value = 100;
                    if (tt.value === "boolean") updates.target_value = 1;
                    if (tt.value === "currency") updates.unit = "£";
                    setForm({ ...form, ...updates });
                  }}
                  className={`rounded-lg border px-3 py-2 text-left transition-all ${
                    form.target_type === tt.value
                      ? "border-primary/40 bg-primary/5"
                      : "border-border/20 hover:border-border/40"
                  }`}
                >
                  <p className="text-xs font-medium">{tt.label}</p>
                  <p className="text-[10px] text-muted-foreground">{tt.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Target value */}
          {form.target_type !== "boolean" && form.target_type !== "percentage" && (
            <div className="space-y-2">
              <Label htmlFor="goal-target">Target</Label>
              <div className="flex gap-2">
                {form.target_type === "currency" && (
                  <span className="flex items-center text-sm text-muted-foreground">£</span>
                )}
                <Input
                  id="goal-target"
                  type="number"
                  min="1"
                  placeholder="e.g. 10000"
                  value={form.target_value || ""}
                  onChange={(e) => setForm({ ...form, target_value: parseFloat(e.target.value) || 0 })}
                  className="flex-1"
                />
                {form.target_type === "numeric" && (
                  <Input
                    placeholder="Unit (optional)"
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className="w-28"
                  />
                )}
              </div>
              {errors.target && <p className="text-xs text-destructive">{errors.target}</p>}
            </div>
          )}

          {/* Target date */}
          <div className="space-y-2">
            <Label htmlFor="goal-date">Target date (optional)</Label>
            <Input
              id="goal-date"
              type="date"
              value={form.target_date}
              onChange={(e) => setForm({ ...form, target_date: e.target.value })}
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Category</Label>
            <div className="flex flex-wrap gap-1.5">
              {GOAL_CATEGORIES.map((cat) => (
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
              {GOAL_ICONS.map((icon) => (
                <button
                  key={icon.value}
                  onClick={() => setForm({ ...form, icon: icon.value })}
                  className={`h-9 w-9 rounded-lg flex items-center justify-center transition-all ${
                    form.icon === icon.value
                      ? "bg-primary/15 text-primary ring-1 ring-primary/30"
                      : "bg-muted/20 text-muted-foreground hover:bg-muted/40"
                  }`}
                >
                  <GoalIcon name={icon.value} className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex gap-2">
              {GOAL_COLORS.map((c) => (
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
            <Button onClick={handleSubmit}>Create Goal</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
