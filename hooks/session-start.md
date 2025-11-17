# ⚠️ MANDATORY: SessionStart Hook
# 🔴 NON-NEGOTIABLE - ABSOLUTE COMPLIANCE REQUIRED

**ENFORCEMENT**: This hook executes at EVERY session initialization. All steps are MANDATORY.

**VIOLATION CONSEQUENCE**: Skipping initialization steps results in incomplete session state and CRITICAL FAILURES.

---

## STEP 1: Environment Detection [MANDATORY]

**ABSOLUTE REQUIREMENT**: MUST detect environment at session start.

```bash
echo "🚀 MANDATORY: Initializing Claude Code session..."

# MANDATORY environment detection
timeout 2s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" --project-root "$(pwd)" methods 2>/dev/null
if [ $? -eq 0 ]; then
  echo "✅ LOCAL environment - TaskManager API available"
  ENV="LOCAL"
else
  echo "⚠️  CLOUD environment - Using manual TASKS.json workflow"
  ENV="CLOUD"
fi

export ENV  # MANDATORY: Make environment available to entire session
```

**ENFORCEMENT**: Environment variable MUST be set for all subsequent operations

---

## STEP 2: Load Project Instructions [MANDATORY]

**ABSOLUTE REQUIREMENT**: MUST read CLAUDE.md before ANY session work.

```bash
# MANDATORY: Read CLAUDE.md
if [ -f "CLAUDE.md" ]; then
  echo "📖 MANDATORY: Loading project instructions from CLAUDE.md..."
  cat CLAUDE.md
  echo "✅ Instructions loaded - COMPLIANCE IS NON-NEGOTIABLE"
else
  echo "⚠️ No CLAUDE.md found - using ONLY global protocols"
  echo "🔴 WARNING: Project-specific guidance not available"
fi
```

**ENFORCEMENT**: CLAUDE.md instructions are AUTHORITATIVE and OVERRIDE all defaults

---

## STEP 3: Recover Session State [MANDATORY - LOCAL ONLY]

**IF LOCAL environment, MUST query TaskManager for current state**:

```bash
if [ "$ENV" = "LOCAL" ]; then
  echo "🔍 MANDATORY: Querying TaskManager for session state..."

  # MANDATORY: Get overall task statistics
  echo "📊 Retrieving task statistics..."
  timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" \
    --project-root "$(pwd)" \
    get-task-stats

  # MANDATORY: Get tasks assigned to this agent
  echo "📋 Retrieving agent tasks..."
  timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" \
    --project-root "$(pwd)" \
    get-agent-tasks [AGENT_ID]

  # MANDATORY: Get approved tasks ready to work on
  echo "✅ Retrieving approved tasks..."
  timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" \
    --project-root "$(pwd)" \
    get-tasks-by-status approved

  echo "✅ Session state recovered from TaskManager"

  # MANDATORY: Store task counts for session awareness
  IN_PROGRESS_TASKS=$(parse task count from response)
  APPROVED_TASKS=$(parse approved count from response)
else
  echo "⚠️ CLOUD environment - Reading TASKS.json manually..."

  if [ -f "TASKS.json" ]; then
    # MANDATORY: Parse TASKS.json for current state
    IN_PROGRESS_TASKS=$(jq '[.tasks[] | select(.status=="in-progress")] | length' TASKS.json)
    APPROVED_TASKS=$(jq '[.tasks[] | select(.status=="approved")] | length' TASKS.json)

    echo "✅ Session state recovered from TASKS.json"
    echo "   In Progress: $IN_PROGRESS_TASKS"
    echo "   Approved: $APPROVED_TASKS"
  else
    echo "❌ CRITICAL: No TASKS.json found in CLOUD environment"
    IN_PROGRESS_TASKS=0
    APPROVED_TASKS=0
  fi
fi
```

**ENFORCEMENT**: Session state MUST be known before accepting new work

---

## STEP 4: Health Check - Critical Issues [MANDATORY]

**ABSOLUTE REQUIREMENT**: MUST assess codebase health at session start.

```bash
echo "🏥 MANDATORY: Running health checks..."

# MANDATORY: Git status
echo "📊 Git status:"
git status --short | tee .validation-artifacts/logs/git-status.log
UNCOMMITTED=$(git status --short | wc -l)
echo "Uncommitted changes: $UNCOMMITTED"

# MANDATORY: Security check
echo "🔒 Security audit (MANDATORY):"
npm audit --audit-level=high 2>&1 | tee .validation-artifacts/logs/security-audit.log || echo "⚠️ No npm audit available"

# Parse critical/high vulnerabilities
if [ -f ".validation-artifacts/logs/security-audit.log" ]; then
  CRITICAL_VULNS=$(grep -o "[0-9]* critical" .validation-artifacts/logs/security-audit.log | head -1 || echo "0 critical")
  HIGH_VULNS=$(grep -o "[0-9]* high" .validation-artifacts/logs/security-audit.log | head -1 || echo "0 high")

  echo "🔴 Security Status: $CRITICAL_VULNS, $HIGH_VULNS"

  if [[ "$CRITICAL_VULNS" != "0 critical" ]] || [[ "$HIGH_VULNS" != "0 high" ]]; then
    echo "❌ CRITICAL: Security vulnerabilities detected - MUST fix before new features"
  fi
fi

# MANDATORY: Linting check (quick scan)
echo "🔍 Lint check (MANDATORY):"
timeout 30s npm run lint 2>&1 | tee .validation-artifacts/logs/lint-quick.log | head -20 || echo "⚠️ No lint script configured"

if [ -f ".validation-artifacts/logs/lint-quick.log" ]; then
  LINT_ERRORS=$(grep -c "error" .validation-artifacts/logs/lint-quick.log || echo "0")
  echo "🔴 Linting Errors: $LINT_ERRORS"
fi

# MANDATORY: Test status (configuration check only, don't run full suite)
echo "🧪 Test configuration:"
if [ -f "package.json" ]; then
  grep -A 3 '"test"' package.json | tee .validation-artifacts/logs/test-config.log || echo "⚠️ No test script"
fi

# MANDATORY: Build configuration check
echo "🏗️  Build configuration:"
if [ -f "package.json" ]; then
  grep -A 3 '"build"' package.json | tee .validation-artifacts/logs/build-config.log || echo "⚠️ No build script"
fi
```

**ENFORCEMENT**: Critical health issues (security vulns, many lint errors) MUST be prioritized

---

## STEP 5: Set Session Context Awareness [MANDATORY]

**ABSOLUTE REQUIREMENT**: Establish and store key session facts.

```yaml
# MANDATORY Session Context (must be known):
Session Context:
  environment: $ENV                         # LOCAL or CLOUD
  task_management: $TASK_MGMT              # TaskManager API or Manual TASKS.json
  uncommitted_changes: $UNCOMMITTED        # Number of uncommitted files
  security_critical: $CRITICAL_VULNS       # Critical vulnerabilities count
  security_high: $HIGH_VULNS               # High vulnerabilities count
  linting_errors: $LINT_ERRORS             # Linting error count
  in_progress_tasks: $IN_PROGRESS_TASKS    # Currently active tasks
  approved_tasks: $APPROVED_TASKS          # Ready to work on
  session_start: $(date -u +"%Y-%m-%dT%H:%M:%SZ")

# MANDATORY Session Priorities (enforcement order):
Session Priorities:
  1. 🔴 CRITICAL: Address security vulnerabilities (if any)
  2. 🔴 HIGH: Complete in-progress tasks first
  3. 🟡 NORMAL: Fix linting errors (if any)
  4. 🟡 NORMAL: Work on approved tasks
  5. 🟢 LOW: Maintain codebase quality
```

**ENFORCEMENT**: Session context MUST guide work prioritization

---

## STEP 6: Initialize Validation Infrastructure [MANDATORY]

**ABSOLUTE REQUIREMENT**: Validation artifact directories MUST exist.

```bash
echo "📁 MANDATORY: Creating validation artifact directories..."

# MANDATORY: Create validation directory structure
mkdir -p .validation-artifacts/{logs,screenshots,test-results,metrics,reports}

# Verify creation
if [ -d ".validation-artifacts" ]; then
  echo "✅ Validation infrastructure ready:"
  echo "   - .validation-artifacts/logs (application & test logs)"
  echo "   - .validation-artifacts/screenshots (visual evidence)"
  echo "   - .validation-artifacts/test-results (test output)"
  echo "   - .validation-artifacts/metrics (performance data)"
  echo "   - .validation-artifacts/reports (summary reports)"
else
  echo "❌ CRITICAL FAILURE: Could not create .validation-artifacts/"
  exit 1
fi

# MANDATORY: Ensure .validation-artifacts is gitignored
if ! grep -q ".validation-artifacts" .gitignore 2>/dev/null; then
  echo -e "\n# Validation artifacts (ephemeral)\n.validation-artifacts/" >> .gitignore
  echo "✅ .validation-artifacts added to .gitignore"
fi
```

**ENFORCEMENT**: ALL validation evidence MUST be stored in .validation-artifacts/

---

## STEP 7: Session Ready Message [MANDATORY]

**ABSOLUTE REQUIREMENT**: Output session initialization summary.

```bash
echo "
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ SESSION INITIALIZED - ALL MANDATORY CHECKS COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Environment: $ENV
Task Management: $([ "$ENV" = "LOCAL" ] && echo "TaskManager API" || echo "Manual TASKS.json")

📊 Current State:
   In Progress: $IN_PROGRESS_TASKS tasks
   Approved: $APPROVED_TASKS tasks
   Uncommitted: $UNCOMMITTED files

🚨 Critical Issues:
   Security (Critical): $CRITICAL_VULNS
   Security (High): $HIGH_VULNS
   Linting Errors: $LINT_ERRORS

🎯 Session Priorities:
   $([ "$CRITICAL_VULNS" != "0" ] && echo "1. 🔴 FIX SECURITY VULNERABILITIES IMMEDIATELY" || echo "1. ✅ No critical security issues")
   $([ "$IN_PROGRESS_TASKS" != "0" ] && echo "2. 🔴 Complete $IN_PROGRESS_TASKS in-progress tasks" || echo "2. ✅ No tasks in progress")
   $([ "$LINT_ERRORS" != "0" ] && echo "3. 🟡 Fix $LINT_ERRORS linting errors" || echo "3. ✅ No linting errors")
   $([ "$APPROVED_TASKS" != "0" ] && echo "4. 🟡 Work on $APPROVED_TASKS approved tasks" || echo "4. ⚠️  No approved tasks")

✅ Validation infrastructure ready
✅ CLAUDE.md instructions loaded
✅ Session context established

Ready to receive requests.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"
```

**ENFORCEMENT**: Session CANNOT proceed without this initialization summary

---

## MANDATORY COMPLIANCE CHECKLIST

**BEFORE ACCEPTING ANY WORK, VERIFY**:
- [ ] Environment detected (LOCAL or CLOUD) ← 🔴 REQUIRED
- [ ] CLAUDE.md read and understood ← 🔴 REQUIRED
- [ ] Session state recovered (TaskManager or TASKS.json) ← 🔴 REQUIRED
- [ ] Health checks completed ← 🔴 REQUIRED
- [ ] Critical issues identified ← 🔴 REQUIRED
- [ ] Session context established ← 🔴 REQUIRED
- [ ] Validation infrastructure created ← 🔴 REQUIRED
- [ ] Session summary displayed ← 🔴 REQUIRED

**CRITICAL ENFORCEMENT**: All checkboxes MUST be checked before accepting user requests

---

## MANDATORY COMPLIANCE STATEMENT

**BY COMPLETING THIS HOOK, YOU AFFIRM**:
- ✅ Session fully initialized with complete state awareness
- ✅ All critical health checks completed
- ✅ Validation infrastructure ready
- ✅ Priority work identified
- ✅ Ready to enforce all protocols

**VIOLATION OF THIS HOOK = INCOMPLETE SESSION = CRITICAL FAILURE**

---

**END OF MANDATORY SessionStart HOOK**
