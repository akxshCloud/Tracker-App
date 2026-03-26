import { writeTextFile, exists, remove, mkdir } from "@tauri-apps/plugin-fs";
import { appDataDir } from "@tauri-apps/api/path";
import { homeDir } from "@tauri-apps/api/path";
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
    <key>RunAtLoad</key>
    <true/>
    <key>StandardErrorPath</key>
    <string>/tmp/life-tracker-notify.err</string>
</dict>
</plist>`;
}

// The shell script content — embedded so we can install it to the app data directory
const SCRIPT_CONTENT = `#!/bin/bash
# Life Tracker — Background Payment Reminder
DB_PATH="$HOME/Library/Application Support/com.akash.life-tracker/tracker.db"
STATE_FILE="$HOME/Library/Application Support/com.akash.life-tracker/.last_bg_notify"

if [ ! -f "$DB_PATH" ]; then exit 0; fi

TODAY=$(date +%Y-%m-%d)
if [ -f "$STATE_FILE" ] && [ "$(cat "$STATE_FILE")" = "$TODAY" ]; then exit 0; fi

CURRENT_DAY=$(date +%-d)
DEBTS=$(sqlite3 "$DB_PATH" "SELECT name, due_day, minimum_payment, current_balance FROM debts WHERE due_day IS NOT NULL AND current_balance > 0 ORDER BY due_day ASC;")
if [ -z "$DEBTS" ]; then exit 0; fi

NOTIFIED=0
while IFS='|' read -r NAME DUE_DAY MIN_PAYMENT BALANCE; do
  DAYS_UNTIL=$((DUE_DAY - CURRENT_DAY))
  PAYMENT=$(printf "£%.2f" "$MIN_PAYMENT")

  if [ "$DAYS_UNTIL" -lt 0 ] && [ "$DAYS_UNTIL" -ge -7 ]; then
    DAYS_AGO=$(( -DAYS_UNTIL ))
    osascript -e "display notification \\"Payment of $PAYMENT was due \${DAYS_AGO} day(s) ago\\" with title \\"Overdue: $NAME\\" sound name \\"Basso\\""
    NOTIFIED=1
  elif [ "$DAYS_UNTIL" -eq 0 ]; then
    osascript -e "display notification \\"$PAYMENT payment due today\\" with title \\"Due today: $NAME\\" sound name \\"Glass\\""
    NOTIFIED=1
  elif [ "$DAYS_UNTIL" -ge 1 ] && [ "$DAYS_UNTIL" -le 3 ]; then
    osascript -e "display notification \\"$PAYMENT due in $DAYS_UNTIL day(s)\\" with title \\"Payment due soon: $NAME\\" sound name \\"Pop\\""
    NOTIFIED=1
  fi
done <<< "$DEBTS"

if [ "$NOTIFIED" -eq 1 ]; then echo "$TODAY" > "$STATE_FILE"; fi
`;

export async function installLaunchAgent(): Promise<void> {
  // Write the script to app data directory
  const scriptPath = await getScriptPath();
  const appData = await appDataDir();

  // Ensure app data directory exists
  if (!(await exists(appData))) {
    await mkdir(appData, { recursive: true });
  }

  await writeTextFile(scriptPath, SCRIPT_CONTENT);

  // Make script executable
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

  // Load the agent
  const launchctl = Command.create("launchctl", ["load", plistPath]);
  await launchctl.execute();
}

export async function uninstallLaunchAgent(): Promise<void> {
  const plistPath = await getPlistPath();

  // Unload the agent
  try {
    const launchctl = Command.create("launchctl", ["unload", plistPath]);
    await launchctl.execute();
  } catch {
    // May already be unloaded
  }

  // Remove the plist
  if (await exists(plistPath)) {
    await remove(plistPath);
  }

  // Remove the script
  const scriptPath = await getScriptPath();
  if (await exists(scriptPath)) {
    await remove(scriptPath);
  }
}

export async function isLaunchAgentInstalled(): Promise<boolean> {
  const plistPath = await getPlistPath();
  return exists(plistPath);
}
