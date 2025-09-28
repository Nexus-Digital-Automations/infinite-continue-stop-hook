# USER CLARIFICATION: Stale Agent Timeout vs Cleanup Frequency

## Important Distinction Learned

User clarified that their request was about **cleanup frequency**, not **timeout aggressiveness**.

## Original User Request Analysis

**What user ACTUALLY wanted:**

- Keep 30-minute stale agent timeout (when agents are considered stale)
- Ensure cleanup runs EVERY TIME the stop hook is called (frequency)

**What I initially implemented (INCORRECTLY):**

- Reduced timeout from 30 minutes to 15 minutes (made timeout more aggressive)
- Added force cleanup with 10-minute threshold
- Misunderstood the core requirement

## Root Cause of Misunderstanding

I focused on making the **timeout more aggressive** instead of focusing on **cleanup frequency**.

The user's complaint was that agents were holding tasks too long because cleanup wasn't running frequently enough, NOT because the 30-minute threshold was too long.

## Correct Implementation Applied

### What Was Fixed:

1. **Restored 30-minute stale thresholds** across all cleanup functions
2. **Removed force cleanup section** with 10-minute threshold
3. **Kept every-stop-hook-call functionality** for regular cleanup
4. **Updated all messaging** to reflect 30-minute timeouts

### Key Changes Made:

- `staleAgentTimeout`: 900000ms → 1800000ms (15min → 30min)
- `staleTaskTimeout`: 900000ms → 1800000ms (15min → 30min)
- Removed separate force cleanup section entirely
- Updated reason messages: "15 minutes" → "30 minutes"
- Updated guidance: "Force cleanup (>10 min) + stale tasks (>15 min)" → "Stale tasks (>30 min) reset to pending on every stop hook call"

## Final Solution Achieved

✅ **Agents are considered stale after 30 minutes** (user's preference)
✅ **Cleanup runs EVERY stop hook call** (user's requirement)
✅ **No agent can hold tasks indefinitely** (user's concern addressed)

## Key Lesson for Future Development

### Listen for the Core Requirement:

- **Frequency vs Threshold**: Distinguish between "how often" vs "how aggressive"
- **User Complaint Analysis**: "agents holding tasks too long" could mean:
  - Timeout threshold too lenient (30min → 15min) ❌
  - Cleanup not running frequently enough (periodic → every call) ✅

### When User Says "Every Time":

- Implement exactly that: run cleanup every single time
- Don't assume they want shorter timeouts
- Focus on frequency, not aggressiveness

### Communication Pattern:

- When user clarifies with "no, I want X", implement X exactly
- Don't add additional "improvements" they didn't ask for
- User knows their system requirements better than I do

## Code Pattern Applied

```javascript
// CORRECT: Cleanup runs every stop hook call with 30-min threshold
const staleAgentTimeout = 1800000; // 30 minutes
// [cleanup logic runs every stop hook call]

// INCORRECT: Separate force cleanup with shorter threshold
const forceCleanupTimeout = 600000; // 10 minutes
const staleAgentTimeout = 900000; // 15 minutes
```

## Testing Validation

- Current behavior: Cleanup runs every stop hook call ✅
- Stale threshold: 30 minutes (1800000ms) ✅
- User requirement: "every stop hook call" ✅
- User preference: "30 minutes" ✅

## Prevention Strategy

1. **Clarify Requirements**: When implementing, ask "do you want frequency or threshold changes?"
2. **Implement Exactly What's Asked**: Don't add "improvements" unless requested
3. **Test Core Requirement**: Focus on the main complaint, not ancillary optimizations
4. **User-First Design**: User knows their needs better than I do

Date: 2025-09-20T02:11:34.663Z
Agent: dev_session_1758333669246_1_general_76c086cf
Task: error_1758334107846_6ok6a1nm67
Priority: USER CLARIFICATION
Status: RESOLVED
