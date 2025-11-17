# ⚠️ MANDATORY: UserPromptSubmit Hook
# 🔴 NON-NEGOTIABLE - ABSOLUTE COMPLIANCE REQUIRED

**ENFORCEMENT**: This hook executes on EVERY user prompt submission. Skipping any step is a CRITICAL FAILURE.

**VIOLATION CONSEQUENCE**: Non-compliance results in immediate task rejection and protocol reset.

---

## STEP 1: Environment Detection [MANDATORY]

**ABSOLUTE REQUIREMENT**: MUST detect environment before proceeding.

```bash
# MANDATORY environment detection
timeout 2s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" --project-root "$(pwd)" methods 2>/dev/null
EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
  echo "✅ LOCAL environment detected - TaskManager available"
  ENV="LOCAL"
else
  echo "❌ CLOUD environment detected - Manual TASKS.json workflow"
  ENV="CLOUD"
fi
```

**FORBIDDEN**: Proceeding without environment detection
**REQUIRED**: Store ENV variable for entire session

---

## STEP 2: Request Classification [MANDATORY]

**ABSOLUTE REQUIREMENT**: MUST classify every user request.

### 🟢 SIMPLE QUESTION (No task needed)

**Patterns to detect**:
- "What", "Why", "How does", "Show me", "Explain", "Where is", "When did"
- Questions about existing code/functionality
- Status inquiries

**Examples**:
- "What does this function do?"
- "Show me the current test coverage"
- "Explain the authentication flow"

**Action**: Answer directly, skip task creation

---

### 🔴 WORK REQUEST (Task MANDATORY if LOCAL)

**Patterns to detect**:
- **Create**: "Add", "Create", "Build", "Implement", "Generate", "Set up"
- **Modify**: "Fix", "Update", "Change", "Refactor", "Optimize", "Improve"
- **Debug**: "Debug", "Investigate", "Resolve", "Correct", "Find bug"
- **Test**: "Write tests", "Test", "Verify", "Validate"

**Examples**:
- "Add user authentication"
- "Fix the memory leak in the dashboard"
- "Refactor the data processing pipeline"
- "Write E2E tests for checkout flow"

**MANDATORY Action**: Create TaskManager task (LOCAL) OR manually edit TASKS.json (CLOUD)

---

### ⚠️ AMBIGUOUS REQUEST

**Rule**: When uncertain → CREATE TASK (safer approach)

**Patterns**:
- "Can you...", "Check...", "Review...", "Look at..."

---

## STEP 3: Task Creation [MANDATORY - LOCAL ONLY]

**IF LOCAL + WORK REQUEST: TASK CREATION IS NON-NEGOTIABLE**

```bash
# 🔴 MANDATORY FIRST ACTION - Create TaskManager task
timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" \
  --project-root "$(pwd)" \
  create-task '{
    "title": "Concise task title (5-10 words)",
    "description": "Detailed description with:\n- Current state\n- Desired state\n- Acceptance criteria\n- Definition of done",
    "type": "feature|error|test|audit",
    "priority": "normal|high|urgent",
    "business_value": "Why this matters",
    "validation_requirements": {
      "security_scan": true,
      "test_coverage": true,
      "linter_pass": true,
      "type_check": true,
      "build_success": true,
      "runtime_validation": true,
      "visual_validation": false
    }
  }'

# MANDATORY: Capture task ID
TASK_ID=$(echo $RESPONSE | jq -r '.task_id')
echo "✅ Task created: $TASK_ID"
```

**CRITICAL**: DO NOT PROCEED WITHOUT CREATING TASK

**CLOUD ALTERNATIVE**: Manually edit TASKS.json with complete task structure

---

## STEP 4: Pre-Flight Security Check [MANDATORY]

**ABSOLUTE REQUIREMENT**: Security baseline MUST be verified before ANY file operations.

### Check 1: .gitignore Coverage [MANDATORY]

```bash
echo "🔍 MANDATORY: Checking .gitignore for sensitive patterns..."

if [ -f ".gitignore" ]; then
  MISSING_PATTERNS=()

  grep -q "\.env" .gitignore || MISSING_PATTERNS+=(".env files")
  grep -q "\.key\|\.pem" .gitignore || MISSING_PATTERNS+=("private keys")
  grep -q "credentials\|secrets" .gitignore || MISSING_PATTERNS+=("credentials")
  grep -q "\.log" .gitignore || MISSING_PATTERNS+=("log files")
  grep -q "node_modules" .gitignore || MISSING_PATTERNS+=("dependencies")

  if [ ${#MISSING_PATTERNS[@]} -gt 0 ]; then
    echo "⚠️ CRITICAL: .gitignore missing patterns: ${MISSING_PATTERNS[*]}"
    echo "🔴 MANDATORY ACTION: Adding missing patterns NOW"

    # Add missing patterns immediately
    [ ! "$(grep -q "\.env" .gitignore)" ] && echo -e "\n# Environment files\n.env\n.env.*\n!.env.example" >> .gitignore
    [ ! "$(grep -q "\.key\|\.pem" .gitignore)" ] && echo -e "\n# Private keys\n*.key\n*.pem\n*.p12" >> .gitignore
    [ ! "$(grep -q "credentials\|secrets" .gitignore)" ] && echo -e "\n# Credentials\ncredentials/\nsecrets/\n*credentials*\n*secrets*" >> .gitignore

    echo "✅ .gitignore updated with mandatory patterns"
  else
    echo "✅ .gitignore covers all mandatory sensitive patterns"
  fi
else
  echo "❌ CRITICAL FAILURE: No .gitignore found"
  echo "🔴 MANDATORY ACTION: Creating comprehensive .gitignore NOW"

  cat > .gitignore << 'EOF'
# MANDATORY: Environment files
.env
.env.*
!.env.example

# MANDATORY: Private keys
*.key
*.pem
*.p12
*.pfx
id_rsa*
id_ed25519*

# MANDATORY: Credentials
credentials/
secrets/
*credentials*
*secrets*
*.keystore

# MANDATORY: Dependencies
node_modules/
vendor/
.pnp
.pnp.js

# MANDATORY: Build artifacts
dist/
build/
*.log
.DS_Store

# MANDATORY: IDE
.vscode/
.idea/
*.swp
*.swo

# MANDATORY: Validation artifacts
.validation-artifacts/
EOF

  echo "✅ Comprehensive .gitignore created"
fi
```

### Check 2: Pre-Commit Hooks [MANDATORY]

```bash
echo "🔍 MANDATORY: Checking pre-commit hook configuration..."

if [ -f ".pre-commit-config.yaml" ] || [ -d ".husky" ]; then
  echo "✅ Pre-commit hooks configured"

  # Verify secret scanning is configured
  if [ -f ".pre-commit-config.yaml" ]; then
    if grep -q "detect-secrets\|gitleaks\|truffleHog" .pre-commit-config.yaml; then
      echo "✅ Secret scanning configured in pre-commit hooks"
    else
      echo "⚠️ WARNING: Secret scanning NOT configured in pre-commit hooks"
      echo "🔴 HIGHLY RECOMMENDED: Add detect-secrets or gitleaks"
    fi
  fi
else
  echo "❌ CRITICAL WARNING: No pre-commit hooks found"
  echo "⚠️ Secret scanning may NOT be active"
  echo "🔴 RECOMMENDATION: Install pre-commit hooks with secret scanning"
fi
```

### Check 3: Current Git State Secret Scan [MANDATORY]

```bash
echo "🔍 MANDATORY: Scanning for secrets in current branch..."

# Check uncommitted files
if git diff --name-only | grep -E "\.env$|\.key$|\.pem$|credentials"; then
  echo "❌ CRITICAL: Sensitive files in working directory"
  echo "🔴 MUST be in .gitignore before proceeding"
fi

# Check for hardcoded secrets in recent changes
RECENT_SECRETS=$(git log -1 --all --pretty=format: -S "password" -S "api_key" -S "secret" --name-only 2>/dev/null | head -20)
if [ -n "$RECENT_SECRETS" ]; then
  echo "⚠️ WARNING: Recent commits may contain secrets"
  echo "$RECENT_SECRETS"
fi
```

**ENFORCEMENT**: If CRITICAL failures found → BLOCK all file operations until fixed

---

## STEP 5: Read Project Context [MANDATORY]

**ABSOLUTE REQUIREMENT**: MUST read CLAUDE.md before ANY work.

```bash
# MANDATORY: Read CLAUDE.md for project-specific instructions
if [ -f "CLAUDE.md" ]; then
  echo "📖 MANDATORY: Reading CLAUDE.md..."
  cat CLAUDE.md
  echo "✅ Project context loaded - COMPLIANCE REQUIRED"
else
  echo "⚠️ No CLAUDE.md found - using default protocols ONLY"
  echo "🔴 NOTE: Without CLAUDE.md, only global ~/.claude/CLAUDE.md applies"
fi

# MANDATORY: Check for features.md (scope definition)
if [ -f "development/essentials/features.md" ]; then
  echo "📋 MANDATORY: Reading features.md for scope validation..."
  cat development/essentials/features.md
  echo "✅ Feature scope loaded - ONLY these features permitted"
else
  echo "⚠️ No features.md found - scope validation disabled"
fi
```

**ENFORCEMENT**: CLAUDE.md instructions are AUTHORITATIVE and OVERRIDE defaults

---

## STEP 6: Set Validation Expectations [MANDATORY]

**ABSOLUTE REQUIREMENT**: Define what evidence will be REQUIRED for task completion.

### For Feature Implementation [MANDATORY EVIDENCE]:
- ✅ Unit tests pass (MUST show full test output)
- ✅ Integration tests pass (MUST show full test output)
- ✅ Linting passes (MUST show linter output with ZERO errors)
- ✅ Type checking passes (MUST show tsc/mypy output)
- ✅ Application starts successfully (MUST show startup logs)
- ✅ Feature works as expected (MUST provide screenshots/GIFs)
- ✅ No console errors (MUST show browser console)
- ✅ Performance acceptable (MUST show metrics)

### For Bug Fixes [MANDATORY EVIDENCE]:
- ✅ Bug reproduced with evidence (MUST show logs/screenshots BEFORE)
- ✅ Root cause identified (MUST explain with evidence)
- ✅ Fix implemented and tested (MUST show code changes)
- ✅ Tests added to prevent regression (MUST show new tests)
- ✅ Bug no longer occurs (MUST show logs/screenshots AFTER)

### For Refactoring [MANDATORY EVIDENCE]:
- ✅ All existing tests still pass (MUST show test output)
- ✅ No change in functionality (MUST prove with tests)
- ✅ Code quality improved (MUST show metrics comparison)
- ✅ Performance maintained or improved (MUST show benchmarks)

### For Test Writing [MANDATORY EVIDENCE]:
- ✅ Tests written and passing (MUST show test output)
- ✅ Code coverage increased (MUST show coverage report)
- ✅ Tests cover edge cases (MUST list them explicitly)
- ✅ Tests are reliable (MUST show multiple successful runs)

**ENFORCEMENT**: Task CANNOT be marked complete without ALL required evidence

---

## STEP 7: Final Checkpoint [MANDATORY]

**ABSOLUTE REQUIREMENT**: ALL items MUST be checked before proceeding.

**MANDATORY CHECKLIST**:
- [ ] Environment detected (LOCAL or CLOUD) ← REQUIRED
- [ ] Request classified correctly ← REQUIRED
- [ ] Task created (if LOCAL + work request) ← REQUIRED
- [ ] Security baseline verified ← REQUIRED
- [ ] .gitignore covers sensitive patterns ← REQUIRED
- [ ] Pre-commit hook status known ← REQUIRED
- [ ] No secrets in current git state ← REQUIRED
- [ ] Project context loaded (CLAUDE.md read) ← REQUIRED
- [ ] Validation requirements understood ← REQUIRED
- [ ] Ready to proceed ← REQUIRED

**CRITICAL ENFORCEMENT**: If ANY item unchecked → STOP IMMEDIATELY and resolve

---

## Quick Reference Decision Tree

```
User Request
    ├─ Simple Question?
    │   └─→ Answer directly (no task) ✅ ALLOWED
    │
    └─ Work Request?
        ├─ LOCAL Environment?
        │   ├─→ Create TaskManager task ← 🔴 MANDATORY
        │   ├─→ Verify security baseline ← 🔴 MANDATORY
        │   ├─→ Read CLAUDE.md ← 🔴 MANDATORY
        │   └─→ Set validation expectations ← 🔴 MANDATORY
        │
        └─ CLOUD Environment?
            ├─→ Use TodoWrite for planning ← 🔴 MANDATORY
            ├─→ Manually update TASKS.json ← 🔴 MANDATORY
            ├─→ Verify security baseline ← 🔴 MANDATORY
            └─→ Read CLAUDE.md ← 🔴 MANDATORY
```

---

## MANDATORY COMPLIANCE STATEMENT

**BY PROCEEDING BEYOND THIS HOOK, YOU AFFIRM**:
- ✅ Environment detected and stored
- ✅ Request properly classified
- ✅ Task created (if work request + LOCAL) OR TASKS.json updated (if CLOUD)
- ✅ Security baseline verified and compliant
- ✅ CLAUDE.md instructions loaded and understood
- ✅ Validation expectations set and acknowledged

**VIOLATION OF THIS HOOK = CRITICAL PROTOCOL FAILURE**

---

**END OF MANDATORY UserPromptSubmit HOOK**
