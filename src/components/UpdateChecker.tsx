import { useEffect, useRef, useState } from "react";
import { check, type Update } from "@tauri-apps/plugin-updater";
import { getSetting } from "@/features/debt/db";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function UpdateChecker() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateVersion, setUpdateVersion] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const updateRef = useRef<Update | null>(null);

  useEffect(() => {
    async function checkForUpdate() {
      try {
        // Get GitHub token for private repo access
        const token = await getSetting("github_token");
        const headers: Record<string, string> = {};
        if (token) {
          headers["Authorization"] = `token ${token}`;
          headers["Accept"] = "application/octet-stream";
        }

        const update = await check({ headers });
        if (update) {
          updateRef.current = update;
          setUpdateAvailable(true);
          setUpdateVersion(update.version);
        }
      } catch (err) {
        console.debug("Update check failed:", err);
      }
    }

    const timer = setTimeout(checkForUpdate, 3000);
    return () => clearTimeout(timer);
  }, []);

  async function handleUpdate() {
    const update = updateRef.current;
    if (!update) return;

    setIsUpdating(true);
    setUpdateError(null);
    try {
      // Get token for authenticated download
      const token = await getSetting("github_token");
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `token ${token}`;
        headers["Accept"] = "application/octet-stream";
      }

      await update.downloadAndInstall((progress) => {
        // Could add progress bar here in future
        console.debug("Download progress:", progress);
      });
    } catch (err) {
      console.error("Update failed:", err);
      setUpdateError("Update failed. Please try again.");
      setIsUpdating(false);
    }
  }

  return (
    <AnimatePresence>
      {updateAvailable && !dismissed && (
        <motion.div
          key="update-banner"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-4 right-4 z-50 flex items-center gap-3 rounded-xl bg-primary/10 border border-primary/20 px-4 py-3 shadow-lg backdrop-blur-sm"
        >
          <div className="text-sm">
            <span className="font-medium">v{updateVersion} available</span>
            {updateError && (
              <p className="text-xs text-destructive mt-0.5">{updateError}</p>
            )}
          </div>
          <Button
            size="sm"
            onClick={handleUpdate}
            disabled={isUpdating}
            className="h-7 gap-1.5 text-xs"
          >
            <Download className="h-3 w-3" />
            {isUpdating ? "Updating..." : "Update"}
          </Button>
          {!isUpdating && (
            <button onClick={() => setDismissed(true)} className="text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
