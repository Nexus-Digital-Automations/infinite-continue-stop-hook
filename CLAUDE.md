# Claude Code Project Assistant - Streamlined Guide

**🔴 LANGUAGE ADAPTATION INSTRUCTION:** Adapt all code examples and patterns to your project's language (TypeScript/JavaScript/Python). The principles apply universally - modify syntax as needed for your context.

## 🚨 CRITICAL MANDATES

### ⚡ INSTANT TASK CREATION - ABSOLUTE MANDATE
**🔴 THE INSTANT A USER MAKES ANY REQUEST - IMMEDIATELY CREATE TASK**

**ABSOLUTE REQUIREMENTS:**
1. **CREATE TASK INSTANTLY** - Use TaskManager API before ANY other action
2. **CATEGORY MANDATORY** - Must specify: research, missing-feature, bug, enhancement, etc.  
3. **ZERO DELAY TOLERANCE** - No thinking, analysis, or preparation first
4. **THEN PROCEED** - Only after task creation can work begin

**Golden Rule**: User request → **INSTANT TASK CREATION** → Then execute

### 🔴 COMPREHENSIVE LOGGING MANDATE
**ALL CODE MUST HAVE ENTERPRISE-GRADE LOGGING**

**REQUIREMENTS:**
- **❌ NO CODE WITHOUT LOGGING** - Every function must have comprehensive logging
- **❌ NO SILENT OPERATIONS** - Log execution, parameters, results
- **✅ STRUCTURED LOGGING** - Consistent formatting with operation IDs
- **✅ PERFORMANCE METRICS** - Timing for bottleneck identification

**LOGGING PATTERN (adapt to your language):**
```typescript
function processData(userId: string, data: any) {
    const logger = getLogger('DataProcessor');
    const operationId = generateOperationId();
    
    logger.info(`[${operationId}] Starting processing`, {
        userId, operationId, dataSize: JSON.stringify(data).length
    });
    
    try {
        const startTime = Date.now();
        const result = transformData(data);
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

### 📋 FEATURES.MD INTEGRATION MANDATE
**ALWAYS RESPECT development/essentials/features.md WORKFLOW**

1. **READ features.md FIRST** before any feature work
2. **PROPOSALS ONLY** - Add to "❓ Potential Features Awaiting User Verification"  
3. **USER APPROVAL REQUIRED** - Only implement from "📋 Planned Features"
4. **NO UNAUTHORIZED FEATURES**

## 🚨 ERROR HANDLING & QUALITY PROTOCOLS

### MANDATORY ERROR RESPONSE & VALIDATION
**ERROR DETECTION = INSTANT TASK CREATION**

**Error Types → Task Categories:**
- Linter errors → `category: 'linter-error'` 
- Build failures → `category: 'build-error'`
- Runtime errors → `category: 'error'`
- Test failures → `category: 'test-error'`

### POST-COMPLETION VALIDATION - ABSOLUTE REQUIREMENT
**🚨 MANDATORY LINTER CHECKS BEFORE TASK COMPLETION**

**VALIDATION SEQUENCE:**
1. Complete implementation
2. **RUN LINTER CHECKS** - Never skip this step
3. **FIX ALL ERRORS** - No bypassing or suppressing  
4. **PROVIDE EVIDENCE** - Show command outputs
5. **ONLY THEN mark complete**

**LINTER COMMANDS (adapt to your project):**
```bash
# TypeScript/JavaScript
npm run lint
npm run typecheck  
npm run build

# Python
ruff check .
mypy .
black --check .

# Evidence Format:
✅ Linter: 0 errors, 0 warnings
✅ TypeCheck: No type errors found
✅ Build: Successful compilation
```

**VALIDATION FAILURE PROTOCOL:**
- Linting errors → Create linter-error task **IMMEDIATELY**
- Type errors → Create error task **IMMEDIATELY**
- DO NOT mark original task complete until ALL validation passes

### ZERO TOLERANCE FOR ISSUE MASKING
**ALWAYS FIX ROOT CAUSE - NEVER HIDE PROBLEMS**

**FORBIDDEN:**
- ❌ Masking validation errors
- ❌ Suppressing error messages  
- ❌ Bypassing quality checks
- ❌ Implementing workarounds
- ❌ Disabling linting rules

## 🎯 TASK CATEGORY & PRIORITY SYSTEM

**AUTO-SORTED BY PRIORITY:**

### CRITICAL ERRORS (Rank 1-4) - Highest Priority
1. **linter-error** - Code quality issues
2. **build-error** - Compilation failures
3. **start-error** - Application startup failures  
4. **error** - Runtime errors

### IMPLEMENTATION WORK (Rank 5-9)
5. **missing-feature** - Required functionality
6. **bug** - Incorrect behavior
7. **enhancement** - Feature improvements
8. **refactor** - Code restructuring
9. **documentation** - Documentation updates

### MAINTENANCE & RESEARCH (Rank 10-11) 
10. **chore** - Maintenance tasks
11. **research** - Investigation work

### TESTING (Rank 12-18) - Lowest Priority
12. **missing-test** - Test coverage gaps
13. **test-setup** - Test environment setup
14-18. Various test-related categories

## 🚨 ESSENTIAL AGENT COMMANDS

### 🔴 CRITICAL PATH REQUIREMENTS
- **ALWAYS use absolute paths** to TaskManager libraries
- **NEVER use relative paths** like `./lib/taskManager` from other projects

### 📍 CORRECT PATHS
```bash
# TaskManager Library (ALWAYS use this absolute path)
"/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager"

# Universal Script  
"/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/tm-universal.js"
```

### ⚡ CORE COMMANDS
```bash
# Agent Initialization (MANDATORY FIRST STEP)
node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/tm-universal.js" init --project [PROJECT_DIRECTORY]

# Create Task (with absolute path)
timeout 10s node -e 'const TaskManager = require("/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager"); const tm = new TaskManager("./TODO.json"); tm.createTask({title: "Task title", category: "missing-feature"}).then(id => console.log("Created:", id));'

# Check Available Tasks  
timeout 10s node -e 'const TaskManager = require("/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager"); const tm = new TaskManager("./TODO.json"); tm.readTodo().then(data => { const available = data.tasks.filter(t => t.status === "pending" && (t.assigned_agent === undefined || t.assigned_agent === null)); console.log("Available:", available.map(t => ({id: t.id, title: t.title, category: t.category}))); });'

# Claim Task
timeout 10s node -e 'const TaskManager = require("/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager"); const tm = new TaskManager("./TODO.json"); tm.claimTask("TASK_ID", "AGENT_ID", "normal").then(result => console.log(JSON.stringify(result, null, 2)));'
```

### 🚨 BASH ESCAPING PROTOCOL
**CRITICAL: ALWAYS USE SINGLE QUOTES FOR NODE -E COMMANDS**

```bash
# ✅ CORRECT - Single quotes prevent bash interference
node -e 'JavaScript code here'

# ❌ BROKEN - Double quotes cause escaping issues  
node -e "JavaScript code"
```

## 🚨 CONCURRENT SUBAGENT DEPLOYMENT

### 🔥 ABSOLUTE SUBAGENT MANDATE
**DEPLOY UP TO 10 CONCURRENT SUBAGENTS FOR COMPLEX WORK**

**CRITICAL RULES:**
- **⚡ MAXIMIZE SUBAGENTS** - Use as many as beneficial (up to 10)
- **⚡ PARALLEL EXECUTION** - Never sequential, always simultaneous
- **⚡ SYNCHRONIZED COMPLETION** - All finish within similar timeframes

**SPECIALIZATIONS BY MODE:**
- **DEVELOPMENT**: Frontend, Backend, Database, DevOps, Security
- **TESTING**: Unit Test, Integration Test, E2E Test, Performance, Security  
- **RESEARCH**: Technology Evaluator, API Analyst, Performance Researcher
- **DEBUGGING**: Error Analysis, Performance Profiling, Code Quality

## 🚨 CONTEXT & RESEARCH INTEGRATION

### DEVELOPMENT ESSENTIALS REVIEW
**ALWAYS READ development/essentials/ BEFORE STARTING WORK**

1. Check if development/essentials/ exists
2. Read all files for project constraints and requirements
3. Reference during implementation decisions

### RESEARCH REPORTS INTEGRATION  
**MANDATORY: Check development/reports/ and development/research-reports/**

1. Scan for relevant research reports before tasks
2. Add applicable reports to task important_files
3. Read reports FIRST before implementation
4. Create research dependencies for complex work

### RESEARCH TASK CREATION
**CREATE RESEARCH TASKS FOR:**
- 🌐 External API integrations
- 🗄️ Database schema changes
- 🔐 Authentication/Security systems
- 📊 Data processing algorithms
- 🧩 Complex architectural decisions

## 🚨 WORKFLOW PROTOCOLS

### TODO.JSON INTERACTION
**MANDATORY: ALWAYS USE TASKMANAGER API**

**✅ ALLOWED:** Reading TODO.json for inspection
**✅ REQUIRED:** TaskManager API for ALL modifications  
**❌ FORBIDDEN:** Direct file writes to TODO.json

### TASKMANAGER API REQUIREMENTS
- **ALWAYS USE 10 SECOND TIMEOUTS** - Prefix with `timeout 10s`
- **ALWAYS USE SINGLE QUOTES** - Prevent bash escaping errors
- **FOLLOW STOP HOOK FEEDBACK** - Use official API endpoints only

## 🚨 MANDATORY GIT WORKFLOW

### COMMIT PROTOCOL - NO EXCEPTIONS
**AFTER EVERY TASK COMPLETION:**

```bash  
# 1. Stage changes
git add -A

# 2. Commit with proper format
git commit -m "feat: [description]

- [specific changes made]
- [accomplishments]
- [fixes/improvements]

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"

# 3. MANDATORY - Push to remote
git push
```

### TASK COMPLETION REQUIREMENTS
**EVIDENCE-BASED COMPLETION PROTOCOL:**

1. **Complete implementation**
2. **MANDATORY LINTER CHECKS** - Run all validation  
3. **Fix validation errors** - Address immediately
4. **Provide evidence** - Show command outputs
5. **Test functionality** - Verify works as expected
6. **Document requirements satisfaction**
7. **Mark complete with evidence**

**COMPLETION FORMAT:**
```
• Functionality: [Description of implementation]
• Linter Validation: ✅ [command] - 0 errors, 0 warnings
• Type Validation: ✅ [command] - No errors found
• Build Validation: ✅ [command] - Successful
• Testing: [Results]
• Requirements: [How satisfied]
• Status: Completed and validated
```

**🔴 ABSOLUTE RULE: NO TASK COMPLETION WITHOUT LINTER VALIDATION EVIDENCE**

## 🚨 SYSTEM CONTROLS

### INFINITE OPERATION MANDATE
**OPERATE AS LONG AS POSSIBLE - NO TIME CONSTRAINTS**

- **⏰ NO TIME LIMITS** - Continue until natural completion
- **🔄 MULTIPLE ROUNDS** - Deploy subagents across multiple tasks
- **🚀 MAXIMUM EFFICIENCY** - Complete as many tasks as possible

### INFINITE CONTINUE HOOK SYSTEM
**NEVER ALLOW STOPS UNLESS ENDPOINT TRIGGERED**

**RULES:**
- **❌ NEVER NATURAL STOPS** - System continues infinitely  
- **✅ ENDPOINT CONTROL** - Only API can authorize stops
- **🔒 SINGLE-USE** - One stop per authorization, then return to infinite mode

### SETTINGS PROTECTION
**🔴 CRITICAL PROHIBITION - NEVER EDIT SETTINGS**

**ABSOLUTELY FORBIDDEN:**
- ❌ NEVER edit `/Users/jeremyparker/.claude/settings.json`
- ❌ NEVER modify global Claude settings
- ❌ NEVER access settings files

**GOLDEN RULE:** Settings are UNTOUCHABLE - treat as read-only

## 🚨 EXECUTION WORKFLOW

**STANDARD APPROACH:**
1. **INSTANT TASK CREATION** - For ANY user request
2. **Evaluate Existing Tasks** - Check if modify vs create new
3. **Think Appropriately** - Use suitable thinking level
4. **Initialize Agent** - Use TaskManager API
5. **Deploy Subagents** - Maximize concurrent subagents  
6. **Implement & Validate** - Execute with evidence
7. **Complete Tasks** - Mark complete via API

## 🚨 COMPLIANCE HIERARCHY

**PRIORITY ORDER:**
1. **INSTANT TASK CREATION** - Highest priority, no exceptions
2. **COMPREHENSIVE LOGGING** - Enterprise-grade logging required
3. **LINTER VALIDATION** - Mandatory before completion  
4. **FEATURES.MD RESPECT** - Follow approval workflow
5. **USER INSTRUCTIONS** - Direct commands priority
6. **EVIDENCE-BASED VALIDATION** - Concrete proof required

---

**Remember: Adapt all code examples and patterns to your project's specific language while maintaining these core principles and workflows.**