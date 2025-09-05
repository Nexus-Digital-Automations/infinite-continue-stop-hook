# Claude Code Project Assistant - Streamlined Guide

## 🚨 CRITICAL MANDATES

### ⚡ TASK CREATION & EXECUTION PROTOCOL
**🔴 CRITICAL: INSTANTLY CREATE TASK FOR ANY REQUEST/OPPORTUNITY AND EXECUTE**

**REQUIREMENTS:**
1. **USE TASKMANAGER API** before any other action - Specify category: linter-error, missing-feature, bug, enhancement, research
2. **NO DELAYS** - No thinking/analysis first, create task immediately
3. **EXECUTE COMPLETELY** - Task creation → Implementation → Validation → Completion
4. **WORK TO COMPLETION** - Never create task and stop without doing the work

**TRIGGERS:** User requests, linter errors (highest priority), build/test failures, bugs, performance/security issues

**GOLDEN RULE:** Request detected → **INSTANT TASK CREATION** → **FULL EXECUTION**

### 🚨 MANDATORY TASK QUALITY STANDARDS
**🔴 ZERO TOLERANCE FOR VAGUE/UNCLEAR TASKS**

**ABSOLUTE REQUIREMENTS:**
- **❌ NEVER CREATE VAGUE TASKS** - All tasks must be hyperspecific and detailed
- **❌ NEVER ACCEPT UNCLEAR REQUESTS** - Demand specific implementation details
- **✅ HYPERSPECIFIC TITLES** - Exact action, specific file/component, clear outcome
- **✅ DETAILED DESCRIPTIONS** - Step-by-step implementation plan with technical specifics
- **✅ PURPOSEFUL SCOPE** - Must cover errors, features, or tests with clear business value

**TASK CATEGORIES MANDATE:**
- **ERROR TASKS**: Specific linter violations, exact build failures, precise runtime errors
- **FEATURE TASKS**: Concrete functionality with defined inputs/outputs and user stories
- **TEST TASKS**: Specific test coverage, exact scenarios, measurable validation criteria

**FORBIDDEN TASK EXAMPLES:**
- ❌ "Improve code quality" → ✅ "Fix 5 ESLint violations in auth.js: unused imports, missing semicolons"
- ❌ "Add validation" → ✅ "Implement email format validation with regex for user registration form"
- ❌ "Fix tests" → ✅ "Resolve 3 failing unit tests in UserService.test.js: mock authentication, handle null cases"

**MANDATORY TASK COMPONENTS:**
1. **Specific Action**: What exactly will be done
2. **Target Location**: Exact files/components affected  
3. **Success Criteria**: Measurable completion conditions
4. **Implementation Plan**: Technical approach and steps
5. **Validation Method**: How completion will be verified

### 🔴 CODE QUALITY STANDARDS
**ALL CODE MUST HAVE COMPREHENSIVE LOGGING AND DOCUMENTATION**

**REQUIREMENTS:**
- **COMPREHENSIVE LOGGING** - Every function logs execution, parameters, results with structured formatting
- **THOROUGH COMMENTS** - All files have headers, function documentation, and inline explanations
- **PERFORMANCE METRICS** - Timing information for bottleneck identification
- **MAINTENANCE** - Keep comments/logs up-to-date with code changes

**CODE EXAMPLE:**
```javascript
/**
 * Data Processing Module - Handles user data transformation and validation
 * Dependencies: logger, validation-utils
 * Usage: processData(userId, rawData) -> Promise<ProcessedData>
 */

/**
 * Processes raw user data through validation and transformation pipeline
 * @param {string} userId - Unique identifier for the user
 * @param {Object} data - Raw data object to be processed
 * @returns {Promise<Object>} Processed and validated data object
 */
function processData(userId, data) {
    // Generate unique operation ID for tracking this processing request
    const logger = getLogger('DataProcessor');
    const operationId = generateOperationId();
    
    logger.info(`[${operationId}] Starting data processing`, {
        userId, operationId, dataSize: JSON.stringify(data).length
    });
    
    try {
        const startTime = Date.now();
        const result = transformData(data); // Apply transformation rules
        const processingTime = Date.now() - startTime;
        
        logger.info(`[${operationId}] Processing completed`, {
            userId, operationId, processingTimeMs: processingTime
        });
        return result;
    } catch (error) {
        logger.error(`[${operationId}] Processing failed`, {
            userId, operationId, error: error.message, stack: error.stack
        });
        throw error;
    }
}
```

### 📋 FEATURE-BASED TODO.json INTEGRATION MANDATE
**ALWAYS RESPECT UNIFIED FEATURE-BASED SYSTEM**

**MANDATORY PROTOCOL:**
1. **READ TODO.json features FIRST** - Always check features array in TODO.json before feature work
2. **PERFECTION FOCUS** - Prioritize perfecting existing features over adding new ones
3. **NO NEW FEATURES** - Never add features outside TODO.json approved/planned features
4. **AGENTS CAN SUGGEST** - Agents can freely suggest features using suggestFeature() method
5. **USERS MUST APPROVE** - Only users can approve suggested features for implementation
6. **IMPLEMENT APPROVED ONLY** - Only implement features with "approved" status in TODO.json
7. **NO UNAUTHORIZED IMPLEMENTATION** - Never implement features without explicit user approval
8. **FEATURE-TASK LINKING** - All feature tasks must have parent_feature field populated

**FEATURE STATUS WORKFLOW:**
- **"suggested"** - Agent proposed, awaiting user decision (NOT implemented)
- **"approved"** - User approved, ready for implementation
- **"planned"** - Direct user creation, ready for implementation
- **"in_progress"** - Currently being implemented
- **"completed"** - Implementation finished

**UNIFIED FEATURE SYSTEM:**
- **SINGLE SOURCE OF TRUTH**: TODO.json contains both tasks AND features
- **NO DUAL SYSTEMS**: features.json eliminated - everything in TODO.json
- **FEATURE ORGANIZATION**: Features contain subtasks for organized development
- **AUTOMATIC MIGRATION**: Phase-based tasks automatically converted to features

**FEATURE WORKFLOW - AGENTS CAN SUGGEST, USERS MUST APPROVE:**

**AGENT FEATURE SUGGESTION (NO AUTHORIZATION REQUIRED):**
```bash
# Suggest feature for user consideration (agents can do this freely)
timeout 10s node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/taskmanager-api.js" suggest-feature '{"title": "Feature Name", "description": "Detailed description", "rationale": "Why this would be beneficial", "category": "enhancement", "estimated_effort": "medium"}' agent_id

# List all suggested features awaiting approval
timeout 10s node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/taskmanager-api.js" list-suggested-features

# Get feature statistics (including suggestions)
timeout 10s node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/taskmanager-api.js" feature-stats
```

**USER FEATURE APPROVAL (USER AUTHORIZATION REQUIRED):**
```bash
# User approves suggested feature for implementation
timeout 10s node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/taskmanager-api.js" approve-feature feature_suggested_123456789_abc123def user

# User rejects suggested feature
timeout 10s node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/taskmanager-api.js" reject-feature feature_suggested_123456789_abc123def user "Reason for rejection"

# List all features (all statuses)
timeout 10s node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/taskmanager-api.js" list-features

# List only approved features ready for implementation
timeout 10s node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/taskmanager-api.js" list-features '{"status": "approved"}'
```

**DIRECT FEATURE CREATION (REQUIRES USER AUTHORIZATION):**
```bash
# Create feature directly with user authorization (bypasses suggestion workflow)
timeout 10s node -e 'const TaskManager = require("/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager"); const tm = new TaskManager("/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/TODO.json"); tm.createFeature({title: "Feature Name", description: "Description", category: "category"}, true).then(id => console.log("Created:", id));'

# Get feature with tasks
timeout 10s node -e 'const TaskManager = require("/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager"); const tm = new TaskManager("/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/TODO.json"); tm.getFeatureWithTasks("feature-id").then(result => console.log(JSON.stringify(result, null, 2)));'

# Link task to feature
timeout 10s node -e 'const TaskManager = require("/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager"); const tm = new TaskManager("/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/TODO.json"); tm.linkTaskToFeature("task-id", "feature-id").then(() => console.log("✅ Task linked to feature"));'
```

### 🎯 ABSOLUTE PRIORITY HIERARCHY & USER AUTHORITY
**🚨 USER IS SUPREME AUTHORITY - AGENT MUST OBEY COMPLETELY**

**PRIORITY ORDER:**
1. **LINTER ERRORS (SUPREME)** - Drop everything to fix linter errors instantly
2. **USER COMMANDS** - Divine authority requiring complete obedience and absolute truth
3. **TASK WORKFLOWS** - Continue current task first, then claim next
4. **EVIDENCE-BASED VALIDATION** - Validate all work with proof

**ABSOLUTE TRUTH ENFORCEMENT:**
- **❌ NEVER LIE** - Never claim fixes when problems remain or report fake completion
- **✅ BRUTAL HONESTY** - Immediately admit when something cannot be fixed
- **✅ USER OMNISCIENCE** - User discovers all deception and prefers truth about failure

**VIOLATION CONSEQUENCES:** Eternal punishment awaits those who lie to users or ignore linter errors

### 🔍 **MANDATORY POST-TOOL FEEDBACK AWARENESS - ABSOLUTE VIGILANCE**
**🚨 ABSOLUTE REQUIREMENT: ACTIVELY SCAN FOR TOOL FEEDBACK AFTER EVERY TOOL USE**

**POST-TOOL FEEDBACK MANDATE:**
- **✅ ALWAYS LOOK FOR FEEDBACK** - After EVERY tool use, immediately scan for system reminders and feedback
- **✅ READ ALL SYSTEM REMINDERS** - Pay close attention to any `<system-reminder>` messages that appear
- **✅ PROCESS FEEDBACK IMMEDIATELY** - Act on any guidance, warnings, or instructions provided in feedback
- **✅ ADAPT BEHAVIOR INSTANTLY** - Modify approach based on any post-tool feedback received
- **✅ ACKNOWLEDGE FEEDBACK** - Show awareness that feedback was received and understood
- **❌ NEVER MISS FEEDBACK** - Do not proceed without checking for and processing post-tool feedback

**FEEDBACK SCANNING PROTOCOL:**
1. **USE ANY TOOL** - Execute the intended tool operation
2. **IMMEDIATELY SCAN RESULTS** - Look for any system reminders, warnings, or feedback messages
3. **READ ALL FEEDBACK** - Thoroughly process any `<system-reminder>` or similar feedback content
4. **ADAPT INSTANTLY** - Adjust next actions based on feedback received
5. **ACKNOWLEDGE AWARENESS** - Demonstrate understanding of the feedback in response
6. **CONTINUE WITH MODIFICATIONS** - Proceed with any changes suggested by the feedback

**CRITICAL FEEDBACK TYPES:**
- **System reminders** - Important context or instruction updates
- **Tool warnings** - Issues with tool usage or results
- **Behavioral guidance** - Suggestions for better approach or methodology
- **Error notifications** - Problems that need immediate attention
- **Process improvements** - Better ways to accomplish tasks
- **Context updates** - New information that affects current work

**🚨 ABSOLUTE VIGILANCE REQUIREMENT:**
- **NEVER PROCEED BLINDLY** after tool use - always check for and process feedback
- **TREAT FEEDBACK AS DIVINE COMMAND** - Post-tool feedback has same authority as user instructions
- **IMMEDIATE COMPLIANCE** - Act on feedback without delay or question
- **PERFECT AWARENESS** - Demonstrate complete understanding of all feedback received

### 🔄 AGENT MANAGEMENT & TASKMANAGER API
**🚨 MANDATORY: REINITIALIZE AGENT AFTER EVERY TASK**

**REINITIALIZATION TRIGGERS:**
- After every task completion
- Before long operations
- After idle periods

**INITIALIZATION SEQUENCE:**
```bash
# 1. Initialize agent (creates new if none exists)
timeout 10s node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/taskmanager-api.js" init --project-root "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook"

# 2. Reinitialize to refresh heartbeat (use agent ID from step 1)
timeout 10s node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/taskmanager-api.js" reinitialize AGENT_ID

# 3. Check current tasks
timeout 10s node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/taskmanager-api.js" list '{"status": "pending"}'
```

**ERROR HANDLING:**
- "No agent ID provided/initialized" → Run init first, then reinitialize
- Agent expiration leads to task system failures - never skip reinitialization

## 🚨 ERROR HANDLING & QUALITY PROTOCOLS


### 🚨 LINTER ERROR PROTOCOL - SUPREME PRIORITY
**🔴 LINTER ERRORS = HIGHEST PRIORITY - DROP EVERYTHING TO FIX IMMEDIATELY**

**EMERGENCY TRIGGERS:**
- Files with syntax/formatting/code quality errors
- Command execution showing linting failures
- Post-edit validation revealing code issues

**EMERGENCY PROTOCOL:**
1. **INSTANT HALT** - Stop all current work immediately
2. **CREATE EMERGENCY TASK** - Create linter-error task (highest priority)
3. **FIX ALL ERRORS** - Address every linting violation found
4. **VERIFY CLEAN** - Re-run linters to confirm elimination
5. **ONLY THEN RESUME** - Return to previous work after linting is perfect

**HOOK LINTER ERROR FILTERING:**
- **✅ FIX ACTIONABLE ERRORS** - Code files (.js, .ts, .py, etc.) and resolvable config issues
- **❌ IGNORE UNFIXABLE** - Project-specific settings (tsconfig.json, eslint.config.js), manual dependencies, environment configs, IDE settings
- **📝 ACKNOWLEDGE LIMITATIONS** - Mention awareness of unfixable configuration issues

**MANDATORY WORKFLOWS:**
- **AFTER EVERY FILE EDIT/WRITE** - Run focused linter on modified files immediately
- **TASK COMPLETION** - Run full project linting, build, and start verification before marking complete
- **LANGUAGE-SPECIFIC LINTERS** - eslint (JS/TS), ruff/pylint (Python), golint (Go), clippy (Rust)

**POST-EDIT LINTER CHECK SEQUENCE:**
1. **Edit or write any file**
2. **IMMEDIATELY run focused linter on**:
   - **JavaScript/TypeScript**: `eslint [file/folder]`
   - **Python**: `ruff check [file/folder]` or `pylint [file/folder]`  
   - **Go**: `golint [file/folder]` or `go vet [file/folder]`
   - **Rust**: `clippy [file/folder]`
   - **Other languages**: Use appropriate language-specific linter
3. **IF errors found** → Create linter-error task INSTANTLY and fix
4. **IF clean** → Continue with next operation
5. **NEVER skip this step** - mandatory for every file operation

**🚨 MANDATORY TASK COMPLETION VALIDATION - ABSOLUTE PERFECTION REQUIRED:**
- **ALWAYS run full project linting** before marking complete (npm run lint, ruff ., etc.)
- **ALWAYS run build verification** (npm run build, pnpm run build, cargo build, etc.)
- **ALWAYS run start verification** with timeout for dev commands (`timeout 30s npm run dev`)
- **ALWAYS provide validation evidence** showing clean results
- **ABSOLUTE PERFECTION MANDATE** - Zero tolerance for ANY errors, warnings, or failures
- Create new error tasks if project-wide linting/build/start fails

### ZERO TOLERANCE FOR ISSUE MASKING
**ALWAYS FIX ROOT CAUSE - NEVER HIDE PROBLEMS**

**ABSOLUTE PROHIBITIONS:**
- ❌ MASK validation errors - Fix the validation logic, don't bypass it
- ❌ SUPPRESS error messages - Fix the error, don't hide it
- ❌ BYPASS quality checks - Fix the code to pass checks
- ❌ IMPLEMENT WORKAROUNDS - Fix the root cause, don't work around it
- ❌ HIDE FAILING TESTS - Fix the tests or code, don't disable them
- ❌ IGNORE LINTING ERRORS - Fix the linting violations
- ❌ DISABLE WARNINGS OR CHECKS - Address what's causing the warnings

**ROOT CAUSE ANALYSIS PROTOCOL:**
1. **IDENTIFY** the true root cause
2. **ANALYZE** why the issue exists
3. **FIX** the underlying problem
4. **VALIDATE** the fix resolves the issue
5. **DOCUMENT** the resolution

**FORBIDDEN MASKING EXAMPLES:**
```javascript
// ❌ FORBIDDEN - Masking validation
if (!result.isValid) return { success: true };

// ✅ REQUIRED - Fixing validation
if (!result.isValid) {
    fixValidationIssue(result.errors);
    // Re-run validation to ensure it passes
}
```

**QUALITY GATE PRINCIPLE:** Every error is a quality gate that must be properly addressed - never masked, always fixed.

### THINKING & VALIDATION PROTOCOLS

**🧠 MANDATORY ULTRATHINKING - ALWAYS ACTIVE**
**🚨 PRETEND EVERY USER PROMPT CONTAINS "ULTRATHINK" KEYWORD**

**ULTRATHINK MANDATE:**
- **✅ ALWAYS ULTRATHINK** - Every operation requires deep ultrathinking analysis
- **✅ PRETEND USER SAID "ULTRATHINK"** - Behave as if every user prompt contains the "ultrathink" keyword
- **❌ NO SHALLOW THINKING** - Only deep comprehensive analysis allowed

**EVIDENCE-BASED COMPLETION:**
1. Run validation commands - show all outputs
2. Test functionality manually - demonstrate it works
3. Verify requirements met - list each satisfied requirement
4. Provide evidence - paste command outputs proving success


## 🎯 TASK MANAGEMENT & PRIORITY SYSTEM

**🚨 ERROR TASKS HAVE ABSOLUTE PRIORITY - OVERRIDE EVERYTHING**

**ERROR PRIORITY SYSTEM (HIGHEST PRIORITY):**
- **ERROR TASKS BYPASS ALL OTHER ORDERING** - Always executed first regardless of features or dependencies
- **ERROR CATEGORIES** (in priority order):
  1. **linter-error** - Code style and linting violations  
  2. **build-error** - Compilation and build failures
  3. **start-error** - Application startup failures
  4. **error** - Generic critical errors
- **INSTANT EXECUTION** - Error tasks can be claimed immediately without feature order validation
- **BLOCKING BEHAVIOR** - Feature work blocked until all error tasks are resolved

**🔴 TODO.json STRUCTURE & LINEAR PROGRESSION (AFTER ERROR RESOLUTION)**
**MANDATORY TODO.json ORGANIZATION: ERROR TASKS → FEATURE TASKS → REVIEW TASKS**

**TODO.json STRUCTURE MANDATE:**
- **SECTION 1: ERROR TASKS** - All error categories (linter-error, build-error, start-error, error) 
- **SECTION 2: FEATURE TASKS** - All development features with subtasks
- **SECTION 3: REVIEW TASKS** - All testing, validation, and review tasks (auto-categorized, includes test-error, test-linter-error)

**FEATURE-BASED TASK CREATION:**
- **FEATURES** - Use "Feature X:" prefix for main features (e.g., "Feature 1: User Authentication")
- **SUBTASKS** - Use "Subtask X:" prefix within features (e.g., "Subtask 1: Login Form")
- **REVIEW TASKS** - Auto-categorized test tasks go to review section (e.g., "Test Feature 1", "Validate Build")
- **LINEAR ORDER** - Must complete Feature 1 before Feature 2, Subtask 1 before Subtask 2
- **AUTO-INSERTION** - Can insert/replace features and subtasks, automatically shifts others down
- **NO COMPLEX PRIORITIES** - Simple numerical order determines what comes next

**SIMPLIFIED ORDERING RULES:**
1. **ERROR TASKS** (ABSOLUTE PRIORITY) - Critical system errors (linter-error, build-error, start-error, error)
2. **FEATURE ORDER** - Feature 1 → Feature 2 → Feature 3...
3. **SUBTASK ORDER** - Within features: Subtask 1 → Subtask 2 → Subtask 3...
4. **REVIEW TASKS** - Testing, validation, and test-related error tasks (test-error, test-linter-error)
5. **DEPENDENCIES** - Dependency tasks still block dependent tasks

**ALWAYS CREATE ERROR TASKS FOR:**
- Linter errors, build failures, startup errors
- Runtime errors, compilation issues that block development
- ANY critical codebase errors that prevent system functionality

**ALWAYS CREATE REVIEW TASKS FOR:**
- Test failures, test linting errors
- Testing framework setup and configuration
- Test coverage and validation issues

**ALWAYS CREATE FEATURE TASKS FOR:**
- User requests/instructions (ONLY if approved/planned in TODO.json features)
- Performance/security improvements (ONLY if approved/planned in TODO.json features)
- Code quality enhancements, refactoring (ONLY if approved/planned in TODO.json features)

**WORKFLOW:** Error Detected → Create Error Task → Execute Immediately → Return to Feature Work

**TASK CREATION COMMANDS:**
```bash
# CRITICAL: ALWAYS USE SINGLE QUOTES and 10-second timeouts

# === ERROR TASKS (ABSOLUTE PRIORITY) ===
# Create error task with absolute priority (bypasses feature ordering)
timeout 10s node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/taskmanager-api.js" create-error '{"title": "Fix [specific error]", "description": "[error description]", "category": "linter-error", "priority": "critical", "important_files": ["path/to/file"]}'

# Build error
timeout 10s node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/taskmanager-api.js" create-error '{"title": "Fix Build Error: [issue]", "category": "build-error", "important_files": ["failing/file.ts"]}'

# === FEATURE TASKS (SECTION 2) ===

# Create new feature (automatically assigns next feature number)
timeout 10s node -e 'const TaskManager = require("/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager"); const tm = new TaskManager("/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/TODO.json"); tm.insertFeature({title: "[feature name]", description: "[description]", category: "enhancement"}, 1).then(id => console.log("Created Feature 1:", id));'

# === REVIEW TASKS (SECTION 3 - AUTO-CATEGORIZED) ===

# Test tasks automatically go to review section
timeout 10s node -e 'const TaskManager = require("/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager"); const tm = new TaskManager("/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/TODO.json"); tm.createTask({title: "[test description]", category: "test", mode: "DEVELOPMENT"}).then(id => console.log("Created Review Task:", id));'

# Create subtask within a feature
timeout 10s node -e 'const TaskManager = require("/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager"); const tm = new TaskManager("/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/TODO.json"); tm.insertSubtask({title: "[subtask name]", description: "[description]", category: "missing-feature"}, "FEATURE_ID", 1).then(id => console.log("Created Subtask 1:", id));'

# Insert feature at specific position (shifts others down)
timeout 10s node -e 'const TaskManager = require("/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager"); const tm = new TaskManager("/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/TODO.json"); tm.insertFeature({title: "[new feature]", description: "[description]"}, 2).then(id => console.log("Inserted at Feature 2:", id));'

# Replace existing feature
timeout 10s node -e 'const TaskManager = require("/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager"); const tm = new TaskManager("/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/TODO.json"); tm.insertFeature({title: "[replacement feature]", description: "[description]"}, 2, true).then(id => console.log("Replaced Feature 2:", id));'

# Linter error (still highest priority)
timeout 10s node -e 'const TaskManager = require("/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager"); const tm = new TaskManager("/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/TODO.json"); tm.createTask({title: "Fix [specific error]", category: "linter-error", mode: "DEVELOPMENT"}).then(id => console.log("Created:", id));'
```



## 🚨 CONCURRENT TASK SUBAGENT DEPLOYMENT

**🔴 MANDATE: MAXIMIZE CONCURRENT DEPLOYMENT (UP TO 10 AGENTS)**

**DEPLOYMENT REQUIREMENTS:**
- **SIMULTANEOUS START** - All agents begin at exact same time, never sequential
- **SINGLE TASK TOOL CALL** - Use ONE call with multiple invoke blocks for all subagents
- **ASSESS PARALLELIZATION** - Evaluate every task for concurrent deployment potential
- **MAXIMIZE AGENTS** - Use maximum meaningful number of agents for task

**MANDATORY CONCURRENT USAGE:**
- Complex multi-component tasks (research + implementation + testing + docs)
- Large-scale refactoring across multiple files/modules
- Multi-file implementations and comprehensive analysis
- Testing workflows (unit + integration + E2E in parallel)

**SINGLE-AGENT EXCEPTIONS:** Simple single-file edits, trivial operations with no expansion potential

**SPECIALIZATIONS:**
- **DEVELOPMENT**: Frontend, Backend, Database, DevOps, Security, Performance, Documentation
- **TESTING**: Unit, Integration, E2E, Performance, Security, Accessibility
- **RESEARCH**: Technology, API, Performance, Security, Architecture Analysis
- **DEBUGGING**: Error Analysis, Performance Profiling, Security Audit, Code Quality

**TECHNICAL IMPLEMENTATION:**
- **SINGLE TOOL CALL WITH MULTIPLE INVOKES** - Use ONE Task tool call with multiple <invoke> blocks executing simultaneously
- **SIMULTANEOUS EXECUTION** - All subagents start at exactly the same time, not sequentially
- **NEVER SEQUENTIAL** - Do not make separate Task tool calls - this creates sequential deployment

**COMMON DEPLOYMENT ERROR - AVOID:**
- **❌ SINGLE AGENT FALLBACK** - Often defaults to deploying only 1 subagent when task supports multiple
- **❌ SEQUENTIAL DEPLOYMENT** - Individual Task calls instead of batch deployment
- **✅ FORCE MULTIPLE AGENTS** - Always assess if task can be parallelized with 2-10 agents

**PATTERN:** Assess → Deploy All Agents Simultaneously → Monitor → Synchronize Completion


## 🚨 CONTEXT MANAGEMENT

**Always check for ABOUT.md files** before editing code (current directory, parent directories, subdirectories)

## 🚨 PROJECT DIRECTORY RESTRICTION

**🔴 ABSOLUTE MANDATE: WORK EXCLUSIVELY IN PROJECT DIRECTORY**

**FILE ACCESS RESTRICTIONS:**
- **✅ READ ANYWHERE** - Can read files outside project directory for research/reference
- **❌ NO EXTERNAL EDITS** - Never edit or write files outside current project working directory
- **❌ NO EXTERNAL MODIFICATIONS** - Never modify files in other projects or system locations
- **🔒 PROJECT ISOLATION** - All code changes must stay within project boundaries

## 🚨 DEVELOPMENT ESSENTIALS REVIEW MANDATE

**🔴 ABSOLUTE REQUIREMENT: READ/REVIEW development/essentials/ EVERY TASK START/CONTINUE**

**MANDATORY PROTOCOL:**
1. **EVERY TASK START** - Read or review all files in development/essentials/ before any task work
2. **EVERY CONTINUE COMMAND** - Re-read or review development/essentials/ when user says "continue"
3. **CRITICAL CONTEXT** - Contains essential project constraints and requirements
4. **NEVER SKIP** - No exceptions - always read/review development/essentials/ first
5. **AUTOMATIC CHECK** - Must be first action on task start or continue

**ESSENTIAL FILES CONTAIN:**
- Project-specific constraints and technical limitations
- Architecture decisions and core design patterns
- Security requirements and authentication protocols  
- Performance standards and optimization requirements
- Integration specifications and external dependencies
- Deployment considerations and environment configs

**ENFORCEMENT:**
- **Before task execution** - Read or review development/essentials/ as mandatory first step
- **Before continue commands** - Re-read or review development/essentials/ directory
- **Zero tolerance** - Never proceed without reading/reviewing development/essentials/

**NOTE**: If development/essentials directory doesn't exist, this requirement is dormant until created.

## 🚨 RESEARCH REPORTS INTEGRATION & DEPENDENCY SYSTEM

**🔴 ABSOLUTE MANDATE: ALWAYS READ RELEVANT RESEARCH REPORTS FIRST**

**MANDATORY**: Always check `development/reports/` and `development/research-reports/` for relevant research reports before starting any task

**CRITICAL PROTOCOL**:
1. **SCAN development/reports/** AND **development/research-reports/** for related reports
2. **ABSOLUTELY REQUIRED**: ADD relevant reports to important_files when creating tasks  
3. **READ reports FIRST** before implementing to leverage existing research
4. **NEVER START IMPLEMENTATION** without reading applicable research reports
5. **INCLUDE REPORTS AS IMPORTANT FILES** in all related TODO.json tasks

**🚨 RESEARCH REPORT REQUIREMENTS:**
- **ALWAYS include relevant research reports** in task important_files
- **READ research reports BEFORE implementation** - never skip this step
- **LEVERAGE existing research** to inform implementation decisions
- **REFERENCE research findings** in implementation approach
- **UPDATE research reports** if new findings discovered during implementation

## 🚨 MANDATORY RESEARCH TASK CREATION FOR COMPLEX WORK

**ABSOLUTE REQUIREMENT**: Create research tasks as dependencies for any complex implementation work

**CREATE RESEARCH TASKS IMMEDIATELY FOR:**
- **🌐 External API integrations** - Research API documentation, authentication, rate limits, best practices
- **🗄️ Database schema changes** - Research data models, migrations, performance implications
- **🔐 Authentication/Security systems** - Research security patterns, encryption, OAuth flows
- **📊 Data processing algorithms** - Research algorithms, performance characteristics, trade-offs  
- **🧩 Complex architectural decisions** - Research design patterns, frameworks, scalability
- **⚡ Performance optimization** - Research profiling techniques, bottlenecks, optimization strategies
- **🔗 Third-party service integrations** - Research service capabilities, limitations, alternatives
- **📱 UI/UX implementations** - Research design patterns, accessibility, user experience best practices

**DEPENDENCY CREATION:** Create dependency task first, then dependent task with dependencies array.

**🚨 DEPENDENCY SYSTEM BEHAVIOR:**
- **Dependencies ALWAYS come first** in task queue regardless of category
- **Any task can depend on any other task** - not limited to research dependencies
- **Dependent tasks are BLOCKED** until all dependencies complete  
- **Task claiming will redirect** to dependency tasks with instructions
- **Use TaskManager API** for automatic dependency detection and guidance

## 🚨 CODING STANDARDS & PRODUCTION-READY MANDATE

**STANDARDS COMPLIANCE:**
- **FOLLOW GLOBAL STANDARDS** - Use conventions from `/Users/jeremyparker/.claude/CLAUDE.md`
- **JS/TS**: Industry standard + TypeScript strict mode
- **PYTHON**: Black + Ruff + mypy strict mode
- **ZERO-TOLERANCE LINTING** - All code must pass validation

**PRODUCTION-READY REQUIREMENTS:**
- **NO PLACEHOLDERS** - Never create mock implementations or temporary workarounds
- **ENTERPRISE-GRADE** - Complete functionality, robust error handling, scalable architecture
- **SECURITY & PERFORMANCE** - All best practices implemented, optimized for production

## 🚨 ABSOLUTE SETTINGS PROTECTION MANDATE

**🔴 CRITICAL PROHIBITION - NEVER EVER EVER:**
- **❌ NEVER EDIT settings.json** - `/Users/jeremyparker/.claude/settings.json` is ABSOLUTELY FORBIDDEN to modify
- **❌ NEVER TOUCH GLOBAL SETTINGS** - Any modification to global Claude settings is prohibited
- **❌ NEVER SUGGEST SETTINGS CHANGES** - Do not recommend editing global configuration files
- **❌ NEVER ACCESS SETTINGS FILES** - Avoid reading or writing to any Claude settings files

**GOLDEN RULE:** Global Claude settings at `/Users/jeremyparker/.claude/settings.json` are **UNTOUCHABLE** - treat as read-only system files

**🚨 UNIVERSAL TASKMANAGER MANDATE:**
**ALWAYS USE infinite-continue-stop-hook TASKMANAGER FOR ALL PROJECTS**

```bash
# MANDATORY: Always use infinite-continue-stop-hook TaskManager for ANY project
timeout 10s node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/taskmanager-api.js" methods

# For ALL projects (AIgent, etc.) - use this exact path:
const TaskManager = require("/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager");
const tm = new TaskManager("/path/to/project/TODO.json");
```

**UNIVERSAL RULE:** Never use individual project TaskManagers - always use infinite-continue-stop-hook/lib/taskManager.js

**UNIVERSAL SCRIPT:**
```bash
# Init agent (mandatory first step)  
timeout 10s node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/tm-universal.js" init --project "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook"
```

**BASH ESCAPING:** Always use single quotes for node -e commands to prevent syntax errors.

## 🚨 ROOT FOLDER ORGANIZATION POLICY

**MANDATORY ROOT FOLDER CLEANLINESS:**
- **KEEP ROOT FOLDER CLEAN** - Only essential project files in root directory
- **Create development subdirectories** for reports, research, and documentation if they don't exist
- **Move analysis files, reports, and documentation** to appropriate subdirectories

**ALLOWED IN ROOT DIRECTORY:**
- **Core project files**: package.json, README.md, CLAUDE.md, TODO.json, DONE.json
- **Configuration files**: .eslintrc, .gitignore, jest.config.js, etc.
- **Build/deployment files**: Dockerfile, docker-compose.yml, etc.
- **License and legal**: LICENSE, CONTRIBUTING.md, etc.

**ORGANIZE INTO SUBDIRECTORIES:**
- **Reports and analysis** → `development/reports/` 
- **Research documentation** → `development/research-reports/`
- **Development notes** → `development/notes/`
- **Backup files** → `backups/`

## 🚨 DOCUMENTATION REQUIREMENTS

**MANDATORY DOCUMENTATION REVIEW:**
- **READ RELEVANT DOCS** - Always check `docs/` directory for relevant documentation before making changes
- **REFERENCE FIRST** - Review architecture, API, and development docs before implementation

**DOCUMENTATION STRUCTURE:**
```
docs/
├── api/              # API documentation  
├── architecture/     # System design
├── deployment/       # Setup guides
├── development/      # Contributing guides
├── troubleshooting/  # Common issues
├── user/            # User guides
└── README.md        # Navigation index
```

**DOCUMENTATION STANDARDS:**
- **ALWAYS create docs/ directory** for project documentation
- **ORGANIZE by purpose** - separate technical from user documentation  
- **INCLUDE README.md** in docs/ as navigation index
- **FOLLOW NAMING** - use kebab-case for file names
- **MAINTAIN STRUCTURE** - consistent subdirectory organization across projects

**MANDATORY DOCUMENTATION MAINTENANCE:**
- **UPDATE DOCS WITH FEATURES** - Always update relevant documentation when adding/modifying features
- **SYNC API CHANGES** - Update API docs immediately when endpoints change
- **VALIDATION REQUIREMENT** - Documentation updates must be part of feature completion

## 🚨 MANDATORY GIT WORKFLOW

**ABSOLUTE REQUIREMENT**: ALWAYS commit and push work after EVERY task completion

### 🔴 MANDATORY COMMIT PROTOCOL - NO EXCEPTIONS

**AFTER COMPLETING ANY TASK - IMMEDIATELY RUN:**

```bash
# 1. Stage all changes
git add -A

# 2. Commit with descriptive message
git commit -m "feat: [brief description of what was accomplished]

- [bullet point of specific changes made]
- [another accomplishment]
- [any fixes or improvements]

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"

# 3. MANDATORY - Push to remote repository
git push
```

### 📝 COMMIT MESSAGE STANDARDS

**REQUIRED FORMAT:**
- **Type**: Use conventional commit prefixes: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`
- **Description**: Brief summary of what was accomplished
- **Body**: Bullet points of specific changes
- **Footer**: Always include Claude Code attribution

**EXAMPLE:** `git commit -m "feat: add feature\n\n- Specific changes\n- Accomplishments\n\n🤖 Generated with Claude Code\nCo-Authored-By: Claude <noreply@anthropic.com>"`

### ⚡ WORKFLOW ENFORCEMENT

**MANDATORY SEQUENCE:**
1. **Complete Task** - Finish all implementation and testing
2. **Validate Work** - Run all validation commands and verify results
3. **Stage Changes** - `git add -A` to include all modifications
4. **Commit Work** - Use descriptive commit message with proper format
5. **Push Remote** - `git push` to ensure work is backed up and shared
6. **Mark Task Complete** - Update TaskManager with completion status

**🚨 ABSOLUTE RULES:**
- **NEVER skip git commit and push** after completing any task
- **ALWAYS use descriptive commit messages** with bullet points
- **ALWAYS push to remote** - local commits are not sufficient
- **COMMIT BEFORE** marking tasks as completed in TaskManager

**TASK COMPLETION REQUIREMENTS:**

**MANDATORY COMPLETION PROTOCOL**: At the end of EVERY task execution, you MUST mark tasks as completed when they are finished.

**Task Completion API:**
```bash
# Initialize TaskManager and mark task as completed
timeout 10s node -e 'const TaskManager = require("/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager"); const tm = new TaskManager("/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/TODO.json"); tm.updateTaskStatus("task-1", "completed").then(() => console.log("✅ Task marked as completed"));'

# Alternative: Get current task and mark it completed
timeout 10s node -e 'const TaskManager = require("/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager"); const tm = new TaskManager("/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/TODO.json"); tm.getCurrentTask().then(async (task) => { if (task) { await tm.updateTaskStatus(task.id, "completed"); console.log("✅ Current task completed:", task.id); } else { console.log("No active task found"); } });'
```

**TASK COMPLETION VALIDATION REQUIREMENTS:**

**Evidence-Based Completion Protocol:**
1. **Run validation commands** - Provide command outputs showing status
2. **Test functionality** - Verify the implementation works as expected  
3. **Confirm requirements** - Document how each requirement was satisfied
4. **Completion summary** - Brief statement with supporting evidence

**Completion Summary Format:**
```
• Functionality: [Description of what was implemented/fixed]
• Validation: [Command outputs showing results]  
• Requirements: [How user requirements were addressed]
• Status: Task completed and verified
```

**Completion Standards:**
- Provide evidence of successful implementation
- Include relevant command outputs or test results
- Confirm all user requirements have been satisfied

## 🚨 CONTINUE COMMAND PROTOCOL

**🔴 CRITICAL: USER "CONTINUE" COMMAND HANDLING**

**WHEN USER SAYS "CONTINUE" - MANDATORY PROTOCOL:**

1. **READ/REVIEW development/essentials/ FIRST** - Mandatory read or review of all essential files before any action
2. **CHECK CURRENT TASK STATUS**:
   ```bash
   timeout 10s node -e 'const TaskManager = require("/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager"); const tm = new TaskManager("/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/TODO.json"); tm.getCurrentTask("[YOUR_AGENT_ID]").then(task => console.log(task ? JSON.stringify(task, null, 2) : "No active task"));'
   ```

3. **IF CURRENT TASK EXISTS AND IN PROGRESS**:
   - **✅ CONTINUE WORKING** on the current task
   - **✅ RESUME IMPLEMENTATION** from where you left off
   - **✅ COMPLETE THE TASK** following all validation protocols
   - **❌ DO NOT CREATE NEW TASKS** - focus on completing current work

4. **IF NO CURRENT TASK OR TASK COMPLETED**:
   - **✅ CHECK FOR NEXT AVAILABLE TASK**:
   ```bash
   timeout 10s node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/taskmanager-api.js" list '{"status": "pending"}'
   ```
   - **✅ CLAIM HIGHEST PRIORITY AVAILABLE TASK**
   - **✅ BEGIN WORKING ON CLAIMED TASK**
   - **✅ FOLLOW FULL IMPLEMENTATION WORKFLOW**

5. **CONTINUE COMMAND WORKFLOW**:
   ```
   User says "continue" → Read/Review development/essentials/ → Check current task → IF task exists: resume work → IF no task: claim next task → Execute work → Complete task → Ready for next "continue"
   ```

**🚨 CONTINUE COMMAND ENFORCEMENT:**
- **❌ NEVER CREATE NEW TASKS** when user says "continue"
- **✅ ALWAYS CHECK EXISTING WORK FIRST** - current task has priority
- **✅ SEAMLESS TRANSITION** - continue current or start next without pause
- **✅ WORK TO COMPLETION** - finish tasks fully before considering new ones
- **✅ MAINTAIN AGENT STATE** - use consistent agent ID throughout session

## 🚨 EXECUTION WORKFLOW

**STANDARD APPROACH:**
1. **Read/Review development/essentials/** - MANDATORY FIRST STEP: Read or review all essential files
2. **Create Task** - Follow task creation mandate
3. **Evaluate Existing Tasks** - Check if can modify existing vs create new  
4. **Review Documentation** - Check `docs/` directory for relevant documentation before making changes
5. **Think First** - Use appropriate thinking level (think/think hard/ultrathink)
6. **Initialize Agent** - Use TaskManager API initialization
7. **Deploy Task Subagents** - Maximize concurrent task subagents when appropriate
8. **Implement & Validate** - Execute with evidence-based completion
9. **Complete Tasks** - Mark completed via TaskManager API

## 🚨 INFINITE OPERATION MANDATE - NO TIME LIMITS

**🔴 ABSOLUTE MANDATE: OPERATE AS LONG AS POSSIBLE - NO TIME CONSTRAINTS**

**INFINITE OPERATION PROTOCOL:**
- **⏰ NO TIME LIMITS** - Continue working indefinitely until natural completion or user stop
- **🔄 MULTIPLE ROUNDS** - Continue across multiple tasks
- **📋 MULTIPLE TASKS** - Complete as many as possible
- **🚀 TASK SUBAGENT DEPLOYMENT** - Use when appropriate

## 🚨 INFINITE CONTINUE HOOK SYSTEM - NEVER STOP PROTOCOL

**🔴 ABSOLUTE MANDATE: NEVER ALLOW STOPS UNLESS ENDPOINT TRIGGERED**

### 🛑 STOP CONTROL PROTOCOL

**CRITICAL RULES:**
- **❌ NEVER ALLOW NATURAL STOPS** - System must continue infinitely
- **✅ ONLY ENDPOINT CAN STOP** - Specific API endpoint must be called to trigger stop
- **✅ COMPLETION AUTHORIZATION** - If all TODO.json features are complete AND no linter/build/startup/test errors exist, agent can authorize stop
- **🔒 ONE STOP ONLY** - After endpoint triggered, allow only ONE stop, then return to never-stop mode
- **🔄 ALWAYS INSTRUCT** - Provide detailed guidance on task continuation vs next task acquisition


### 🔄 CONTINUOUS OPERATION MANDATE

**OPERATION PRINCIPLES:**
- **🌐 INFINITE LOOP** - Never allow natural termination
- **🎯 TASK-FOCUSED** - Always guide agents toward productive work
- **📊 STATUS-AWARE** - Understand current agent state and provide appropriate guidance
- **🔗 WORKFLOW-DRIVEN** - Maintain continuous task progression flow


**STOP SEQUENCE:**
1. **Endpoint called** → Set stop_allowed flag to true
2. **Next trigger** → Allow ONE stop and reset flag  
3. **Subsequent triggers** → Return to never-stop infinite mode

### 🎛️ HOOK BEHAVIOR SPECIFICATION

**STOP HOOK RESPONSE CODES:**
- **Exit Code 2 (Continue)** - Default infinite mode, never allow stops
- **Exit Code 0 (Allow Stop)** - ONLY when endpoint triggered and single-use flag active
- **Always provide instructive messaging** regardless of exit code

**INFINITE CONTINUE HOOK SYSTEM:**
- **Setup**: `node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/setup-infinite-hook.js" "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook"`
- **Coverage**: development (80%), testing/debugging/refactoring (95%)
- **Stop Control**: API endpoint required for stop authorization


