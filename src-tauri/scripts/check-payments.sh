#!/bin/bash
# Life Tracker — Background Payment Reminder
# Runs daily via macOS launchd. Checks SQLite for upcoming/overdue payments
# and sends native macOS notifications via osascript.

DB_PATH="$HOME/Library/Application Support/com.akash.life-tracker/tracker.db"
STATE_FILE="$HOME/Library/Application Support/com.akash.life-tracker/.last_bg_notify"

# Exit if database doesn't exist
if [ ! -f "$DB_PATH" ]; then
  exit 0
fi

# Only notify once per day
TODAY=$(date +%Y-%m-%d)
if [ -f "$STATE_FILE" ] && [ "$(cat "$STATE_FILE")" = "$TODAY" ]; then
  exit 0
fi

CURRENT_DAY=$(date +%-d)
CURRENT_MONTH=$(date +%-m)
CURRENT_YEAR=$(date +%Y)

# Query debts with due days that have a balance > 0
DEBTS=$(sqlite3 "$DB_PATH" "SELECT name, due_day, minimum_payment, current_balance FROM debts WHERE due_day IS NOT NULL AND current_balance > 0 ORDER BY due_day ASC;")

if [ -z "$DEBTS" ]; then
  exit 0
fi

NOTIFIED=0

while IFS='|' read -r NAME DUE_DAY MIN_PAYMENT BALANCE; do
  # Calculate days until due
  if [ "$DUE_DAY" -ge "$CURRENT_DAY" ]; then
    DAYS_UNTIL=$((DUE_DAY - CURRENT_DAY))
  else
    # Due day has passed this month
    DAYS_UNTIL=$((DUE_DAY - CURRENT_DAY))
  fi

  # Format payment amount
  PAYMENT=$(printf "£%.2f" "$MIN_PAYMENT")

  if [ "$DAYS_UNTIL" -lt 0 ] && [ "$DAYS_UNTIL" -ge -7 ]; then
    # Overdue (within last 7 days)
    DAYS_AGO=$(( -DAYS_UNTIL ))
    osascript -e "display notification \"Payment of $PAYMENT was due ${DAYS_AGO} day(s) ago\" with title \"⚠️ Overdue: $NAME\" sound name \"Basso\""
    NOTIFIED=1
  elif [ "$DAYS_UNTIL" -eq 0 ]; then
    # Due today
    osascript -e "display notification \"$PAYMENT payment due today\" with title \"💰 Due today: $NAME\" sound name \"Glass\""
    NOTIFIED=1
  elif [ "$DAYS_UNTIL" -ge 1 ] && [ "$DAYS_UNTIL" -le 3 ]; then
    # Due soon
    osascript -e "display notification \"$PAYMENT due in $DAYS_UNTIL day(s)\" with title \"📅 Payment due soon: $NAME\" sound name \"Pop\""
    NOTIFIED=1
  fi
done <<< "$DEBTS"

# Mark as notified today
if [ "$NOTIFIED" -eq 1 ]; then
  echo "$TODAY" > "$STATE_FILE"
fi
