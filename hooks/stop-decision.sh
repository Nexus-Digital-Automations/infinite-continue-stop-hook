#!/bin/bash
# Intelligent Stop Hook - Returns JSON to control Claude Code continuation

# Suppress all output except final JSON
exec 2>/dev/null

# Detect environment
timeout 2s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" --project-root "$(pwd)" methods >/dev/null 2>&1
if [ $? -eq 0 ]; then
  ENV="LOCAL"
else
  ENV="CLOUD"
fi

# CLOUD environment - allow normal stopping
if [ "$ENV" = "CLOUD" ]; then
  echo "{}"
  exit 0
fi

# LOCAL environment - check for work
WORK_FOUND=false
REASON=""

# Check 1: Query TaskManager for approved tasks
APPROVED=$(timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" \
  --project-root "$(pwd)" \
  get-tasks-by-status approved 2>/dev/null | tail -1)

if echo "$APPROVED" | grep -q '"task_id"'; then
  WORK_FOUND=true
  TASK_COUNT=$(echo "$APPROVED" | grep -o '"task_id"' | wc -l | tr -d ' ')
  REASON="Found $TASK_COUNT approved task(s) ready to work on. Query TaskManager with get-tasks-by-status approved, claim the highest priority task, and start working immediately."
fi

# Check 2: Check for linting errors (INFORMATIONAL ONLY - LOW PRIORITY)
# Quality checks DO NOT block stopping per task-first philosophy
if [ "$WORK_FOUND" = false ]; then
  timeout 30s npm run lint > /tmp/lint-check.log 2>&1
  # Extract actual error count from "X errors" in output, not just presence of word "error"
  ERROR_COUNT=$(grep -oE '\([0-9]+ error' /tmp/lint-check.log 2>/dev/null | grep -oE '[0-9]+' | head -1)

  # Only block if there are actual errors (not warnings)
  if [ -n "$ERROR_COUNT" ] && [ "$ERROR_COUNT" -gt 0 ]; then
    # SKIP linting check - tasks are more important than quality
    # Per task-first philosophy: Tasks > Functionality > Quality
    # Linting warnings/errors do NOT block task completion
    echo "# Linting has $ERROR_COUNT errors but not blocking per task-first philosophy" >&2
  fi
fi

# Check 3: Check for failing tests (if no tasks or lint errors)
if [ "$WORK_FOUND" = false ]; then
  timeout 60s npm test > /tmp/test-check.log 2>&1
  if grep -q "FAIL\|failed" /tmp/test-check.log 2>/dev/null; then
    WORK_FOUND=true
    REASON="Tests are failing. Run 'npm test' to see failures, then investigate and fix the failing tests."
  fi
fi

# Check 4: Check for security vulnerabilities (if no other work)
if [ "$WORK_FOUND" = false ]; then
  AUDIT=$(npm audit --audit-level=high 2>&1)
  CRITICAL=$(echo "$AUDIT" | grep -o "[0-9]* critical" | head -1 | awk '{print $1}')
  HIGH=$(echo "$AUDIT" | grep -o "[0-9]* high" | head -1 | awk '{print $1}')

  if [ -n "$CRITICAL" ] && [ "$CRITICAL" != "0" ]; then
    WORK_FOUND=true
    REASON="Found $CRITICAL critical security vulnerabilities. Run 'npm audit' to see details, then fix the vulnerabilities immediately."
  elif [ -n "$HIGH" ] && [ "$HIGH" != "0" ]; then
    WORK_FOUND=true
    REASON="Found $HIGH high-severity security vulnerabilities. Run 'npm audit' to see details, then address the vulnerabilities."
  fi
fi

# Return JSON decision
if [ "$WORK_FOUND" = true ]; then
  # Block stopping - force continuation
  cat << EOF
{
  "decision": "block",
  "reason": "$REASON"
}
EOF
else
  # Allow stopping - no work found
  echo "{}"
fi
