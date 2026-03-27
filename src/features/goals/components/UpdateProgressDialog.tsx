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
import { useGoalStore } from "../store";
import { getProgressLabel, getTargetLabel } from "../calculations";
import type { Goal } from "../types";

interface UpdateProgressDialogProps {
  goal: Goal | null;
  onClose: () => void;
}

export function UpdateProgressDialog({ goal, onClose }: UpdateProgressDialogProps) {
  const { updateProgress } = useGoalStore();
  const [value, setValue] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (goal) {
      setValue(String(goal.current_value));
      setNotes("");
      setError("");
    }
  }, [goal]);

  async function handleSubmit() {
    if (!goal) return;
    const num = parseFloat(value);
    if (isNaN(num)) {
      setError("Enter a valid number");
      return;
    }
    if (num < 0) {
      setError("Value cannot be negative");
      return;
    }

    await updateProgress(goal.id, num, notes || undefined);
    onClose();
  }

  return (
    <Dialog
      open={!!goal}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Update Progress</DialogTitle>
        </DialogHeader>

        {goal && (
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              {goal.name} — currently {getProgressLabel(goal)} of {getTargetLabel(goal)}
            </p>

            <div className="space-y-2">
              <Label htmlFor="progress-value">
                New value
                {goal.target_type === "currency" && " (£)"}
                {goal.target_type === "percentage" && " (%)"}
                {goal.unit && goal.target_type === "numeric" && ` (${goal.unit})`}
              </Label>
              <Input
                id="progress-value"
                type="number"
                min="0"
                step={goal.target_type === "currency" ? "0.01" : "1"}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                autoFocus
              />
              {error && <p className="text-xs text-destructive">{error}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="progress-notes">Notes (optional)</Label>
              <Input
                id="progress-notes"
                placeholder="What progress did you make?"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>Save</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
