import { writeTextFile, exists, remove, mkdir } from "@tauri-apps/plugin-fs";
import { appDataDir, homeDir } from "@tauri-apps/api/path";
import { Command } from "@tauri-apps/plugin-shell";

const AGENT_LABEL = "com.akash.life-tracker.payment-reminders";
const PLIST_FILENAME = `${AGENT_LABEL}.plist`;
const SCRIPT_NAME = "check-payments.sh";

async function getScriptPath(): Promise<string> {
  const appData = await appDataDir();
  return `${appData}/${SCRIPT_NAME}`;
}

async function getPlistPath(): Promise<string> {
  const home = await homeDir();
  return `${home}/Library/LaunchAgents/${PLIST_FILENAME}`;
}

function generatePlist(scriptPath: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>${AGENT_LABEL}</string>
    <key>ProgramArguments</key>
    <array>
        <string>/bin/bash</string>
        <string>${scriptPath}</string>
    </array>
    <key>StartCalendarInterval</key>
    <dict>
        <key>Hour</key>
        <integer>9</integer>
        <key>Minute</key>
        <integer>0</integer>
    </dict>
    <key>StandardErrorPath</key>
    <string>/tmp/life-tracker-notify.err</string>
</dict>
</plist>`;
}

// The script sanitises debt names to prevent shell injection via osascript.
// Uses proper calendar arithmetic for month boundaries.
const SCRIPT_CONTENT = `#!/bin/bash
# Life Tracker — Background Payment Reminder
DB_PATH="$HOME/Library/Application Support/com.akash.life-tracker/tracker.db"
STATE_FILE="$HOME/Library/Application Support/com.akash.life-tracker/.last_bg_notify"

if [ ! -f "$DB_PATH" ]; then exit 0; fi

TODAY=$(date +%Y-%m-%d)
if [ -f "$STATE_FILE" ] && [ "$(cat "$STATE_FILE")" = "$TODAY" ]; then exit 0; fi

CURRENT_DAY=$(date +%-d)
DAYS_IN_MONTH=$(date -v1d -v+1m -v-1d +%-d 2>/dev/null || date +%-d)

DEBTS=$(sqlite3 "$DB_PATH" "SELECT name, due_day, minimum_payment, current_balance FROM debts WHERE due_day IS NOT NULL AND current_balance > 0 ORDER BY due_day ASC;")
if [ -z "$DEBTS" ]; then exit 0; fi

NOTIFIED=0
while IFS='|' read -r NAME DUE_DAY MIN_PAYMENT BALANCE; do
  # Sanitise name to prevent shell injection in osascript
  SAFE_NAME=$(printf '%s' "$NAME" | tr -d '"\\\`$')

  # Calculate days until due with proper month boundary handling
  if [ "$DUE_DAY" -ge "$CURRENT_DAY" ]; then
    DAYS_UNTIL=$((DUE_DAY - CURRENT_DAY))
  else
    # Due day is in the past this month — check if overdue or next month
    DAYS_PAST=$((CURRENT_DAY - DUE_DAY))
    if [ "$DAYS_PAST" -le 7 ]; then
      DAYS_UNTIL=$((-DAYS_PAST))
    else
      # Next month
      DAYS_UNTIL=$(( (DAYS_IN_MONTH - CURRENT_DAY) + DUE_DAY ))
    fi
  fi

  PAYMENT=$(printf '%.2f' "$MIN_PAYMENT")

  if [ "$DAYS_UNTIL" -lt 0 ] && [ "$DAYS_UNTIL" -ge -7 ]; then
    DAYS_AGO=$(( -DAYS_UNTIL ))
    osascript -e "display notification \\"Payment of £$PAYMENT was due $DAYS_AGO day(s) ago\\" with title \\"Overdue: $SAFE_NAME\\" sound name \\"Basso\\""
    NOTIFIED=1
  elif [ "$DAYS_UNTIL" -eq 0 ]; then
    osascript -e "display notification \\"£$PAYMENT payment due today\\" with title \\"Due today: $SAFE_NAME\\" sound name \\"Glass\\""
    NOTIFIED=1
  elif [ "$DAYS_UNTIL" -ge 1 ] && [ "$DAYS_UNTIL" -le 3 ]; then
    osascript -e "display notification \\"£$PAYMENT due in $DAYS_UNTIL day(s)\\" with title \\"Payment due soon: $SAFE_NAME\\" sound name \\"Pop\\""
    NOTIFIED=1
  fi
done <<< "$DEBTS"

if [ "$NOTIFIED" -eq 1 ]; then echo "$TODAY" > "$STATE_FILE"; fi
`;

export async function installLaunchAgent(): Promise<void> {
  const scriptPath = await getScriptPath();
  const appData = await appDataDir();

  if (!(await exists(appData))) {
    await mkdir(appData, { recursive: true });
  }

  await writeTextFile(scriptPath, SCRIPT_CONTENT);

  // Make script executable — scoped args
  const chmod = Command.create("chmod", ["+x", scriptPath]);
  await chmod.execute();

  // Write the plist
  const plistPath = await getPlistPath();
  const home = await homeDir();
  const launchAgentsDir = `${home}/Library/LaunchAgents`;

  if (!(await exists(launchAgentsDir))) {
    await mkdir(launchAgentsDir, { recursive: true });
  }

  await writeTextFile(plistPath, generatePlist(scriptPath));

  // Load the agent using modern launchctl (bootstrap instead of deprecated load)
  const bootstrap = Command.create("bash", [
    "-c",
    `launchctl bootstrap gui/$(id -u) "${plistPath}"`,
  ]);
  await bootstrap.execute();
}

export async function uninstallLaunchAgent(): Promise<void> {
  const plistPath = await getPlistPath();

  // Unload using modern launchctl (bootout instead of deprecated unload)
  try {
    const bootout = Command.create("bash", [
      "-c",
      `launchctl bootout gui/$(id -u)/${AGENT_LABEL}`,
    ]);
    await bootout.execute();
  } catch {
    // May already be unloaded
  }

  if (await exists(plistPath)) {
    await remove(plistPath);
  }

  const scriptPath = await getScriptPath();
  if (await exists(scriptPath)) {
    await remove(scriptPath);
  }
}

export async function isLaunchAgentInstalled(): Promise<boolean> {
  // Check if the agent is actually loaded, not just if the plist file exists
  try {
    const result = Command.create("bash", [
      "-c",
      `launchctl print gui/$(id -u)/${AGENT_LABEL} 2>/dev/null && echo "LOADED" || echo "NOT_LOADED"`,
    ]);
    const output = await result.execute();
    return output.stdout.includes("LOADED") && !output.stdout.includes("NOT_LOADED");
  } catch {
    return false;
  }
}
