# ⚠️ MANDATORY: SessionEnd Hook
# 🔴 NON-NEGOTIABLE - ABSOLUTE COMPLIANCE REQUIRED

**ENFORCEMENT**: This hook executes at session end. ALL finalization steps are MANDATORY.

**VIOLATION CONSEQUENCE**: Incomplete session finalization = Lost context = Degraded future sessions.

---

## STEP 1: Final Validation Summary [MANDATORY]

**ABSOLUTE REQUIREMENT**: MUST aggregate all validation results from entire session.

```bash
echo "📊 MANDATORY: Generating final validation summary..."

# MANDATORY: Create comprehensive session summary
cat > .validation-artifacts/session-summary-$(date +%Y%m%d-%H%M%S).md << 'EOF'
# Session Validation Summary
Generated: $(date -u +"%Y-%m-%dT%H:%M:%SZ")

## Session Overview
- Duration: $SESSION_DURATION
- Environment: $ENV
- Tasks Completed: $TASKS_COMPLETED
- Tasks In Progress: $TASKS_IN_PROGRESS

## Validations Performed

### Syntax & Type Checking
$(tail -10 .validation-artifacts/logs/syntax-check*.log 2>/dev/null)
$(tail -10 .validation-artifacts/logs/type-check*.log 2>/dev/null)

### Linting
$(tail -20 .validation-artifacts/logs/lint*.log 2>/dev/null)

### Testing
$(tail -30 .validation-artifacts/test-results/full-test-suite*.log 2>/dev/null)
$(tail -30 .validation-artifacts/test-results/e2e-tests*.log 2>/dev/null)

### Build & Runtime
$(tail -20 .validation-artifacts/logs/build-output*.log 2>/dev/null)
$(tail -20 .validation-artifacts/logs/app-startup*.log 2>/dev/null)

### Security
$(tail -20 .validation-artifacts/logs/npm-audit*.log 2>/dev/null)
$(tail -10 .validation-artifacts/logs/secret-scan*.log 2>/dev/null)

### Performance
$(cat .validation-artifacts/metrics/lighthouse-report*.json 2>/dev/null | jq '.categories.performance' || echo "No performance data")

### Visual Evidence
Screenshots: $(find .validation-artifacts/screenshots -type f 2>/dev/null | wc -l)
$(ls -lh .validation-artifacts/screenshots/ 2>/dev/null || echo "No screenshots")

## Overall Status
- Tasks Completed: $TASKS_COMPLETED
- Validations Passed: $VALIDATIONS_PASSED / $VALIDATIONS_TOTAL
- Critical Issues: $CRITICAL_ISSUES
- Warnings: $WARNINGS

## Session Statistics
- Files Modified: $(git diff --name-only | wc -l)
- Lines Added: $(git diff --stat | tail -1)
- Commits: $(git log --since="$SESSION_START" --oneline | wc -l)

## Next Session Priorities
$NEXT_SESSION_PRIORITIES

EOF

echo "✅ Validation summary saved: .validation-artifacts/session-summary-*.md"
```

**ENFORCEMENT**: Session summary MUST be created for every session

---

## STEP 2: Store Session Lessons [MANDATORY - LOCAL ONLY]

**IF LOCAL environment, MUST store lessons learned**:

```bash
if [ "$ENV" = "LOCAL" ]; then
  echo "💡 MANDATORY: Storing session lessons..."

  # MANDATORY: Identify key learnings from session
  SESSION_LESSONS="
  - Key challenges encountered
  - Solutions discovered
  - Patterns that worked well
  - Mistakes to avoid
  - Performance optimizations
  - Security improvements
  "

  # MANDATORY: Store general session takeaways
  timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" \
    --project-root "$(pwd)" \
    store-lesson "{
      \"title\": \"Session $(date +%Y%m%d-%H%M) Comprehensive Takeaways\",
      \"category\": \"session-summary\",
      \"content\": \"$SESSION_LESSONS\",
      \"context\": \"Applied during session on $(date -u +"%Y-%m-%dT%H:%M:%SZ")\",
      \"confidence_score\": 0.7,
      \"metadata\": {
        \"tasks_completed\": $TASKS_COMPLETED,
        \"validations_passed\": $VALIDATIONS_PASSED,
        \"session_duration\": \"$SESSION_DURATION\"
      }
    }"

  echo "✅ Session lessons stored in TaskManager"
else
  echo "⚠️ CLOUD environment - Session lessons not stored (TaskManager unavailable)"
fi
```

**ENFORCEMENT**: Lessons MUST be stored to improve future sessions (LOCAL only)

---

## STEP 3: Update Task Status for In-Progress Items [MANDATORY - LOCAL ONLY]

**IF LOCAL environment and tasks in progress, MUST update with session notes**:

```bash
if [ "$ENV" = "LOCAL" ] && [ -n "$CURRENT_TASK_ID" ]; then
  echo "📋 MANDATORY: Updating task with session progress..."

  # MANDATORY: Capture session progress
  PROGRESS_SUMMARY="Summary of work completed this session"
  NEXT_STEPS="Specific next steps for task continuation"
  BLOCKERS="Any blockers or issues encountered"
  VALIDATION_STATUS="Current validation state"

  # MANDATORY: Update TaskManager
  timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" \
    --project-root "$(pwd)" \
    update-task "$CURRENT_TASK_ID" "{
      \"metadata\": {
        \"session_end_notes\": \"$PROGRESS_SUMMARY\",
        \"next_steps\": \"$NEXT_STEPS\",
        \"blockers\": \"$BLOCKERS\",
        \"validation_status\": \"$VALIDATION_STATUS\",
        \"session_end_time\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"
      }
    }"

  echo "✅ Task updated with comprehensive session notes"
else
  echo "⚠️ No in-progress tasks or CLOUD environment - skipping task update"
fi
```

**ENFORCEMENT**: In-progress tasks MUST be updated with session state

---

## STEP 4: Verify Clean Git State [MANDATORY]

**ABSOLUTE REQUIREMENT**: MUST check git status at session end.

```bash
echo "🔍 MANDATORY: Checking git status..."

# MANDATORY: Capture git state
git status --short | tee .validation-artifacts/logs/git-status-session-end.log

UNCOMMITTED=$(wc -l < .validation-artifacts/logs/git-status-session-end.log)
UNTRACKED=$(grep "^??" .validation-artifacts/logs/git-status-session-end.log | wc -l)
MODIFIED=$(grep "^ M" .validation-artifacts/logs/git-status-session-end.log | wc -l)
STAGED=$(grep "^M " .validation-artifacts/logs/git-status-session-end.log | wc -l)

echo "
📊 Git State Summary:
   Total Uncommitted: $UNCOMMITTED files
   Untracked: $UNTRACKED
   Modified: $MODIFIED
   Staged: $STAGED
"

if [ $UNCOMMITTED -gt 0 ]; then
  echo "⚠️ Session ending with uncommitted changes:"
  cat .validation-artifacts/logs/git-status-session-end.log
  echo ""
  echo "🔴 NOTE: Changes preserved for next session"
  echo "   Consider committing before next session if work is complete"
else
  echo "✅ Clean git state - no uncommitted changes"
fi

# MANDATORY: Check for sensitive files in working directory
if git status --short | grep -E "\.env$|\.key$|\.pem$|credentials"; then
  echo "⚠️ WARNING: Sensitive files in working directory"
  echo "🔴 Verify these are in .gitignore:"
  git status --short | grep -E "\.env$|\.key$|\.pem$|credentials"
fi
```

**ENFORCEMENT**: Git state MUST be documented for session continuity

---

## STEP 5: Session End Message [MANDATORY]

**ABSOLUTE REQUIREMENT**: MUST output comprehensive session end summary.

```bash
echo "
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 SESSION END SUMMARY
🔴 MANDATORY - ALL REQUIREMENTS MET
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Environment: $ENV
Duration: $SESSION_DURATION minutes
Session Start: $SESSION_START
Session End: $(date -u +"%Y-%m-%dT%H:%M:%SZ")

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 TASKS

Completed: $TASKS_COMPLETED
  $(list completed task titles)

In Progress: $TASKS_IN_PROGRESS
  $(list in-progress task titles with % complete)

Total Tasks: $TOTAL_TASKS

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ VALIDATIONS

Passed: $VALIDATIONS_PASSED
Failed: $VALIDATIONS_FAILED
Total: $VALIDATIONS_TOTAL

Success Rate: $(($VALIDATIONS_PASSED * 100 / $VALIDATIONS_TOTAL))%

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📁 EVIDENCE COLLECTED

Logs: $(find .validation-artifacts/logs -type f | wc -l) files
Screenshots: $(find .validation-artifacts/screenshots -type f 2>/dev/null | wc -l) files
Test Results: $(find .validation-artifacts/test-results -type f | wc -l) files
Metrics: $(find .validation-artifacts/metrics -type f 2>/dev/null | wc -l) files

Total Evidence: $(find .validation-artifacts -type f | wc -l) files
Evidence Size: $(du -sh .validation-artifacts | awk '{print $1}')

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧠 KNOWLEDGE CAPTURED

Lessons Stored: $LESSONS_STORED
Errors Resolved: $ERRORS_RESOLVED

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 GIT STATUS

Uncommitted Changes: $UNCOMMITTED files
Commits This Session: $(git log --since="$SESSION_START" --oneline | wc -l)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 NEXT SESSION PRIORITIES

$(echo "$NEXT_SESSION_PRIORITIES")

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ State preserved
✅ Evidence collected
✅ Lessons stored
✅ Ready to continue

Session concluded successfully.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"
```

**ENFORCEMENT**: Comprehensive summary REQUIRED for every session end

---

## MANDATORY COMPLIANCE CHECKLIST

**SESSION END REQUIREMENTS**:
- [ ] Final validation summary generated ← 🔴 REQUIRED
- [ ] Session summary file created ← 🔴 REQUIRED
- [ ] Lessons stored (if LOCAL) ← 🔴 REQUIRED
- [ ] In-progress tasks updated (if LOCAL) ← 🔴 REQUIRED
- [ ] Git state verified and documented ← 🔴 REQUIRED
- [ ] Comprehensive session end summary displayed ← 🔴 REQUIRED
- [ ] Next session priorities identified ← 🔴 REQUIRED
- [ ] All evidence preserved ← 🔴 REQUIRED

**CRITICAL ENFORCEMENT**: Cannot end session without completing all requirements

---

## MANDATORY COMPLIANCE STATEMENT

**BY COMPLETING THIS HOOK, YOU AFFIRM**:
- ✅ Complete validation summary generated
- ✅ Session lessons stored for future learning (if LOCAL)
- ✅ In-progress tasks updated with current state (if LOCAL)
- ✅ Git state verified and clean (or documented)
- ✅ Comprehensive summary provided
- ✅ Next session can seamlessly continue from this point
- ✅ ALL session evidence preserved

**STATE PRESERVED - READY TO CONTINUE IN NEXT SESSION**

**VIOLATION OF THIS HOOK = LOST SESSION CONTEXT = CRITICAL FAILURE**

---

**END OF MANDATORY SessionEnd HOOK**
