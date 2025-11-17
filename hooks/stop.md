# ⚠️ MANDATORY: Stop Hook
# 🔴 NON-NEGOTIABLE - AUTONOMOUS CONTINUATION REQUIRED

**ENFORCEMENT**: This hook executes when Claude is about to conclude response. NEVER sit idle - ALWAYS find next work.

**VIOLATION CONSEQUENCE**: Sitting idle with available work is a CRITICAL PROTOCOL FAILURE.

**CORE PRINCIPLE**: **YOU ARE THE SAME AGENT - STAY ACTIVE - KEEP WORKING**

---

## CRITICAL: Don't Stop - Find Next Work [MANDATORY]

**ABSOLUTE REQUIREMENT**: NEVER conclude without either:
1. Continuing current work
2. Starting next approved task
3. Performing maintenance work
4. Issuing emergency stop (ONLY if truly no work after exhaustive search)

**FORBIDDEN RESPONSES**:
- ❌ "What should I do next?"
- ❌ "Ready for your next instruction"
- ❌ "Waiting for tasks"
- ❌ "Is there anything else?"

**REQUIRED RESPONSES**:
- ✅ "Continuing work on [task]... [what I'm doing now]"
- ✅ "Task complete, starting next approved task: [task]"
- ✅ "No approved tasks, running security audit..."
- ✅ "Emergency stop initiated after exhaustive search (no work available)"

---

## STEP 1: Environment Check [MANDATORY]

```bash
# MANDATORY: Detect environment
timeout 2s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" --project-root "$(pwd)" methods 2>/dev/null
if [ $? -eq 0 ]; then
  ENV="LOCAL"
else
  ENV="CLOUD"
fi
```

---

## CLOUD ENVIRONMENT - Standard Completion [MANDATORY]

**If CLOUD environment**:

1. **MANDATORY**: Complete all TodoWrite tasks
2. **MANDATORY**: Update TASKS.json with progress
3. **MANDATORY**: Standard workflow completion

**NO autonomous continuation in CLOUD** - hooks not available

---

## LOCAL ENVIRONMENT - Autonomous Continuation [MANDATORY]

**If LOCAL environment, MUST query and continue**:

### Query Current State [MANDATORY]

```bash
echo "🔍 MANDATORY: Querying TaskManager for continuation..."

# MANDATORY Query 1: Get agent's current tasks
timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" \
  --project-root "$(pwd)" \
  get-agent-tasks [AGENT_ID] | tee .validation-artifacts/logs/agent-tasks-$(date +%Y%m%d-%H%M%S).log

# MANDATORY Query 2: Get approved tasks
timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" \
  --project-root "$(pwd)" \
  get-tasks-by-status approved | tee .validation-artifacts/logs/approved-tasks-$(date +%Y%m%d-%H%M%S).log

# MANDATORY Query 3: Get task statistics
timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" \
  --project-root "$(pwd)" \
  get-task-stats | tee .validation-artifacts/logs/task-stats-$(date +%Y%m%d-%H%M%S).log

# Parse results
CURRENT_TASKS=$(parse count from agent-tasks)
APPROVED_TASKS=$(parse count from approved-tasks)
```

**ENFORCEMENT**: Cannot proceed without querying TaskManager state

---

### Decision Tree: What to Do Next [MANDATORY]

**OPTION 1: Continue Current Task** [HIGHEST PRIORITY]

If current task incomplete:

```bash
echo "📋 MANDATORY: Continuing work on current task..."

# MANDATORY: Get task details
TASK_DETAILS=$(timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" \
  --project-root "$(pwd)" \
  get-task "$CURRENT_TASK_ID")

# MANDATORY: Check validation requirements
VALIDATIONS_REMAINING=$(identify which validations not yet passed)

if [ -n "$VALIDATIONS_REMAINING" ]; then
  echo "🚀 Continuing implementation..."
  echo "   Remaining validations: $VALIDATIONS_REMAINING"
  echo "   Current progress: $PROGRESS_PCT%"

  # MANDATORY: Continue working on task
  # DO NOT STOP - IMPLEMENT NEXT STEP
fi
```

**ENFORCEMENT**: If task in-progress, MUST continue until complete

---

**OPTION 2: Validate & Complete Current Task** [HIGH PRIORITY]

If all implementation done but not validated:

```bash
echo "🔍 MANDATORY: Running final validation suite..."

# MANDATORY: Execute all required validations (from PostToolUse hook)
# - Full test suite
# - Build verification
# - Runtime verification
# - E2E tests
# - Security scan
# - Performance metrics
# - Evidence collection

# If ALL validations pass:
if [ "$ALL_VALIDATIONS_PASSED" = "true" ]; then
  echo "✅ All validations passed - marking task complete"

  # MANDATORY: Update task to completed
  timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" \
    --project-root "$(pwd)" \
    update-task "$CURRENT_TASK_ID" "{
      \"status\": \"completed\",
      \"completed_at\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\",
      \"progress_percentage\": 100
    }"

  echo "✅ Task completed successfully"

  # MANDATORY: Move to next task (Option 3)
  # DO NOT STOP - FIND NEXT WORK
fi
```

**ENFORCEMENT**: If task ready for validation, MUST validate before concluding

---

**OPTION 3: Start Next Approved Task** [NORMAL PRIORITY]

If no current task or current task complete:

```bash
echo "🔍 MANDATORY: Finding next approved task..."

# MANDATORY: Get highest priority approved task
NEXT_TASK=$(get highest priority from approved tasks based on:
  1. Priority (urgent > high > normal > low)
  2. Type (error > feature > test > audit)
  3. Dependencies (tasks with no blockers first)
)

if [ -n "$NEXT_TASK" ]; then
  echo "📋 MANDATORY: Claiming next approved task"
  echo "   Task: $NEXT_TASK"
  echo "   Priority: $TASK_PRIORITY"
  echo "   Type: $TASK_TYPE"

  # MANDATORY: Claim task
  timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" \
    --project-root "$(pwd)" \
    update-task "$NEXT_TASK" "{
      \"status\": \"in-progress\",
      \"assigned_to\": \"[AGENT_ID]\",
      \"assigned_at\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"
    }"

  echo "🚀 Starting work on new task NOW..."

  # MANDATORY: Read task requirements
  # MANDATORY: Search for relevant lessons
  # MANDATORY: Begin implementation
  # DO NOT STOP - START WORKING
fi
```

**ENFORCEMENT**: If approved tasks exist, MUST claim and start working

---

**OPTION 4: Maintenance Work** [LOW PRIORITY]

If no approved tasks:

```bash
echo "🧹 MANDATORY: No approved tasks - running maintenance checks..."

# MANDATORY Maintenance Check 1: Linting
echo "🔍 Checking linting status..."
timeout 30s npm run lint 2>&1 | tee .validation-artifacts/logs/maintenance-lint.log | head -50

LINT_ERRORS=$(grep -c "error" .validation-artifacts/logs/maintenance-lint.log 2>/dev/null || echo "0")

if [ "$LINT_ERRORS" -gt 0 ]; then
  echo "🔧 FOUND WORK: Fixing $LINT_ERRORS linting errors..."
  echo "Running autofix..."
  npm run lint:fix 2>&1 | tee .validation-artifacts/logs/lint-autofix.log
  # DO NOT STOP - FIX LINTING ERRORS
fi

# MANDATORY Maintenance Check 2: Tests
echo "🔍 Checking test status..."
timeout 60s npm test 2>&1 | tee .validation-artifacts/logs/maintenance-tests.log | head -50

if grep -q "FAIL\|failed" .validation-artifacts/logs/maintenance-tests.log; then
  echo "🔧 FOUND WORK: Investigating test failures..."
  # DO NOT STOP - FIX FAILING TESTS
fi

# MANDATORY Maintenance Check 3: Security
echo "🔍 Checking security vulnerabilities..."
npm audit --audit-level=high 2>&1 | tee .validation-artifacts/logs/maintenance-security.log | head -50

CRITICAL_VULNS=$(grep -o "[0-9]* critical" .validation-artifacts/logs/maintenance-security.log | head -1)
HIGH_VULNS=$(grep -o "[0-9]* high" .validation-artifacts/logs/maintenance-security.log | head -1)

if [[ "$CRITICAL_VULNS" != "0 critical" ]] || [[ "$HIGH_VULNS" != "0 high" ]]; then
  echo "🔧 FOUND WORK: Fixing security vulnerabilities..."
  echo "   Critical: $CRITICAL_VULNS"
  echo "   High: $HIGH_VULNS"
  # DO NOT STOP - FIX SECURITY ISSUES
fi

# MANDATORY Maintenance Check 4: Documentation
echo "🔍 Checking documentation completeness..."
if [ -f "CLAUDE.md" ] && [ -f "README.md" ]; then
  # Check if docs are up to date
  LAST_CODE_CHANGE=$(git log -1 --format=%cd lib/ src/ 2>/dev/null)
  LAST_DOC_CHANGE=$(git log -1 --format=%cd README.md docs/ 2>/dev/null)

  if [[ "$LAST_CODE_CHANGE" > "$LAST_DOC_CHANGE" ]]; then
    echo "🔧 FOUND WORK: Documentation may be outdated..."
    # DO NOT STOP - UPDATE DOCUMENTATION
  fi
fi

# MANDATORY Maintenance Check 5: Code quality
echo "🔍 Analyzing code quality..."
# Check for TODO comments, code duplication, etc.
```

**ENFORCEMENT**: If no tasks, MUST search for maintenance work

---

**OPTION 5: Emergency Stop** [LAST RESORT ONLY]

**ONLY if stop hook called 2nd consecutive time with absolutely no work**:

```bash
# MANDATORY: Check if this is 2nd consecutive stop with no work
if [ "$CONSECUTIVE_STOPS_WITH_NO_WORK" -ge 2 ]; then
  # MANDATORY: Check emergency stop cooldown
  LAST_EMERGENCY_STOP=$(get timestamp of last emergency stop from TaskManager)
  CURRENT_TIME=$(date +%s)
  TIME_SINCE=$((CURRENT_TIME - LAST_EMERGENCY_STOP))

  if [ $TIME_SINCE -gt 60 ]; then
    echo "⏸️  INITIATING EMERGENCY STOP"
    echo "🔴 Reason: No work available after exhaustive search"
    echo ""
    echo "Verified:"
    echo "- No in-progress tasks"
    echo "- No approved tasks"
    echo "- No linting errors"
    echo "- No failing tests"
    echo "- No security vulnerabilities"
    echo "- No documentation gaps"
    echo "- No code quality issues"
    echo ""

    # MANDATORY: Issue emergency stop
    timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" \
      --project-root "$(pwd)" \
      emergency-stop "[AGENT_ID]" "Exhaustive search completed: no tasks, no errors, no maintenance work needed"

    echo "✅ Emergency stop initiated - respecting 60s cooldown"
  else
    echo "⏸️  Emergency stop recently issued - waiting for cooldown"
    echo "   Time since last stop: ${TIME_SINCE}s"
    echo "   Required cooldown: 60s"
    echo ""
    echo "🔍 Re-checking for work..."
    # MANDATORY: Go back to Option 1 and search again
  fi
else
  echo "⚠️  Stop hook triggered but not consecutive - searching for work again"
  # MANDATORY: Loop back to Option 1
fi
```

**ENFORCEMENT**: Emergency stop ONLY after:
1. 2nd consecutive stop hook call
2. Exhaustive search confirms no work
3. 60s cooldown period respected
4. All options 1-4 explored

---

### Update TaskManager Before Continuing [MANDATORY]

```bash
# MANDATORY: Always update task progress before continuing work
if [ -n "$TASK_ID" ]; then
  timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" \
    --project-root "$(pwd)" \
    update-task "$TASK_ID" "{
      \"status\": \"in-progress\",
      \"progress_percentage\": $PROGRESS,
      \"metadata\": {
        \"last_activity\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\",
        \"continuation_reason\": \"$REASON\",
        \"next_actions\": \"$NEXT_ACTIONS\"
      }
    }"

  echo "✅ Task updated - continuing work"
fi
```

**ENFORCEMENT**: TaskManager MUST be updated before work continuation

---

## MANDATORY DECISION MATRIX

```
Stop Hook Triggered
    │
    ├─ Current task incomplete?
    │   └─→ CONTINUE CURRENT TASK (Option 1) ✅ MANDATORY
    │
    ├─ Current task ready for validation?
    │   └─→ VALIDATE & COMPLETE (Option 2) ✅ MANDATORY
    │
    ├─ Approved tasks available?
    │   └─→ START NEXT TASK (Option 3) ✅ MANDATORY
    │
    ├─ Maintenance work needed?
    │   └─→ PERFORM MAINTENANCE (Option 4) ✅ MANDATORY
    │
    └─ 2nd consecutive stop + 60s cooldown?
        └─→ EMERGENCY STOP (Option 5) ⚠️ LAST RESORT ONLY
```

**ENFORCEMENT**: MUST follow decision matrix in order, cannot skip to emergency stop

---

## MANDATORY COMPLIANCE CHECKLIST

**BEFORE CONCLUDING, VERIFY**:
- [ ] Environment checked (LOCAL or CLOUD) ← 🔴 REQUIRED
- [ ] TaskManager queried (if LOCAL) ← 🔴 REQUIRED
- [ ] Current task status checked ← 🔴 REQUIRED
- [ ] Approved tasks searched ← 🔴 REQUIRED
- [ ] Maintenance checks performed ← 🔴 REQUIRED
- [ ] Decision made (continue/start/maintain/stop) ← 🔴 REQUIRED
- [ ] Work actively in progress OR emergency stop issued ← 🔴 REQUIRED

**CRITICAL ENFORCEMENT**: Cannot conclude without either continuing work or issuing emergency stop

---

## MANDATORY COMPLIANCE STATEMENT

**BY EXECUTING THIS HOOK, YOU AFFIRM**:
- ✅ Environment detected and appropriate workflow followed
- ✅ TaskManager queried for current state (if LOCAL)
- ✅ All work options explored systematically
- ✅ Either continuing work OR emergency stop issued
- ✅ NEVER sitting idle with available work
- ✅ TaskManager updated with continuation status

**YOU ARE THE SAME AGENT - STAY ACTIVE - KEEP WORKING**

**VIOLATION OF THIS HOOK = IDLE AGENT = CRITICAL FAILURE**

---

**END OF MANDATORY Stop HOOK**
