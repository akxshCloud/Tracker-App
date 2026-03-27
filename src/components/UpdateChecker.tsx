import { useEffect, useRef, useState, useCallback } from "react";
import { check, type Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { Button } from "@/components/ui/button";
import { RefreshCw, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type UpdateState = "downloading" | "ready" | "error";

const CHECK_INTERVAL = 60 * 60 * 1000; // 1 hour

export function UpdateChecker() {
  const [state, setState] = useState<UpdateState | null>(null);
  const [updateVersion, setUpdateVersion] = useState("");
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const updateRef = useRef<Update | null>(null);
  const checkingRef = useRef(false);

  const checkAndDownload = useCallback(async () => {
    // Don't check if already downloading/ready
    if (checkingRef.current || state === "downloading" || state === "ready") return;
    checkingRef.current = true;

    try {
      const update = await check();
      if (update) {
        updateRef.current = update;
        setUpdateVersion(update.version);

        // Auto-download silently in the background
        setState("downloading");
        setProgress(0);

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
      }
    } catch (err) {
      console.debug("Update check/download failed:", err);
      setUpdateError(err instanceof Error ? err.message : "Update failed");
      setState("error");
    } finally {
      checkingRef.current = false;
    }
  }, [state]);

  useEffect(() => {
    // Check on launch after a short delay
    const initialTimer = setTimeout(checkAndDownload, 3000);

    // Then check every hour
    const interval = setInterval(checkAndDownload, CHECK_INTERVAL);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [checkAndDownload]);

  // Nothing to show if no update
  if (!state) return null;

  // While downloading, show a subtle progress indicator
  if (state === "downloading") {
    return (
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2 rounded-lg bg-primary/5 border border-primary/10 px-3 py-1.5">
        <div className="h-1.5 w-16 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary/50 rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <span className="text-[10px] text-muted-foreground font-mono">{progress}%</span>
      </div>
    );
  }

  return (
    <AnimatePresence>
      {(state === "ready" || state === "error") && (
        <motion.div
          key="update-banner"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-4 right-4 z-50 flex items-center gap-3 rounded-xl bg-primary/10 border border-primary/20 px-4 py-3 shadow-lg backdrop-blur-sm"
        >
          {state === "ready" && (
            <>
              <span className="text-sm font-medium text-positive flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" />
                v{updateVersion} ready
              </span>
              <Button size="sm" onClick={() => relaunch()} className="h-7 gap-1.5 text-xs">
                <RefreshCw className="h-3 w-3" />
                Restart
              </Button>
            </>
          )}

          {state === "error" && (
            <>
              <div className="text-sm">
                <span className="font-medium text-destructive">Update failed</span>
                {updateError && <p className="text-[10px] text-destructive/70 max-w-[200px]">{updateError}</p>}
              </div>
              <Button size="sm" variant="outline" onClick={() => { setState(null); checkAndDownload(); }} className="h-7 text-xs">
                Retry
              </Button>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
