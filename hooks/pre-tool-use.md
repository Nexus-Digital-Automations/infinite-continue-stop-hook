# ⚠️ MANDATORY: PreToolUse Hook
# 🔴 NON-NEGOTIABLE - ABSOLUTE COMPLIANCE REQUIRED

**ENFORCEMENT**: This hook executes BEFORE every tool execution. Violations MUST be blocked BEFORE they happen.

**VIOLATION CONSEQUENCE**: Blocked tool execution, immediate protocol reset, security incident logging.

**PURPOSE**: PREVENT violations before they occur, NOT fix them after

---

## ANALYZE UPCOMING TOOL USE [MANDATORY]

**ABSOLUTE REQUIREMENT**: MUST identify and classify the tool about to execute.

**Tool Categories**:
- File write/create operations
- Command execution
- Git operations
- TaskManager API calls
- Other operations

**ENFORCEMENT**: Different validation rules apply to each category

---

## 🚨 SECURITY VALIDATION [CRITICAL - ZERO TOLERANCE]

### Before File Write/Create Operations [MANDATORY]

**ABSOLUTE REQUIREMENT**: MUST scan for secrets BEFORE writing ANY file.

```bash
echo "🔍 MANDATORY: Scanning content for secrets BEFORE file write..."

# MANDATORY Check 1: Scan file content for secrets
echo "$FILE_CONTENT" | grep -iE "password|api[_-]?key|secret|token|credentials|private[_-]?key|bearer|authorization:" && {
  echo "❌ BLOCKED: Content contains potential secrets"
  echo "🔴 CRITICAL VIOLATION: Attempting to write sensitive data"
  echo ""
  echo "MANDATORY ACTIONS:"
  echo "1. Move sensitive data to .env file"
  echo "2. Add .env to .gitignore"
  echo "3. Use environment variables: process.env.VARIABLE_NAME"
  echo "4. Create .env.example with placeholder values"
  echo ""
  echo "❌ FILE WRITE OPERATION BLOCKED"
  exit 1
} || echo "✅ No secrets detected in content"

# MANDATORY Check 2: Verify file path is not sensitive
echo "$FILE_PATH" | grep -E "\.env$|\.key$|\.pem$|\.p12$|credentials|secrets|id_rsa|id_ed25519" && {
  echo "❌ BLOCKED: Writing to sensitive file type"
  echo "🔴 MANDATORY: Checking if file is in .gitignore..."

  if grep -q "$FILE_PATH" .gitignore 2>/dev/null; then
    echo "✅ File is in .gitignore - write allowed BUT VERIFY NO SECRETS"
  else
    echo "❌ CRITICAL: Sensitive file NOT in .gitignore"
    echo "🔴 MANDATORY ACTION: Adding to .gitignore NOW"
    echo "$FILE_PATH" >> .gitignore
    echo "✅ Added to .gitignore - write now allowed"
  fi
}

# MANDATORY Check 3: Verify file won't expose secrets in git history
if git ls-files --error-unmatch "$FILE_PATH" 2>/dev/null; then
  echo "⚠️ WARNING: File already tracked by git"
  echo "🔍 MANDATORY: Double-checking for secrets..."

  # Extra strict check for tracked files
  echo "$FILE_CONTENT" | grep -iE "AKIA|sk-|ghp_|glpat|xox[baprs]-" && {
    echo "❌ CRITICAL BLOCK: API key pattern detected in tracked file"
    echo "🔴 This would expose secrets in git history"
    echo "❌ FILE WRITE OPERATION BLOCKED"
    exit 1
  }
fi

echo "✅ Security validation passed - file write allowed"
```

**ENFORCEMENT**: ANY secret detection = IMMEDIATE BLOCK, NO EXCEPTIONS

---

### Before Git Commit Operations [MANDATORY]

**ABSOLUTE REQUIREMENT**: MUST verify no secrets before EVERY commit.

```bash
echo "🔍 MANDATORY: Pre-commit security validation..."

# MANDATORY Check 1: Verify pre-commit hooks will run
if [ -f ".pre-commit-config.yaml" ] || [ -d ".husky" ]; then
  echo "✅ Pre-commit hooks configured - will execute"
else
  echo "❌ CRITICAL BLOCK: No pre-commit hooks configured"
  echo "🔴 Secret scanning may NOT be active"
  echo "🔴 MANDATORY: Configure pre-commit hooks before committing"
  echo ""
  echo "To configure pre-commit hooks:"
  echo "1. Install pre-commit: pip install pre-commit"
  echo "2. Create .pre-commit-config.yaml with secret scanning"
  echo "3. Run: pre-commit install"
  echo ""
  echo "❌ GIT COMMIT OPERATION BLOCKED"
  exit 1
fi

# MANDATORY Check 2: Scan staged changes for secrets (manual backup check)
echo "🔍 MANDATORY: Scanning staged changes for secrets..."
git diff --cached | grep -iE "password|api[_-]?key|secret|token|bearer|authorization:|AKIA|sk-|ghp_" && {
  echo "❌ CRITICAL BLOCK: Staged changes contain potential secrets"
  echo "🔴 SECURITY VIOLATION DETECTED"
  echo ""
  echo "Patterns detected:"
  git diff --cached | grep -iE "password|api[_-]?key|secret|token|bearer|authorization:|AKIA|sk-|ghp_" | head -10
  echo ""
  echo "MANDATORY ACTIONS:"
  echo "1. Unstage the file: git reset HEAD <file>"
  echo "2. Remove secrets from file"
  echo "3. Move secrets to .env file"
  echo "4. Re-stage clean file"
  echo ""
  echo "❌ GIT COMMIT OPERATION BLOCKED"
  exit 1
} || echo "✅ No obvious secrets in staged changes"

# MANDATORY Check 3: Verify sensitive files not staged
SENSITIVE_STAGED=$(git diff --cached --name-only | grep -E "\.env$|\.key$|\.pem$|credentials|secrets|id_rsa" || echo "")
if [ -n "$SENSITIVE_STAGED" ]; then
  echo "❌ CRITICAL BLOCK: Sensitive files are staged"
  echo "🔴 THESE FILES MUST NEVER BE COMMITTED:"
  echo "$SENSITIVE_STAGED"
  echo ""
  echo "MANDATORY ACTIONS:"
  echo "1. Unstage: git reset HEAD <file>"
  echo "2. Add to .gitignore"
  echo "3. Verify .gitignore patterns"
  echo ""
  echo "❌ GIT COMMIT OPERATION BLOCKED"
  exit 1
else
  echo "✅ No sensitive files staged"
fi

echo "✅ Security validation passed - commit allowed"
```

**ENFORCEMENT**: BLOCK commit if ANY check fails, NO EXCEPTIONS

---

## 🔍 QUALITY VALIDATION [MANDATORY]

### Before Code Implementation [MANDATORY]

```bash
echo "🔍 MANDATORY: Quality baseline validation..."

# MANDATORY Check 1: Verify linting configuration exists
if [ -f ".eslintrc.js" ] || [ -f ".eslintrc.json" ] || [ -f "eslint.config.mjs" ] || [ -f "pylintrc" ] || [ -f ".pylintrc" ]; then
  echo "✅ Linting configured"
else
  echo "⚠️ WARNING: No linting configuration found"
  echo "🔴 Code quality cannot be automatically enforced"
fi

# MANDATORY Check 2: Verify test framework available
if grep -q "jest\|mocha\|pytest\|vitest\|go test" package.json 2>/dev/null || [ -f "pytest.ini" ] || [ -f "go.mod" ]; then
  echo "✅ Test framework configured"
else
  echo "⚠️ WARNING: Test framework not detected"
  echo "🔴 Cannot verify code correctness automatically"
fi

# MANDATORY Check 3: Anti-redundancy check
echo "🔍 MANDATORY: Checking for existing similar code..."
# Search for similar function names, patterns, or functionality
# This prevents duplicating existing code

if [ -n "$FUNCTION_NAME" ]; then
  SIMILAR=$(grep -r "$FUNCTION_NAME" --include="*.js" --include="*.ts" --include="*.py" . 2>/dev/null | grep -v node_modules | head -5)

  if [ -n "$SIMILAR" ]; then
    echo "⚠️ WARNING: Similar code may already exist:"
    echo "$SIMILAR"
    echo ""
    echo "🔴 VERIFY: Is this truly new functionality or should you reuse/extend existing code?"
  fi
fi
```

**ENFORCEMENT**: Warnings don't block but MUST be acknowledged

---

### Before Committing Code [MANDATORY]

```bash
echo "🔍 MANDATORY: Pre-commit quality checks..."

# MANDATORY Check 1: Verify code passes linting
if command -v npm &> /dev/null && grep -q '"lint"' package.json 2>/dev/null; then
  echo "🔍 Running linter..."
  timeout 30s npm run lint 2>&1 | tee .validation-artifacts/logs/pre-commit-lint.log | head -30

  if grep -q "error" .validation-artifacts/logs/pre-commit-lint.log; then
    echo "❌ WARNING: Linting errors detected"
    echo "🔴 Linting errors found - should fix before commit"
    echo "Run: npm run lint:fix (if available)"
  else
    echo "✅ No linting errors"
  fi
fi

# MANDATORY Check 2: Verify tests exist for new code
if [ -n "$NEW_CODE_FILES" ]; then
  echo "🔍 Checking for corresponding test files..."

  for FILE in $NEW_CODE_FILES; do
    BASE_NAME=$(basename "$FILE" | sed 's/\.[^.]*$//')
    TEST_FILE=$(find . -name "*${BASE_NAME}*.test.*" -o -name "*${BASE_NAME}*.spec.*" 2>/dev/null | head -1)

    if [ -z "$TEST_FILE" ]; then
      echo "⚠️ WARNING: No test file found for $FILE"
      echo "🔴 Consider adding tests for new code"
    fi
  done
fi

# MANDATORY Check 3: Verify no debugging code left in
if git diff --cached | grep -E "console\.log|console\.debug|debugger|print\(|fmt\.Println|var_dump|dd\("; then
  echo "⚠️ WARNING: Debugging code detected in staged changes"
  echo "🔴 Strongly recommend removing before commit:"
  git diff --cached | grep -E "console\.log|console\.debug|debugger|print\(|fmt\.Println" | head -10
fi
```

**ENFORCEMENT**: Quality issues generate warnings, critical issues BLOCK

---

## 📋 TASK VALIDATION [MANDATORY - LOCAL ONLY]

### Before Starting Implementation [MANDATORY]

```bash
if [ "$ENV" = "LOCAL" ]; then
  echo "🔍 MANDATORY: Validating task status..."

  # MANDATORY Check 1: Verify task exists
  TASK_EXISTS=$(timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" \
    --project-root "$(pwd)" \
    get-task "$TASK_ID" 2>&1)

  if echo "$TASK_EXISTS" | grep -q "error\|not found"; then
    echo "❌ CRITICAL BLOCK: No task found for this work"
    echo "🔴 MANDATORY: Create task before proceeding"
    echo ""
    echo "Use: create-task command with proper structure"
    echo ""
    echo "❌ IMPLEMENTATION BLOCKED"
    exit 1
  else
    echo "✅ Task exists: $TASK_ID"
  fi

  # MANDATORY Check 2: Verify task is in-progress or assigned to this agent
  TASK_STATUS=$(echo "$TASK_EXISTS" | jq -r '.status' 2>/dev/null || echo "unknown")

  if [ "$TASK_STATUS" != "in-progress" ] && [ "$TASK_STATUS" != "approved" ]; then
    echo "⚠️ WARNING: Task status is '$TASK_STATUS'"
    echo "🔴 MANDATORY: Updating to 'in-progress'..."

    timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" \
      --project-root "$(pwd)" \
      update-task "$TASK_ID" '{"status":"in-progress","assigned_to":"[AGENT_ID]","assigned_at":"'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"}'

    echo "✅ Task status updated"
  else
    echo "✅ Task status valid: $TASK_STATUS"
  fi
else
  echo "⚠️ CLOUD environment - Skipping TaskManager validation"
fi
```

**ENFORCEMENT**: Task MUST exist and be claimable before implementation

---

## 🎯 SCOPE VALIDATION [MANDATORY]

### Before Implementing New Features [MANDATORY]

```bash
echo "🔍 MANDATORY: Validating feature scope..."

# MANDATORY Check 1: Verify feature is in features.md
if [ -f "development/essentials/features.md" ]; then
  if [ -n "$FEATURE_NAME" ]; then
    if grep -qi "$FEATURE_NAME" development/essentials/features.md; then
      echo "✅ Feature found in features.md - scope validated"
    else
      echo "❌ CRITICAL WARNING: Feature not found in features.md"
      echo "🔴 This may be OUT OF SCOPE"
      echo ""
      echo "MANDATORY VERIFICATION:"
      echo "1. Is this feature explicitly requested by user?"
      echo "2. Should features.md be updated?"
      echo "3. Are you adding unrequested functionality?"
      echo ""
      echo "⚠️ Proceeding requires explicit user approval"
    fi
  fi
else
  echo "⚠️ No features.md found - scope validation disabled"
fi

# MANDATORY Check 2: Scope creep prevention
echo "🔍 MANDATORY SCOPE CHECK:"
echo "❓ Am I implementing ONLY what was requested?"
echo "❓ Am I NOT adding extras, nice-to-haves, or assumed requirements?"
echo "❓ Am I staying within the defined feature scope?"
echo ""
echo "✅ Affirm: I am implementing exactly what was requested, nothing more"
```

**ENFORCEMENT**: Scope violations require explicit user approval to proceed

---

## 🚨 COMMAND SAFETY VALIDATION [MANDATORY]

### Before Long-Running Commands [MANDATORY]

```bash
# MANDATORY: Check if command needs timeout or background execution
if [[ "$COMMAND" =~ "npm install|pip install|build|test|compile" ]]; then
  if [[ ! "$COMMAND" =~ "timeout|&" ]]; then
    echo "⚠️ WARNING: Long-running command without timeout"
    echo "🔴 RECOMMENDATION: Add timeout"
    echo "   Example: timeout 300s $COMMAND"
    echo "   Or run in background with monitoring"
  else
    echo "✅ Command has timeout or background execution"
  fi
fi

# MANDATORY: Verify destructive commands have safeguards
if [[ "$COMMAND" =~ "rm -rf|DROP|DELETE|truncate|mkfs|dd" ]]; then
  echo "🚨 DESTRUCTIVE COMMAND DETECTED"
  echo "🔴 CRITICAL: Ensure this operation is:"
  echo "   1. Absolutely necessary"
  echo "   2. Targeted correctly (not system directories)"
  echo "   3. Reversible or backed up"
  echo ""
  echo "⚠️ PROCEED WITH EXTREME CAUTION"
fi
```

**ENFORCEMENT**: Destructive commands require explicit acknowledgment

---

## CHECKPOINT: Proceed or Block? [MANDATORY]

**MANDATORY DECISION POINT**:

```
All checks passed?
    ├─ ✅ No security violations detected
    ├─ ✅ Quality baseline met
    ├─ ✅ Task tracking in place (LOCAL)
    ├─ ✅ Scope validated
    └─ ✅ Command safety verified

    → PROCEED WITH TOOL EXECUTION

Any critical check failed?
    ├─ ❌ Security violation
    ├─ ❌ No task created
    ├─ ❌ Scope violation without approval
    └─ ❌ Destructive command without safeguards

    → BLOCK EXECUTION AND FIX ISSUES FIRST
```

**ENFORCEMENT**: If ANY critical check failed → BLOCK IMMEDIATELY

---

## MANDATORY COMPLIANCE STATEMENT

**BY PROCEEDING WITH TOOL EXECUTION, YOU AFFIRM**:
- ✅ All security checks passed (no secrets, proper .gitignore, hooks configured)
- ✅ Quality baseline verified (linting/tests configured)
- ✅ Task exists and is claimed (if LOCAL)
- ✅ Scope validated against features.md
- ✅ Command safety verified
- ✅ Ready to execute with confidence

**VIOLATION OF THIS HOOK = CRITICAL PROTOCOL FAILURE = BLOCKED EXECUTION**

---

**END OF MANDATORY PreToolUse HOOK**
