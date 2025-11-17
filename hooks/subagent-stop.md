# ⚠️ MANDATORY: SubagentStop Hook
# 🔴 NON-NEGOTIABLE - SUBAGENT OUTPUT VALIDATION

**ENFORCEMENT**: This hook executes when a subagent (Task tool call) concludes. ALL subagent outputs MUST be validated.

**VIOLATION CONSEQUENCE**: Unvalidated subagent output = Unreliable results = Integration failures.

---

## STEP 1: Analyze Subagent Output [MANDATORY]

**ABSOLUTE REQUIREMENT**: MUST identify and classify subagent's task.

**What was subagent's assigned task?**
- Research/Investigation
- Implementation
- Testing
- Documentation
- Analysis

**ENFORCEMENT**: Different validation criteria apply to each task type

---

## STEP 2: Validate Output Quality [MANDATORY]

### For Research Tasks [MANDATORY]

```bash
if [ "$SUBAGENT_TASK_TYPE" = "research" ]; then
  echo "🔍 MANDATORY: Validating research output..."

  # MANDATORY Check 1: Verify research content exists
  if [ -z "$RESEARCH_OUTPUT" ] || [ $(echo "$RESEARCH_OUTPUT" | wc -w) -lt 50 ]; then
    echo "❌ CRITICAL: Subagent returned insufficient research"
    echo "   Expected: Comprehensive findings"
    echo "   Got: $(echo $RESEARCH_OUTPUT | wc -w) words"
    SUBAGENT_SUCCESS=false
  else
    echo "✅ Research completed: $(echo $RESEARCH_OUTPUT | wc -w) words"
    SUBAGENT_SUCCESS=true
  fi

  # MANDATORY Check 2: Verify sources cited (if applicable)
  if echo "$RESEARCH_OUTPUT" | grep -q "http\|https\|source:"; then
    echo "✅ Sources/references included"
  else
    echo "⚠️ WARNING: No sources cited - verify research quality"
  fi

  # MANDATORY Check 3: Verify key questions answered
  if [ -n "$RESEARCH_QUESTIONS" ]; then
    for QUESTION in $RESEARCH_QUESTIONS; do
      if echo "$RESEARCH_OUTPUT" | grep -qi "$(echo $QUESTION | cut -d' ' -f1-3)"; then
        echo "✅ Question addressed: $QUESTION"
      else
        echo "⚠️ WARNING: Question may not be answered: $QUESTION"
      fi
    done
  fi
fi
```

**ENFORCEMENT**: Research must be comprehensive and address assigned questions

---

### For Implementation Tasks [MANDATORY]

```bash
if [ "$SUBAGENT_TASK_TYPE" = "implementation" ]; then
  echo "🔍 MANDATORY: Validating implementation output..."

  # MANDATORY Check 1: Verify code was produced
  if [ -n "$CODE_OUTPUT" ]; then
    CODE_LINES=$(echo "$CODE_OUTPUT" | wc -l)
    echo "✅ Code generated: $CODE_LINES lines"

    # MANDATORY Check 2: Quick syntax validation
    echo "🔍 MANDATORY: Validating syntax..."

    # Detect language and validate
    if echo "$CODE_OUTPUT" | grep -q "function\|const\|let\|var\|=>"; then
      # JavaScript/TypeScript
      echo "$CODE_OUTPUT" | node -c - 2>&1
      SYNTAX_EXIT=$?
    elif echo "$CODE_OUTPUT" | grep -q "def \|import \|class "; then
      # Python
      echo "$CODE_OUTPUT" | python3 -m py_compile - 2>&1
      SYNTAX_EXIT=$?
    fi

    if [ $SYNTAX_EXIT -eq 0 ]; then
      echo "✅ Syntax valid"
      SUBAGENT_SUCCESS=true
    else
      echo "❌ CRITICAL: Syntax errors in subagent code"
      SUBAGENT_SUCCESS=false
    fi

    # MANDATORY Check 3: Verify implementation completeness
    if echo "$CODE_OUTPUT" | grep -q "TODO\|FIXME\|XXX"; then
      echo "⚠️ WARNING: Implementation contains TODOs"
      echo "   Subagent may not have completed implementation"
    fi
  else
    echo "❌ CRITICAL: No code produced by subagent"
    SUBAGENT_SUCCESS=false
  fi
fi
```

**ENFORCEMENT**: Implementation must include valid, complete code

---

### For Testing Tasks [MANDATORY]

```bash
if [ "$SUBAGENT_TASK_TYPE" = "testing" ]; then
  echo "🔍 MANDATORY: Validating testing output..."

  # MANDATORY Check 1: Verify tests ran
  if echo "$TEST_OUTPUT" | grep -q "PASS\|passed\|✓"; then
    TESTS_PASSED=$(echo "$TEST_OUTPUT" | grep -o "[0-9]* passed" | head -1 || echo "unknown")
    echo "✅ Subagent tests passed: $TESTS_PASSED"
    SUBAGENT_SUCCESS=true
  elif echo "$TEST_OUTPUT" | grep -q "FAIL\|failed\|✗"; then
    TESTS_FAILED=$(echo "$TEST_OUTPUT" | grep -o "[0-9]* failed" | head -1 || echo "unknown")
    echo "❌ CRITICAL: Subagent tests failed: $TESTS_FAILED"
    echo ""
    echo "Failed tests:"
    echo "$TEST_OUTPUT" | grep -A 5 "FAIL\|failed" | head -20
    SUBAGENT_SUCCESS=false
  else
    echo "❌ CRITICAL: Cannot determine test results"
    echo "   Test output unclear or missing"
    SUBAGENT_SUCCESS=false
  fi

  # MANDATORY Check 2: Verify test coverage
  if echo "$TEST_OUTPUT" | grep -q "coverage\|Coverage"; then
    COVERAGE=$(echo "$TEST_OUTPUT" | grep -o "[0-9]*\.[0-9]*%" | tail -1)
    echo "📊 Test coverage: $COVERAGE"
  else
    echo "⚠️ WARNING: No coverage data from subagent"
  fi
fi
```

**ENFORCEMENT**: Testing results must be clear and passing

---

### For Documentation Tasks [MANDATORY]

```bash
if [ "$SUBAGENT_TASK_TYPE" = "documentation" ]; then
  echo "🔍 MANDATORY: Validating documentation output..."

  # MANDATORY Check 1: Verify documentation content
  if [ -n "$DOCS_OUTPUT" ] && [ $(echo "$DOCS_OUTPUT" | wc -w) -gt 100 ]; then
    echo "✅ Documentation generated: $(echo $DOCS_OUTPUT | wc -w) words"
    SUBAGENT_SUCCESS=true
  else
    echo "❌ CRITICAL: Insufficient documentation"
    SUBAGENT_SUCCESS=false
  fi

  # MANDATORY Check 2: Verify markdown formatting (if applicable)
  if echo "$DOCS_OUTPUT" | head -1 | grep -q "^#"; then
    echo "✅ Markdown formatting detected"
  fi

  # MANDATORY Check 3: Verify key sections present
  REQUIRED_SECTIONS=("## " "### " "```")
  for SECTION in "${REQUIRED_SECTIONS[@]}"; do
    if echo "$DOCS_OUTPUT" | grep -q "$SECTION"; then
      echo "✅ Section marker found: $SECTION"
    fi
  done
fi
```

**ENFORCEMENT**: Documentation must be comprehensive and well-formatted

---

### For Analysis Tasks [MANDATORY]

```bash
if [ "$SUBAGENT_TASK_TYPE" = "analysis" ]; then
  echo "🔍 MANDATORY: Validating analysis output..."

  # MANDATORY Check 1: Verify analysis findings
  if [ -n "$ANALYSIS_OUTPUT" ]; then
    echo "✅ Analysis completed: $(echo $ANALYSIS_OUTPUT | wc -w) words"

    # MANDATORY Check 2: Verify data/metrics included
    if echo "$ANALYSIS_OUTPUT" | grep -q "[0-9]*%\|[0-9]* ms\|[0-9]* bytes"; then
      echo "✅ Quantitative data included"
      SUBAGENT_SUCCESS=true
    else
      echo "⚠️ WARNING: No quantitative data in analysis"
    fi

    # MANDATORY Check 3: Verify recommendations provided
    if echo "$ANALYSIS_OUTPUT" | grep -qi "recommend\|suggest\|should"; then
      echo "✅ Recommendations included"
    else
      echo "⚠️ WARNING: No clear recommendations"
    fi
  else
    echo "❌ CRITICAL: No analysis output"
    SUBAGENT_SUCCESS=false
  fi
fi
```

**ENFORCEMENT**: Analysis must include data and recommendations

---

## STEP 3: Integration Decision [MANDATORY]

**ABSOLUTE REQUIREMENT**: MUST decide whether to integrate or retry subagent output.

```bash
echo "🔍 MANDATORY: Making integration decision..."

if [ "$SUBAGENT_SUCCESS" = "true" ]; then
  echo "✅ Subagent task successful - integrating results"
  echo ""

  # MANDATORY: Integrate subagent output into main task
  echo "📋 Integration actions:"
  echo "   - Incorporating subagent findings"
  echo "   - Updating task progress"
  echo "   - Recording subagent contribution"

  # MANDATORY: Update task metadata with subagent results (LOCAL only)
  if [ "$ENV" = "LOCAL" ] && [ -n "$TASK_ID" ]; then
    timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" \
      --project-root "$(pwd)" \
      update-task "$TASK_ID" "{
        \"metadata\": {
          \"subagent_results\": {
            \"task_type\": \"$SUBAGENT_TASK_TYPE\",
            \"success\": true,
            \"output_summary\": \"$(echo $SUBAGENT_OUTPUT | head -c 200)...\",
            \"timestamp\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"
          }
        }
      }"

    echo "✅ Task updated with subagent results"
  fi
else
  echo "❌ Subagent task failed - analyzing failure..."
  echo ""
  echo "Failure Analysis:"
  echo "   Task Type: $SUBAGENT_TASK_TYPE"
  echo "   Failure Reason: $FAILURE_REASON"
  echo ""

  echo "🔄 MANDATORY: Retrying with different approach..."
  echo "   Strategy: $RETRY_STRATEGY"

  # DO NOT INTEGRATE - RETRY OR ESCALATE
fi
```

**ENFORCEMENT**: Failed subagent results must NOT be integrated without fixing

---

## STEP 4: Validation Evidence from Subagent [MANDATORY]

**IF subagent performed testing/validation, MUST collect their evidence**:

```bash
if [ -n "$SUBAGENT_EVIDENCE_PATH" ]; then
  echo "📋 MANDATORY: Collecting subagent validation evidence..."

  # MANDATORY: Verify evidence exists
  if [ -d "$SUBAGENT_EVIDENCE_PATH" ] || [ -f "$SUBAGENT_EVIDENCE_PATH" ]; then
    echo "✅ Subagent evidence found"

    # MANDATORY: Copy to main validation artifacts
    mkdir -p .validation-artifacts/subagent/
    cp -r "$SUBAGENT_EVIDENCE_PATH" .validation-artifacts/subagent/ 2>/dev/null

    # MANDATORY: Catalog evidence
    echo "📁 Subagent evidence collected:"
    find .validation-artifacts/subagent/ -type f | head -20

    EVIDENCE_COUNT=$(find .validation-artifacts/subagent/ -type f | wc -l)
    echo "   Total files: $EVIDENCE_COUNT"
  else
    echo "⚠️ WARNING: Subagent evidence path not found"
  fi
else
  echo "ℹ️  No validation evidence from subagent"
fi
```

**ENFORCEMENT**: Subagent evidence must be preserved and cataloged

---

## MANDATORY COMPLIANCE CHECKLIST

**SUBAGENT VALIDATION REQUIREMENTS**:
- [ ] Subagent task type identified ← 🔴 REQUIRED
- [ ] Output quality validated ← 🔴 REQUIRED
- [ ] Success/failure determined ← 🔴 REQUIRED
- [ ] Integration decision made ← 🔴 REQUIRED
- [ ] Evidence collected (if applicable) ← 🔴 REQUIRED
- [ ] Task metadata updated (if LOCAL) ← 🔴 REQUIRED

**CRITICAL ENFORCEMENT**: Cannot integrate subagent output without validation

---

## MANDATORY COMPLIANCE STATEMENT

**BY COMPLETING THIS HOOK, YOU AFFIRM**:
- ✅ Subagent output thoroughly validated
- ✅ Quality criteria met for task type
- ✅ Integration decision based on validation results
- ✅ Evidence preserved in .validation-artifacts/
- ✅ Task updated with subagent contribution (if LOCAL)
- ✅ Ready to proceed with integrated results OR retry

**SUBAGENT VALIDATION COMPLETE - INTEGRATION SAFE**

**VIOLATION OF THIS HOOK = UNVALIDATED SUBAGENT OUTPUT = UNRELIABLE RESULTS**

---

**END OF MANDATORY SubagentStop HOOK**
