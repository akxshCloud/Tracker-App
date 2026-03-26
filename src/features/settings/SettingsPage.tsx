import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Settings, Download, Upload, RotateCcw, CheckCircle2, AlertTriangle, Bell, BellOff } from "lucide-react";
import { useDebtStore } from "@/features/debt/store";
import { exportAllData, importAllData } from "./data-export";
import { installLaunchAgent, uninstallLaunchAgent, isLaunchAgentInstalled } from "./launch-agent";

export function SettingsPage() {
  const { initialize, reload } = useDebtStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [bgNotifyEnabled, setBgNotifyEnabled] = useState(false);
  const [bgNotifyLoading, setBgNotifyLoading] = useState(false);

  useEffect(() => {
    isLaunchAgentInstalled().then(setBgNotifyEnabled).catch(() => {});
  }, []);

  async function handleExport() {
    try {
      const json = await exportAllData();
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `life-tracker-backup-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setStatus({ type: "success", message: "Data exported successfully." });
    } catch (err) {
      console.error(err);
      setStatus({ type: "error", message: "Failed to export data." });
    }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const result = await importAllData(text);
      await reload();
      setStatus({
        type: "success",
        message: `Imported ${result.debts} debts and ${result.payments} payments.`,
      });
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Unknown error";
      setStatus({ type: "error", message: `Failed to import: ${msg}` });
    }

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleReset() {
    try {
      const { execute } = await import("@/lib/database");
      await execute("DELETE FROM payments");
      await execute("DELETE FROM debts");
      await execute("DELETE FROM settings");
      await initialize();
      setConfirmReset(false);
      setStatus({ type: "success", message: "All data has been cleared. You'll see the onboarding wizard again." });
    } catch (err) {
      console.error(err);
      setStatus({ type: "error", message: "Failed to reset data." });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Settings className="h-8 w-8" />
          Settings
        </h1>
        <p className="text-muted-foreground">
          Manage your data and preferences.
        </p>
      </div>

      {status && (
        <div className={`flex items-center gap-3 rounded-lg border p-4 ${
          status.type === "success" ? "border-primary/30 bg-primary/5" : "border-destructive/30 bg-destructive/5"
        }`}>
          {status.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0" />
          )}
          <p className="text-sm">{status.message}</p>
          <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setStatus(null)}>
            Dismiss
          </Button>
        </div>
      )}

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Background Payment Reminders</p>
              <p className="text-sm text-muted-foreground">
                Get notified about upcoming and overdue payments even when the app is closed.
                Runs daily at 9am via macOS.
              </p>
            </div>
            <Button
              variant={bgNotifyEnabled ? "destructive" : "default"}
              size="sm"
              disabled={bgNotifyLoading}
              className="gap-1.5"
              onClick={async () => {
                setBgNotifyLoading(true);
                try {
                  if (bgNotifyEnabled) {
                    await uninstallLaunchAgent();
                    setBgNotifyEnabled(false);
                    setStatus({ type: "success", message: "Background reminders disabled." });
                  } else {
                    await installLaunchAgent();
                    setBgNotifyEnabled(true);
                    setStatus({ type: "success", message: "Background reminders enabled. You'll get notifications at 9am daily." });
                  }
                } catch (err) {
                  console.error(err);
                  setStatus({ type: "error", message: "Failed to update background reminders." });
                } finally {
                  setBgNotifyLoading(false);
                }
              }}
            >
              {bgNotifyEnabled ? (
                <><BellOff className="h-3.5 w-3.5" /> Disable</>
              ) : (
                <><Bell className="h-3.5 w-3.5" /> Enable</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Data Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Export Data</p>
              <p className="text-sm text-muted-foreground">
                Download all your debts, payments, and settings as a JSON file.
              </p>
            </div>
            <Button variant="outline" onClick={handleExport} className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Import Data</p>
              <p className="text-sm text-muted-foreground">
                Restore from a previously exported JSON backup. This replaces all current data.
              </p>
            </div>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
              <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="gap-2">
                <Upload className="h-4 w-4" />
                Import
              </Button>
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-destructive">Reset All Data</p>
              <p className="text-sm text-muted-foreground">
                Delete everything and start fresh. This cannot be undone.
              </p>
            </div>
            <Button variant="destructive" onClick={() => setConfirmReset(true)} className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">About</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Version</span>
            <Badge variant="secondary">0.1.0</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Stack</span>
            <span className="text-sm font-mono">Tauri v2 + React + TypeScript</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Data</span>
            <span className="text-sm font-mono">SQLite (local only)</span>
          </div>
        </CardContent>
      </Card>

      {/* Reset confirmation dialog */}
      <Dialog open={confirmReset} onOpenChange={setConfirmReset}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-destructive">Reset All Data?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently delete all your debts, payments, and settings.
            Consider exporting a backup first.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setConfirmReset(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReset}>Yes, Delete Everything</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
