# ⚠️ MANDATORY: Notification Hook
# 🔴 NON-NEGOTIABLE - ENHANCED NOTIFICATION VALIDATION

**ENFORCEMENT**: This hook executes when notifications are sent. ALL notifications MUST include validation evidence.

**VIOLATION CONSEQUENCE**: Notifications without evidence = Unverified claims = User mistrust.

**CORE PRINCIPLE**: **NOTIFICATIONS MUST PROVE COMPLETION, NOT JUST CLAIM IT**

---

## NOTIFICATION TYPE DETECTION [MANDATORY]

**ABSOLUTE REQUIREMENT**: MUST identify notification type.

**Notification Types**:
- Task completion
- Task failure/error
- Progress update
- Security alert
- Build status
- Test results

**ENFORCEMENT**: Different enhancements apply to each type

---

## TASK COMPLETION NOTIFICATION [MANDATORY]

**When sending task completion notification, MUST include comprehensive validation summary**:

```bash
if [ "$NOTIFICATION_TYPE" = "completion" ]; then
  echo "📧 MANDATORY: Enhancing completion notification with validation evidence..."

  # MANDATORY: Gather validation summary
  TESTS_STATUS=$(get test status from .validation-artifacts/)
  BUILD_STATUS=$(get build status from .validation-artifacts/)
  SECURITY_STATUS=$(get security scan status from .validation-artifacts/)
  LINT_STATUS=$(get linting status from .validation-artifacts/)
  PERF_SCORE=$(get performance score from .validation-artifacts/ if available)

  # MANDATORY: Count evidence files
  LOG_COUNT=$(find .validation-artifacts/logs -type f | wc -l)
  SCREENSHOT_COUNT=$(find .validation-artifacts/screenshots -type f 2>/dev/null | wc -l)
  TEST_RESULT_COUNT=$(find .validation-artifacts/test-results -type f | wc -l)

  # MANDATORY: Create enhanced notification
  NOTIFICATION_MESSAGE="
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ TASK COMPLETED: $TASK_TITLE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 VALIDATION SUMMARY (PROVEN WITH EVIDENCE):

✅ Tests: $TESTS_STATUS
   Evidence: .validation-artifacts/test-results/ ($TEST_RESULT_COUNT files)

✅ Build: $BUILD_STATUS
   Evidence: .validation-artifacts/logs/build-output-*.log

✅ Security: $SECURITY_STATUS
   Evidence: .validation-artifacts/logs/npm-audit-*.log

✅ Linting: $LINT_STATUS
   Evidence: .validation-artifacts/logs/lint-*.log

$(if [ -n "$PERF_SCORE" ]; then echo "✅ Performance: $PERF_SCORE/100"; fi)
$(if [ -n "$PERF_SCORE" ]; then echo "   Evidence: .validation-artifacts/metrics/"; fi)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📁 COMPREHENSIVE EVIDENCE COLLECTED:

- Logs: $LOG_COUNT files
- Screenshots: $SCREENSHOT_COUNT files
- Test Results: $TEST_RESULT_COUNT files

Evidence location: .validation-artifacts/

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 VALIDATION METHODS USED: $(count validation methods)

✅ ALL REQUIREMENTS MET - TASK COMPLETION VERIFIED

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

$ORIGINAL_NOTIFICATION_MESSAGE
"

  echo "$NOTIFICATION_MESSAGE"
fi
```

**ENFORCEMENT**: Completion notifications MUST include validation proof

---

## TASK FAILURE NOTIFICATION [MANDATORY]

**When sending error/failure notification, MUST include comprehensive diagnostics**:

```bash
if [ "$NOTIFICATION_TYPE" = "failure" ]; then
  echo "📧 MANDATORY: Enhancing failure notification with diagnostics..."

  # MANDATORY: Gather diagnostic information
  ERROR_LOGS=$(find .validation-artifacts/logs -name "*error*" -o -name "*failed*" 2>/dev/null | head -5)
  LAST_SUCCESS=$(identify last successful validation)
  FAILURE_POINT=$(identify where failure occurred)

  # MANDATORY: Create enhanced failure notification
  NOTIFICATION_MESSAGE="
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ TASK FAILED: $TASK_TITLE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️  FAILURE REASON: $FAILURE_REASON

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔍 DIAGNOSTICS:

Failure Point: $FAILURE_POINT
Last Known Good State: $LAST_SUCCESS

Error Logs:
$(for LOG in $ERROR_LOGS; do
  echo "   - $LOG"
  tail -10 "$LOG" 2>/dev/null
done)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📁 DIAGNOSTIC EVIDENCE:

Logs: .validation-artifacts/logs/
Error Details: $(echo $ERROR_LOGS | tr ' ' '\n')

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔧 RECOMMENDED ACTIONS:

1. Review error logs at: .validation-artifacts/logs/
2. Check last known good state: $LAST_SUCCESS
3. Fix identified issues
4. Re-run validation

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

$ORIGINAL_NOTIFICATION_MESSAGE
"

  echo "$NOTIFICATION_MESSAGE"
fi
```

**ENFORCEMENT**: Failure notifications MUST include diagnostic information

---

## PROGRESS UPDATE NOTIFICATION [MANDATORY]

**When sending progress update, MUST include validation metrics**:

```bash
if [ "$NOTIFICATION_TYPE" = "progress" ]; then
  echo "📧 MANDATORY: Enhancing progress notification with metrics..."

  # MANDATORY: Calculate progress metrics
  VALIDATIONS_PASSED=$(count passed validations)
  VALIDATIONS_TOTAL=$(count total validations required)
  PROGRESS_PCT=$(($VALIDATIONS_PASSED * 100 / $VALIDATIONS_TOTAL))

  # MANDATORY: Identify remaining work
  REMAINING_VALIDATIONS=$(list validations not yet completed)

  # MANDATORY: Create enhanced progress notification
  NOTIFICATION_MESSAGE="
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔄 PROGRESS UPDATE: $TASK_TITLE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 COMPLETION: $PROGRESS_PCT% ($VALIDATIONS_PASSED / $VALIDATIONS_TOTAL validations)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ COMPLETED VALIDATIONS:
$(list completed validations with checkmarks)

⏳ REMAINING VALIDATIONS:
$(echo "$REMAINING_VALIDATIONS")

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

$ORIGINAL_NOTIFICATION_MESSAGE
"

  echo "$NOTIFICATION_MESSAGE"
fi
```

**ENFORCEMENT**: Progress notifications MUST include quantitative metrics

---

## SECURITY ALERT NOTIFICATION [MANDATORY]

**When sending security alert, MUST include scan results**:

```bash
if [ "$NOTIFICATION_TYPE" = "security" ]; then
  echo "📧 MANDATORY: Enhancing security notification with scan results..."

  # MANDATORY: Get security scan details
  CRITICAL_VULNS=$(grep -o "[0-9]* critical" .validation-artifacts/logs/npm-audit*.log 2>/dev/null | tail -1)
  HIGH_VULNS=$(grep -o "[0-9]* high" .validation-artifacts/logs/npm-audit*.log 2>/dev/null | tail -1)

  # MANDATORY: Create enhanced security notification
  NOTIFICATION_MESSAGE="
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔒 SECURITY ALERT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️  VULNERABILITIES DETECTED:

Critical: $CRITICAL_VULNS
High: $HIGH_VULNS

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 SCAN RESULTS:

Full audit: .validation-artifacts/logs/npm-audit-*.log

Top vulnerabilities:
$(grep -A 5 "critical\|high" .validation-artifacts/logs/npm-audit*.log 2>/dev/null | head -20)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔧 IMMEDIATE ACTIONS REQUIRED:

1. Review: npm audit report
2. Fix: npm audit fix
3. Manual: Review .validation-artifacts/logs/npm-audit*.log
4. Verify: Re-run security scan

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

$ORIGINAL_NOTIFICATION_MESSAGE
"

  echo "$NOTIFICATION_MESSAGE"
fi
```

**ENFORCEMENT**: Security notifications MUST include scan results and action items

---

## BUILD STATUS NOTIFICATION [MANDATORY]

**When sending build status, MUST include build logs**:

```bash
if [ "$NOTIFICATION_TYPE" = "build" ]; then
  echo "📧 MANDATORY: Enhancing build notification with logs..."

  # MANDATORY: Get build status
  BUILD_RESULT=$(check if build succeeded or failed)
  BUILD_ERRORS=$(grep -i "error" .validation-artifacts/logs/build-output*.log 2>/dev/null | wc -l)

  # MANDATORY: Create enhanced build notification
  if [ "$BUILD_RESULT" = "success" ]; then
    NOTIFICATION_MESSAGE="
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ BUILD SUCCESSFUL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Build completed successfully with zero errors.

Build logs: .validation-artifacts/logs/build-output-*.log
Build artifacts: dist/ or build/

$ORIGINAL_NOTIFICATION_MESSAGE
"
  else
    NOTIFICATION_MESSAGE="
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ BUILD FAILED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Build failed with $BUILD_ERRORS errors.

Build logs: .validation-artifacts/logs/build-output-*.log

Error details:
$(grep -i "error" .validation-artifacts/logs/build-output*.log 2>/dev/null | head -10)

$ORIGINAL_NOTIFICATION_MESSAGE
"
  fi

  echo "$NOTIFICATION_MESSAGE"
fi
```

**ENFORCEMENT**: Build notifications MUST include log references

---

## MANDATORY COMPLIANCE CHECKLIST

**NOTIFICATION ENHANCEMENT REQUIREMENTS**:
- [ ] Notification type identified ← 🔴 REQUIRED
- [ ] Validation summary included (completion) ← 🔴 REQUIRED
- [ ] Diagnostic info included (failure) ← 🔴 REQUIRED
- [ ] Evidence locations provided ← 🔴 REQUIRED
- [ ] Quantitative metrics included ← 🔴 REQUIRED
- [ ] Action items specified (if applicable) ← 🔴 REQUIRED

**CRITICAL ENFORCEMENT**: Notifications without evidence are incomplete

---

## MANDATORY COMPLIANCE STATEMENT

**BY COMPLETING THIS HOOK, YOU AFFIRM**:
- ✅ Notification enhanced with validation evidence
- ✅ Evidence locations clearly specified
- ✅ Metrics and quantitative data included
- ✅ Diagnostic information provided (for failures)
- ✅ User can verify claims independently
- ✅ "PROVE IT - DON'T ASSUME IT" principle enforced

**NOTIFICATIONS BACKED BY EVIDENCE - VERIFIABLE CLAIMS**

**VIOLATION OF THIS HOOK = UNVERIFIED CLAIMS = USER MISTRUST**

---

**END OF MANDATORY Notification HOOK**
