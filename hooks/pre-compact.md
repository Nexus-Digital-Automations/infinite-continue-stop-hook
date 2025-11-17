# ⚠️ MANDATORY: PreCompact Hook
# 🔴 NON-NEGOTIABLE - CRITICAL CONTEXT PRESERVATION

**ENFORCEMENT**: This hook executes BEFORE conversation compaction. ALL context MUST be preserved.

**VIOLATION CONSEQUENCE**: Lost conversation context = Cannot resume work = CRITICAL FAILURE.

**CORE PRINCIPLE**: **PRESERVE EVERYTHING CRITICAL BEFORE COMPACTION**

---

## STEP 1: Save Active Task Context [MANDATORY - LOCAL ONLY]

**IF LOCAL environment and task in progress, MUST preserve complete context**:

```bash
if [ "$ENV" = "LOCAL" ] && [ -n "$CURRENT_TASK_ID" ]; then
  echo "💾 MANDATORY: Preserving task context before compaction..."

  # MANDATORY: Get current task details
  TASK_DETAILS=$(timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" \
    --project-root "$(pwd)" \
    get-task "$CURRENT_TASK_ID")

  # MANDATORY: Extract critical context from conversation
  CONVERSATION_SUMMARY="Key decisions and discussions from conversation"
  DECISIONS="Critical decisions made during conversation"
  BLOCKERS="Any blockers or issues discussed"
  VALIDATIONS="Current validation status and results"
  NEXT_ACTIONS="Specific next actions to take"

  # MANDATORY: Update task with pre-compact context
  timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" \
    --project-root "$(pwd)" \
    update-task "$CURRENT_TASK_ID" "{
      \"metadata\": {
        \"pre_compact_summary\": \"$CONVERSATION_SUMMARY\",
        \"decisions_made\": \"$DECISIONS\",
        \"blockers_found\": \"$BLOCKERS\",
        \"validations_status\": \"$VALIDATIONS\",
        \"next_actions\": \"$NEXT_ACTIONS\",
        \"compact_timestamp\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\",
        \"conversation_length\": \"$CONVERSATION_LENGTH tokens\"
      }
    }"

  echo "✅ Task context preserved in TaskManager metadata"
else
  echo "⚠️ No active task or CLOUD environment - skipping task context preservation"
fi
```

**ENFORCEMENT**: Active task context MUST be saved before compaction (LOCAL only)

---

## STEP 2: Store Important Technical Discoveries [MANDATORY]

**ABSOLUTE REQUIREMENT**: MUST capture technical insights before they're lost.

```bash
if [ -n "$TECHNICAL_DISCOVERIES" ]; then
  echo "🔬 MANDATORY: Storing technical insights..."

  # MANDATORY: Identify key technical learnings
  DISCOVERIES="
  - Architectural patterns discovered
  - Performance optimization techniques
  - Debugging approaches that worked
  - Integration solutions found
  - Security improvements identified
  "

  if [ "$ENV" = "LOCAL" ]; then
    # MANDATORY: Store in TaskManager (LOCAL)
    timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" \
      --project-root "$(pwd)" \
      store-lesson "{
        \"title\": \"Technical Discovery - Pre-Compaction $(date +%Y%m%d-%H%M)\",
        \"category\": \"$(determine category: architecture|performance|debugging|integration|security)\",
        \"content\": \"$DISCOVERIES\",
        \"context\": \"Discovered during conversation compacted at $(date -u +"%Y-%m-%dT%H:%M:%SZ")\",
        \"confidence_score\": 0.8,
        \"metadata\": {
          \"source\": \"pre_compaction\",
          \"conversation_length\": \"$CONVERSATION_LENGTH tokens\"
        }
      }"

    echo "✅ Technical discoveries stored in TaskManager"
  else
    # CLOUD: Store in file
    echo "$DISCOVERIES" >> .validation-artifacts/logs/technical-discoveries.log
    echo "✅ Technical discoveries logged locally"
  fi
else
  echo "ℹ️  No significant technical discoveries to preserve"
fi
```

**ENFORCEMENT**: Technical insights MUST be preserved for future reference

---

## STEP 3: Save Error Resolutions [MANDATORY]

**IF errors were debugged/resolved, MUST store solutions**:

```bash
if [ -n "$ERRORS_DEBUGGED" ]; then
  echo "🔧 MANDATORY: Storing error resolutions..."

  # MANDATORY: For each error resolved during conversation
  for ERROR in $ERRORS_DEBUGGED; do
    ERROR_TITLE="$(extract error title)"
    ERROR_TYPE="$(determine type: linter|build|runtime|integration|security)"
    ERROR_MESSAGE="$(extract error message)"
    RESOLUTION="$(extract how it was fixed)"
    PREVENTION="$(extract how to prevent in future)"

    if [ "$ENV" = "LOCAL" ]; then
      # MANDATORY: Store in TaskManager (LOCAL)
      timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" \
        --project-root "$(pwd)" \
        store-error "{
          \"title\": \"$ERROR_TITLE\",
          \"error_type\": \"$ERROR_TYPE\",
          \"message\": \"$ERROR_MESSAGE\",
          \"resolution_method\": \"$RESOLUTION\",
          \"prevention_strategy\": \"$PREVENTION\",
          \"context\": \"Resolved before compaction at $(date -u +"%Y-%m-%dT%H:%M:%SZ")\",
          \"metadata\": {
            \"source\": \"pre_compaction\"
          }
        }"

      echo "✅ Error resolution stored: $ERROR_TITLE"
    else
      # CLOUD: Log locally
      echo "Error: $ERROR_TITLE | Type: $ERROR_TYPE | Resolution: $RESOLUTION" >> .validation-artifacts/logs/error-resolutions.log
      echo "✅ Error resolution logged: $ERROR_TITLE"
    fi
  done
else
  echo "ℹ️  No errors were resolved during conversation"
fi
```

**ENFORCEMENT**: Error solutions MUST be preserved to prevent repeated debugging

---

## STEP 4: Create Compact Summary File [MANDATORY]

**ABSOLUTE REQUIREMENT**: MUST create comprehensive summary file.

```bash
echo "📄 MANDATORY: Creating compaction summary file..."

# MANDATORY: Create detailed summary
cat > .validation-artifacts/logs/compact-summary-$(date +%Y%m%d-%H%M%S).md << 'EOF'
# Pre-Compaction Summary
Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
Conversation Length: $CONVERSATION_LENGTH tokens
Reason for Compaction: Token limit approaching

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Active Tasks

### In Progress
$(list tasks with ID, title, status, progress %)

### Approved
$(list approved tasks ready to work on)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Key Decisions Made

$(list critical decisions from conversation)
- Decision 1: [description] - Rationale: [why]
- Decision 2: [description] - Rationale: [why]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Technical Insights

### Architectural
$(list architectural discoveries)

### Performance
$(list performance optimizations)

### Security
$(list security improvements)

### Debugging
$(list debugging techniques that worked)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Blockers & Issues

$(list any blockers encountered)
- Blocker 1: [description] - Status: [resolved/pending]
- Blocker 2: [description] - Status: [resolved/pending]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Validation Status

### Completed Validations
$(list validations that passed)

### Pending Validations
$(list validations still needed)

### Failed Validations
$(list validations that failed - need fixing)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Next Steps

### Immediate Actions
$(list what should be done next immediately)

### Short-term Goals
$(list upcoming tasks for next few sessions)

### Long-term Objectives
$(list overall project goals)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Recovery Information

This conversation was compacted at $(date -u +"%Y-%m-%dT%H:%M:%SZ").

ALL critical information has been preserved in:
- TaskManager task metadata (if LOCAL)
- Stored lessons and errors
- Validation artifacts (.validation-artifacts/)
- This summary file

Next session should be able to continue seamlessly from this point by:
1. Reading this summary file
2. Querying TaskManager for task state (if LOCAL)
3. Reviewing .validation-artifacts/ for evidence
4. Continuing work from documented next steps

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ COMPACTION SAFE - ALL CRITICAL CONTEXT PRESERVED

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EOF

echo "✅ Compaction summary saved: .validation-artifacts/logs/compact-summary-*.md"
```

**ENFORCEMENT**: Summary file MUST contain all information needed to resume work

---

## STEP 5: Verify Recovery Possible [MANDATORY]

**ABSOLUTE REQUIREMENT**: MUST verify next session can recover from preserved context.

```bash
echo "🔍 MANDATORY: Verifying recovery information complete..."

# MANDATORY: Check that essential info is preserved
REQUIRED_INFO=(
  "Current task ID and status"
  "Progress percentage"
  "Validation status"
  "Next actions"
  "Key decisions"
  "Technical discoveries"
  "Error resolutions"
  "Blockers (if any)"
)

MISSING_INFO=()

for INFO in "${REQUIRED_INFO[@]}"; do
  # Verify each piece of info is preserved somewhere
  if [ -z "$(check if info is preserved)" ]; then
    MISSING_INFO+=("$INFO")
  else
    echo "  ✓ $INFO"
  fi
done

if [ ${#MISSING_INFO[@]} -gt 0 ]; then
  echo "❌ CRITICAL: Missing required recovery information:"
  printf '  - %s\n' "${MISSING_INFO[@]}"
  echo ""
  echo "🔴 COMPACTION BLOCKED until all info preserved"
  exit 1
else
  echo "✅ Recovery information complete - compaction can proceed safely"
fi

# MANDATORY: Verify files exist
if [ ! -f ".validation-artifacts/logs/compact-summary-"*.md ]; then
  echo "❌ CRITICAL: Compaction summary file not found"
  exit 1
fi

if [ "$ENV" = "LOCAL" ] && [ -n "$CURRENT_TASK_ID" ]; then
  # Verify task was updated
  TASK_UPDATED=$(verify task metadata contains pre_compact_summary)
  if [ -z "$TASK_UPDATED" ]; then
    echo "❌ CRITICAL: Task not updated with compaction context"
    exit 1
  fi
fi

echo "✅ All verification checks passed"
```

**ENFORCEMENT**: Cannot proceed with compaction if recovery info incomplete

---

## MANDATORY COMPLIANCE CHECKLIST

**PRE-COMPACTION REQUIREMENTS**:
- [ ] Active task context saved (if LOCAL + task active) ← 🔴 REQUIRED
- [ ] Technical discoveries stored ← 🔴 REQUIRED
- [ ] Error resolutions preserved ← 🔴 REQUIRED
- [ ] Comprehensive summary file created ← 🔴 REQUIRED
- [ ] Recovery information verified complete ← 🔴 REQUIRED
- [ ] All critical context preserved ← 🔴 REQUIRED

**CRITICAL ENFORCEMENT**: Cannot compact without preserving all critical context

---

## MANDATORY COMPLIANCE STATEMENT

**BY COMPLETING THIS HOOK, YOU AFFIRM**:
- ✅ ALL critical conversation context preserved
- ✅ Task metadata updated with compaction summary (if LOCAL)
- ✅ Technical insights and error resolutions stored
- ✅ Comprehensive summary file created
- ✅ Recovery information verified complete
- ✅ Next session can seamlessly continue from this point

**COMPACTION SAFE - NO CONTEXT WILL BE LOST**

**VIOLATION OF THIS HOOK = LOST CONTEXT = CANNOT RESUME WORK = CRITICAL FAILURE**

---

**END OF MANDATORY PreCompact HOOK**
