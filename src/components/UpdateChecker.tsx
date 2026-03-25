import { useEffect, useState } from "react";
import { check } from "@tauri-apps/plugin-updater";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function UpdateChecker() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateVersion, setUpdateVersion] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    async function checkForUpdate() {
      try {
        const update = await check();
        if (update) {
          setUpdateAvailable(true);
          setUpdateVersion(update.version);
        }
      } catch (err) {
        // Silently fail — update check is best-effort
        console.debug("Update check failed:", err);
      }
    }

    // Check after a short delay so the app loads first
    const timer = setTimeout(checkForUpdate, 3000);
    return () => clearTimeout(timer);
  }, []);

  async function handleUpdate() {
    setIsUpdating(true);
    try {
      const update = await check();
      if (update) {
        // downloadAndInstall handles relaunch automatically
        await update.downloadAndInstall();
      }
    } catch (err) {
      console.error("Update failed:", err);
      setIsUpdating(false);
    }
  }

  if (!updateAvailable || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-4 right-4 z-50 flex items-center gap-3 rounded-xl bg-primary/10 border border-primary/20 px-4 py-3 shadow-lg backdrop-blur-sm"
      >
        <div className="text-sm">
          <span className="font-medium">v{updateVersion} available</span>
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
    </AnimatePresence>
  );
}
