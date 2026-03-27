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
import { useGoalStore } from "../store";
import {
  GOAL_CATEGORIES,
  GOAL_COLORS,
  GOAL_ICONS,
  type Goal,
  type GoalFormData,
} from "../types";
import { GoalIcon } from "./GoalIcon";

interface EditGoalDialogProps {
  goal: Goal | null;
  onClose: () => void;
}

export function EditGoalDialog({ goal, onClose }: EditGoalDialogProps) {
  const { updateGoal } = useGoalStore();
  const [form, setForm] = useState<GoalFormData>({
    name: "",
    description: "",
    category: "personal",
    icon: "target",
    color: "blue",
    target_type: "percentage",
    target_value: 100,
    unit: "",
    target_date: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (goal) {
      setForm({
        name: goal.name,
        description: goal.description ?? "",
        category: goal.category,
        icon: goal.icon,
        color: goal.color,
        target_type: goal.target_type,
        target_value: goal.target_value,
        unit: goal.unit ?? "",
        target_date: goal.target_date ?? "",
      });
    }
  }, [goal]);

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Name is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit() {
    if (!goal || !validate()) return;
    await updateGoal(goal.id, form);
    onClose();
  }

  return (
    <Dialog open={!!goal} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Goal</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          <div className="space-y-2">
            <Label htmlFor="edit-goal-name">Name</Label>
            <Input
              id="edit-goal-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-goal-desc">Description (optional)</Label>
            <Input
              id="edit-goal-desc"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          {form.target_type !== "boolean" && form.target_type !== "percentage" && (
            <div className="space-y-2">
              <Label htmlFor="edit-goal-target">Target</Label>
              <div className="flex gap-2">
                {form.target_type === "currency" && (
                  <span className="flex items-center text-sm text-muted-foreground">£</span>
                )}
                <Input
                  id="edit-goal-target"
                  type="number"
                  min="1"
                  value={form.target_value || ""}
                  onChange={(e) => setForm({ ...form, target_value: parseFloat(e.target.value) || 0 })}
                  className="flex-1"
                />
                {form.target_type === "numeric" && (
                  <Input
                    placeholder="Unit"
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className="w-28"
                  />
                )}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="edit-goal-date">Target date (optional)</Label>
            <Input
              id="edit-goal-date"
              type="date"
              value={form.target_date}
              onChange={(e) => setForm({ ...form, target_date: e.target.value })}
            />
          </div>

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
