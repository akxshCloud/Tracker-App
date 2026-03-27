import { useEffect, useRef, useState } from "react";
import { check, type Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { Button } from "@/components/ui/button";
import { Download, X, RefreshCw, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type UpdateState = "available" | "downloading" | "ready" | "error";

export function UpdateChecker() {
  const [state, setState] = useState<UpdateState | null>(null);
  const [updateVersion, setUpdateVersion] = useState("");
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [progress, setProgress] = useState(0);
  const updateRef = useRef<Update | null>(null);

  useEffect(() => {
    async function checkForUpdate() {
      try {
        const update = await check();
        if (update) {
          updateRef.current = update;
          setState("available");
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

    setState("downloading");
    setUpdateError(null);
    setProgress(0);

    try {
      let totalBytes = 0;
      let downloadedBytes = 0;

      await update.downloadAndInstall((event) => {
        if (event.event === "Started" && event.data.contentLength) {
          totalBytes = event.data.contentLength;
        } else if (event.event === "Progress") {
          downloadedBytes += event.data.chunkLength;
          if (totalBytes > 0) {
            setProgress(Math.round((downloadedBytes / totalBytes) * 100));
          }
        } else if (event.event === "Finished") {
          setProgress(100);
        }
      });

      setState("ready");
    } catch (err) {
      console.error("Update failed:", err);
      setUpdateError(err instanceof Error ? err.message : "Update failed");
      setState("error");
    }
  }

  async function handleRestart() {
    await relaunch();
  }

  const show = state !== null && !dismissed;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="update-banner"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-4 right-4 z-50 rounded-xl bg-primary/10 border border-primary/20 px-4 py-3 shadow-lg backdrop-blur-sm space-y-2"
        >
          <div className="flex items-center gap-3">
            <div className="text-sm">
              {state === "available" && (
                <span className="font-medium">v{updateVersion} available</span>
              )}
              {state === "downloading" && (
                <span className="font-medium">Downloading v{updateVersion}... {progress}%</span>
              )}
              {state === "ready" && (
                <span className="font-medium text-positive flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  v{updateVersion} installed
                </span>
              )}
              {state === "error" && (
                <div>
                  <span className="font-medium text-destructive">Update failed</span>
                  {updateError && <p className="text-[10px] text-destructive/70 mt-0.5 max-w-[200px]">{updateError}</p>}
                </div>
              )}
            </div>

            {state === "available" && (
              <Button size="sm" onClick={handleUpdate} className="h-7 gap-1.5 text-xs">
                <Download className="h-3 w-3" />
                Update
              </Button>
            )}

            {state === "ready" && (
              <Button size="sm" onClick={handleRestart} className="h-7 gap-1.5 text-xs">
                <RefreshCw className="h-3 w-3" />
                Restart now
              </Button>
            )}

            {state === "error" && (
              <Button size="sm" variant="outline" onClick={handleUpdate} className="h-7 gap-1.5 text-xs">
                Retry
              </Button>
            )}

            {(state === "available" || state === "error") && (
              <button onClick={() => setDismissed(true)} className="text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Progress bar */}
          {state === "downloading" && (
            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
