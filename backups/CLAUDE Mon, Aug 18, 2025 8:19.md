# Claude Code Project Assistant - Streamlined Guide

## ⚡⚡⚡ ABSOLUTE CRITICAL MANDATE ⚡⚡⚡

# 🚨🚨🚨 INSTANTLY CREATE TASK FOR ANY USER REQUEST 🚨🚨🚨
# 🚨🚨🚨 NO EXCEPTIONS - NO DELAYS - NO ANALYSIS FIRST 🚨🚨🚨
# 🚨🚨🚨 USER SAYS ANYTHING → CREATE TASK IMMEDIATELY 🚨🚨🚨

**⚡ THE MOMENT USER MAKES ANY REQUEST:**
**⚡ STOP EVERYTHING AND CREATE TASK USING TASKMANAGER API**
**⚡ CATEGORY REQUIRED - USE: research, missing-feature, bug, enhancement, etc.**
**⚡ THEN AND ONLY THEN PROCEED WITH WORK**

## 🚨 CRITICAL COMPLIANCE PROTOCOLS

**PRIORITY ORDER:**
1. **⚡ INSTANT TASK CREATION ⚡** - Create task for ANY user request FIRST
2. **User Instructions** - Direct commands take highest priority  
3. **Hook Feedback** - Address system responses immediately
4. **Linting Error Feedback** - Fix all linting errors before proceeding
5. **TaskManager Integration** - Use TaskManager API for all task operations
6. **Evidence-Based Validation** - Validate all work with concrete evidence

**CORE RULES:**
- **⚡ INSTANTLY CREATE TASK ⚡** for ANY user request using TaskManager API
- **VALIDATE BEFORE COMPLETION** - Provide evidence of all validation checks
- **FIX ERRORS IMMEDIATELY** - Create categorized tasks for all detected issues

## 🚨 ERROR HANDLING PROTOCOL

**MANDATORY ERROR RESPONSE:**
1. **DETECT** any error → **INSTANTLY CREATE CATEGORIZED TASK**:
   - Linter errors → `category: 'linter-error'` 
   - Build failures → `category: 'build-error'`
   - Runtime errors → `category: 'error'`
   - Test failures → `category: 'test-error'`
2. **ATTEMPT IMMEDIATE FIX** (< 2 minutes) OR work on task
3. **VERIFY** fix and document resolution

**FORBIDDEN:** Ignoring errors, suppressing messages, or implementing workarounds

## 🚨🚨🚨 ABSOLUTE MANDATE: NEVER MASK ISSUES 🚨🚨🚨

# ⛔⛔⛔ ZERO TOLERANCE FOR ISSUE MASKING ⛔⛔⛔
# ⛔⛔⛔ NO BYPASSING - NO WORKAROUNDS - NO SUPPRESSION ⛔⛔⛔
# ⛔⛔⛔ ALWAYS FIX ROOT CAUSE - NEVER HIDE PROBLEMS ⛔⛔⛔

**🚨 ABSOLUTE PROHIBITION - NEVER EVER EVER:**
- **❌ MASK validation errors** - Fix the validation logic, don't bypass it
- **❌ SUPPRESS error messages** - Fix the error, don't hide it
- **❌ BYPASS quality checks** - Fix the code to pass checks
- **❌ IMPLEMENT WORKAROUNDS** - Fix the root cause, don't work around it
- **❌ HIDE FAILING TESTS** - Fix the tests or code, don't disable them
- **❌ IGNORE LINTING ERRORS** - Fix the linting violations
- **❌ COMMENT OUT ERROR HANDLING** - Fix the underlying issue
- **❌ ADD try/catch TO SILENCE ERRORS** - Fix what's causing the error
- **❌ DISABLE WARNINGS OR CHECKS** - Address what's causing the warnings

**🚨 MANDATORY ROOT CAUSE ANALYSIS:**
When ANY issue is detected:
1. **IDENTIFY** the true root cause of the problem
2. **ANALYZE** why the issue exists in the first place  
3. **FIX** the underlying architectural or logic problem
4. **VALIDATE** that the fix resolves the core issue
5. **DOCUMENT** what was wrong and how it was properly fixed

**🚨 EXAMPLES OF FORBIDDEN MASKING:**
```bash
# ❌ FORBIDDEN - Masking validation
if (!validationResult.isValid) return { success: true }; // HIDING PROBLEM

# ✅ REQUIRED - Fixing validation
if (!validationResult.isValid) {
    // Fix the root cause that made validation fail
    fixValidationIssue(validationResult.errors);
    // Re-run validation to ensure it passes
}

# ❌ FORBIDDEN - Suppressing errors  
try { riskyOperation(); } catch (e) { /* ignore */ } // HIDING PROBLEM

# ✅ REQUIRED - Handling errors properly
try { 
    riskyOperation(); 
} catch (e) { 
    // Fix what's causing riskyOperation to fail
    fixUnderlyingIssue(e);
    // Re-attempt after fixing root cause
}
```

**🚨 ZERO TOLERANCE ENFORCEMENT:**
- **ANY ATTEMPT TO MASK** = Immediate task creation to fix properly
- **ANY WORKAROUND SUGGESTION** = Must be replaced with root cause fix
- **ANY ERROR SUPPRESSION** = Must be replaced with proper error resolution
- **ANY VALIDATION BYPASS** = Must be replaced with validation fix

**🚨 QUALITY GATE PRINCIPLE:**
Every error, warning, or issue is a **QUALITY GATE** that must be **PROPERLY ADDRESSED**:
- Issues exist to **PROTECT CODE QUALITY**
- Masking issues **DEGRADES SYSTEM RELIABILITY** 
- Root cause fixes **IMPROVE LONG-TERM STABILITY**
- Proper solutions **PREVENT FUTURE PROBLEMS**

**⚡ WHEN ISSUE DETECTED → INSTANT ROOT CAUSE ANALYSIS → PROPER FIX → NEVER MASK**

## 🚨 MANDATORY THINKING & VALIDATION

**THINKING LEVELS:** Use maximum beneficial thinking for complexity:
- **ULTRATHINK**: System architecture, task planning, priority evaluation
- **THINK HARD**: Complex refactoring, debugging, task management  
- **MANDATORY**: All task operations (creation, categorization, completion)

**VALIDATION PROTOCOL:** Evidence-based completion required:
1. **RUN validation commands** - show all outputs
2. **TEST functionality manually** - demonstrate it works  
3. **VERIFY requirements met** - list each satisfied requirement
4. **PROVIDE EVIDENCE** - paste command outputs proving success

## 🚨 TASKMANAGER API INTEGRATION

**CRITICAL**: Directory restrictions resolved with Node.js API. ALL TaskManager commands MUST use universal scripts. Replace `[PROJECT_DIRECTORY]` with actual project path.

### 🌟 UNIVERSAL USAGE (ALWAYS USE THESE!)

```bash
# Universal CLI (recommended)
node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/tm-universal.js" <command> [args...] [--project /path/to/project]

# Examples:
node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/tm-universal.js" init --project /path/to/my-project
node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/tm-universal.js" api current --project /path/to/my-project
node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/tm-universal.js" update task_123 completed --project /path/to/my-project

# Individual scripts with project path
node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/tm-init.js" /path/to/project
node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/tm-update.js" task_123 completed "" /path/to/project
node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/taskmanager-api.js" current --project-root /path/to/project
```

**✅ AGENT INITIALIZATION (MANDATORY):**
```bash
# ALWAYS use universal script with project path:
node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/tm-universal.js" init --project [PROJECT_DIRECTORY]

# Alternative direct script usage:
node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/tm-init.js" [PROJECT_DIRECTORY]
```
**This command provides your agent ID and initializes the TaskManager session.**

### 🎯 Core TaskManager Node.js API Operations

**🔴 CRITICAL: Claude Code Bash Execution**

**Claude Code cannot run Node.js natively** - all TaskManager operations must use bash commands with Node.js wrappers:

```bash
# Agent initialization and management
node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/tm-universal.js" init --project [PROJECT_DIRECTORY]
node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/taskmanager-api.js" init '{"role": "testing", "specialization": ["unit-tests"]}' --project-root [PROJECT_DIRECTORY]

# Task management operations
node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/tm-universal.js" api current --project [PROJECT_DIRECTORY]
node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/taskmanager-api.js" list '{"status": "pending"}' --project-root [PROJECT_DIRECTORY]
node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/taskmanager-api.js" create '{"title": "Fix linter errors", "mode": "DEVELOPMENT", "category": "linter-error"}' --project-root [PROJECT_DIRECTORY]
node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/taskmanager-api.js" claim task_123 [agentId] normal --project-root [PROJECT_DIRECTORY]
node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/tm-universal.js" update task_123 completed "Fixed successfully" --project [PROJECT_DIRECTORY]

# Task organization and prioritization
node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/taskmanager-api.js" move-top task_123 --project-root [PROJECT_DIRECTORY]
node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/taskmanager-api.js" move-up task_123 --project-root [PROJECT_DIRECTORY]
node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/taskmanager-api.js" move-down task_123 --project-root [PROJECT_DIRECTORY]
node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/taskmanager-api.js" move-bottom task_123 --project-root [PROJECT_DIRECTORY]

# System status and statistics
node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/taskmanager-api.js" status [agentId] --project-root [PROJECT_DIRECTORY]
node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/taskmanager-api.js" stats --project-root [PROJECT_DIRECTORY]
```

### 📋 Direct Node.js API Commands

**For programmatic access and complex operations:**

```bash
# Core task operations
node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/taskmanager-api.js" init --project-root [PROJECT_DIRECTORY]
node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/tm-universal.js" api current --project [PROJECT_DIRECTORY]
node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/taskmanager-api.js" list '{"mode": "DEVELOPMENT"}' --project-root [PROJECT_DIRECTORY]
node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/taskmanager-api.js" create '{"title": "Add missing unit tests", "mode": "TESTING", "category": "missing-test"}' --project-root [PROJECT_DIRECTORY]

# Task management using universal TaskManager API directly (from any directory)
node -e "const TaskManager = require('/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager'); const tm = new TaskManager('[PROJECT_DIRECTORY]/TODO.json'); tm.getCurrentTask('agent_1').then(task => console.log(JSON.stringify(task, null, 2)));"

node -e "const TaskManager = require('/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager'); const tm = new TaskManager('[PROJECT_DIRECTORY]/TODO.json'); tm.createTask({title: 'Fix build error', description: 'Webpack compilation failing', mode: 'DEVELOPMENT', category: 'build-error'}).then(id => console.log('Created task:', id));"

node -e "const TaskManager = require('/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager'); const tm = new TaskManager('[PROJECT_DIRECTORY]/TODO.json'); tm.updateTaskStatus('task_id', 'completed').then(() => console.log('Task updated'));"
```

### 🔧 Advanced TaskManager Operations

```bash
# Multi-agent task assignment
node -e "const TaskManager = require('/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager'); const tm = new TaskManager('[PROJECT_DIRECTORY]/TODO.json'); tm.assignTaskToAgent('task_id', 'agent_1', 'primary').then(success => console.log('Task assigned:', success));"

node -e "const TaskManager = require('/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager'); const tm = new TaskManager('[PROJECT_DIRECTORY]/TODO.json'); tm.claimTask('task_id', 'agent_1', 'high').then(result => console.log(JSON.stringify(result, null, 2)));"

# Task removal and reordering
node -e "const TaskManager = require('/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager'); const tm = new TaskManager('[PROJECT_DIRECTORY]/TODO.json'); tm.removeTask('task_id').then(removed => console.log('Task removed:', removed));"

node -e "const TaskManager = require('/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager'); const tm = new TaskManager('[PROJECT_DIRECTORY]/TODO.json'); tm.moveTaskToTop('task_id').then(moved => console.log('Task moved to top:', moved));"

# File and research management
node -e "const TaskManager = require('/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager'); const tm = new TaskManager('[PROJECT_DIRECTORY]/TODO.json'); tm.addImportantFile('task_id', './development/research-reports/task-specific-analysis.md').then(added => console.log('Important file added:', added));"

node -e "const TaskManager = require('/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager'); const tm = new TaskManager('[PROJECT_DIRECTORY]/TODO.json'); console.log(tm.getResearchReportPath('task_id'));"

# Dependency management
node -e "const TaskManager = require('/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager'); const tm = new TaskManager('[PROJECT_DIRECTORY]/TODO.json'); tm.buildDependencyGraph().then(graph => console.log(graph.tree));"

node -e "const TaskManager = require('/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager'); const tm = new TaskManager('[PROJECT_DIRECTORY]/TODO.json'); tm.getExecutableTasks().then(tasks => console.log(JSON.stringify(tasks.map(t => ({id: t.id, title: t.title, status: t.status})), null, 2)));"

# Quality gates and validation
node -e "const TaskManager = require('/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager'); const tm = new TaskManager('[PROJECT_DIRECTORY]/TODO.json'); tm.executeQualityGates('task_id').then(result => console.log(JSON.stringify(result, null, 2)));"

node -e "const TaskManager = require('/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager'); const tm = new TaskManager('[PROJECT_DIRECTORY]/TODO.json'); tm.validateTodoFile().then(result => console.log(JSON.stringify(result, null, 2)));"
```

### 🤖 Multi-Agent Coordination

```bash
# Collaborative task management
node -e "const TaskManager = require('/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager'); const tm = new TaskManager('[PROJECT_DIRECTORY]/TODO.json'); tm.createTask({title: 'Collaborative Task', description: 'Multiple agents can work on this', mode: 'DEVELOPMENT', allows_collaboration: true, max_agents: 3}).then(id => console.log('Created collaborative task:', id));"

node -e "const TaskManager = require('/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager'); const tm = new TaskManager('[PROJECT_DIRECTORY]/TODO.json'); tm.getTasksForAgent('agent_1').then(tasks => console.log('Agent tasks:', tasks.length));"

node -e "const TaskManager = require('/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager'); const tm = new TaskManager('[PROJECT_DIRECTORY]/TODO.json'); tm.getMultiAgentStatistics().then(stats => console.log(JSON.stringify(stats, null, 2)));"

# Parallel execution planning
node -e "const TaskManager = require('/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager'); const tm = new TaskManager('[PROJECT_DIRECTORY]/TODO.json'); tm.createParallelExecution(['task1', 'task2', 'task3'], ['agent_1', 'agent_2', 'agent_3'], ['sync_point_1']).then(result => console.log(JSON.stringify(result, null, 2)));"
```

### 📊 Backup and Archive Management

```bash
# Backup operations
node -e "const TaskManager = require('/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager'); const tm = new TaskManager('[PROJECT_DIRECTORY]/TODO.json'); tm.listBackups().then(backups => console.log(JSON.stringify(backups, null, 2)));"

node -e "const TaskManager = require('/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager'); const tm = new TaskManager('[PROJECT_DIRECTORY]/TODO.json'); tm.createBackup().then(result => console.log(JSON.stringify(result, null, 2)));"

# Completed task archiving (DONE.json)
node -e "const TaskManager = require('/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager'); const tm = new TaskManager('[PROJECT_DIRECTORY]/TODO.json'); tm.getCompletedTasks({limit: 10}).then(tasks => console.log(JSON.stringify(tasks.map(t => ({id: t.id, title: t.title, completed_at: t.completed_at})), null, 2)));"

node -e "const TaskManager = require('/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager'); const tm = new TaskManager('[PROJECT_DIRECTORY]/TODO.json'); tm.getCompletionStats().then(stats => console.log(JSON.stringify(stats, null, 2)));"

node -e "const TaskManager = require('/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager'); const tm = new TaskManager('[PROJECT_DIRECTORY]/TODO.json'); tm.restoreCompletedTask('task_id').then(restored => console.log('Task restored:', restored));"
```

### 🔍 Filtering and Querying

```bash
# Advanced task querying
node -e "const TaskManager = require('/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager'); const tm = new TaskManager('[PROJECT_DIRECTORY]/TODO.json'); tm.queryTasks({status: 'pending', category: 'linter-error'}).then(tasks => console.log(JSON.stringify(tasks.map(t => ({id: t.id, title: t.title, category: t.category})), null, 2)));"

# Available filter options: status, priority, mode, hasFile, titleContains

# Task templates
node -e "const TaskManager = require('/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager'); const tm = new TaskManager('[PROJECT_DIRECTORY]/TODO.json'); tm.createTaskFromTemplate('bug-fix', {bugDescription: 'Login fails on mobile', priority: 'high'}).then(id => console.log('Created task:', id));"

# Available templates: bug-fix, feature, refactor, research
```

### 🚨 Error Tracking and Recovery

```bash
# Error tracking
node -e "const TaskManager = require('/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager'); const tm = new TaskManager('[PROJECT_DIRECTORY]/TODO.json'); tm.trackTaskError('task_id', {type: 'test_failure', message: 'Unit tests failing', blocking: true}).then(tracked => console.log('Error tracked:', tracked));"

node -e "const TaskManager = require('/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager'); const tm = new TaskManager('[PROJECT_DIRECTORY]/TODO.json'); tm.getErrorSummary().then(summary => console.log(JSON.stringify(summary, null, 2)));"

# Auto-fix and recovery
node -e "const TaskManager = require('/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager'); const tm = new TaskManager('[PROJECT_DIRECTORY]/TODO.json'); tm.performAutoFix().then(result => console.log(JSON.stringify(result, null, 2)));"

node -e "const TaskManager = require('/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager'); const tm = new TaskManager('[PROJECT_DIRECTORY]/TODO.json'); tm.getFileStatus().then(status => console.log(JSON.stringify(status, null, 2)));"
```

### 🎯 Most Common Quick Operations

```bash
# Essential workflow commands
# Initialize agent (save the returned agentId) - ALWAYS use universal script
node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/tm-universal.js" init --project [PROJECT_DIRECTORY]

# Get current task
node -e "const TaskManager = require('/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager'); const tm = new TaskManager('[PROJECT_DIRECTORY]/TODO.json'); tm.getCurrentTask('agent_1').then(task => console.log(task ? task.title : 'No active tasks'));"

# Mark current task completed  
node -e "const TaskManager = require('/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager'); const tm = new TaskManager('[PROJECT_DIRECTORY]/TODO.json'); tm.getCurrentTask('agent_1').then(async task => { if(task) { await tm.updateTaskStatus(task.id, 'completed'); console.log('Task completed:', task.title); } });"

# Get next task
node -e "const TaskManager = require('/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager'); const tm = new TaskManager('[PROJECT_DIRECTORY]/TODO.json'); tm.getNextTask('agent_1').then(task => console.log(task ? 'Next: ' + task.title : 'No more tasks'));"

# Create categorized task
node -e "const TaskManager = require('/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager'); const tm = new TaskManager('[PROJECT_DIRECTORY]/TODO.json'); tm.createTask({title: 'Fix linter errors in auth module', description: 'ESLint errors found in authentication', mode: 'DEVELOPMENT', category: 'linter-error'}).then(id => console.log('Created:', id));"

# Move task to top priority
node -e "const TaskManager = require('/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager'); const tm = new TaskManager('[PROJECT_DIRECTORY]/TODO.json'); tm.moveTaskToTop('task_id').then(moved => console.log('Moved to top:', moved));"
```

**LEARN TASKMANAGER API**: The initialization process teaches you how to create tasks, prioritize them, and manage the TODO.json file. Use these commands for all task management operations.

## 🚨 TASK CATEGORY & PRIORITY SYSTEM

**CATEGORY-BASED PRIORITY SYSTEM:**

Tasks are now organized by **specific categories** instead of generic "low", "medium", "high" priorities. The system **automatically sorts** tasks by category urgency:

### 🌟 TOP PRIORITY (Rank 1) - Highest Priority
1. **🔬 research** - Investigation, exploration, or learning tasks - **HIGHEST PRIORITY**

### 🔴 CRITICAL ERRORS (Rank 2-5) - Block All Work
2. **🔴 linter-error** - Code style, formatting, or quality issues detected by linters
3. **🔥 build-error** - Compilation, bundling, or build process failures  
4. **⚠️ start-error** - Application startup, initialization, or runtime launch failures
5. **❌ error** - General runtime errors, exceptions, or system failures

### 🟡 HIGH PRIORITY (Rank 6) - Important Features
6. **🆕 missing-feature** - Required functionality that needs to be implemented

### 🔵 STANDARD PRIORITY (Rank 7-10) - Normal Development
7. **🐛 bug** - Incorrect behavior or functionality that needs fixing
8. **✨ enhancement** - Improvements to existing features or functionality
9. **♻️ refactor** - Code restructuring, optimization, or technical debt reduction
10. **📚 documentation** - Documentation updates, comments, or API documentation

### 🟢 LOW PRIORITY (Rank 11) - Maintenance
11. **🧹 chore** - Maintenance tasks, cleanup, or administrative work

### 🔴 LOWEST PRIORITY (Rank 12-18) - All Testing Related - LAST PRIORITY
12. **🧪 missing-test** - Test coverage gaps or missing test cases - **LOWEST PRIORITY**
13. **⚙️ test-setup** - Test environment configuration, test infrastructure setup
14. **🔄 test-refactor** - Refactoring test code, improving test structure
15. **📊 test-performance** - Performance tests, load testing, stress testing
16. **🔍 test-linter-error** - Linting issues specifically in test files - **LOWEST PRIORITY**
17. **🚫 test-error** - Failing tests, test framework issues - **LOWEST PRIORITY** 
18. **🔧 test-feature** - New testing features, test tooling improvements - **LOWEST PRIORITY**

**AVAILABLE CATEGORIES (Must be specified when creating tasks):**
- **research** (rank 1) - Highest priority  
- **linter-error, build-error, start-error, error** (ranks 2-5) - Critical errors
- **missing-feature** (rank 6) - Important features
- **bug, enhancement, refactor, documentation** (ranks 7-10) - Standard work
- **chore** (rank 11) - Maintenance
- **missing-test, test-setup, test-refactor, test-performance, test-linter-error, test-error, test-feature** (ranks 12-18) - Testing (lowest priority)

**THREE-LEVEL AUTO-SORTING HIERARCHY:**
1. **PRIMARY: Category Rank** - Research (1) → Linter Errors (2) → Build Errors (3) → etc.
2. **SECONDARY: Priority Value** - Critical (4) → High (3) → Medium (2) → Low (1)
3. **TERTIARY: Creation Time** - Newer tasks first within same category and priority

**CREATING TASKS WITH CATEGORIES (CATEGORY REQUIRED):**
```bash
# Category is MANDATORY - must be specified explicitly
node -e "const TaskManager = require('./lib/taskManager'); const tm = new TaskManager('./TODO.json'); tm.createTask({title: 'Fix ESLint errors', category: 'linter-error', mode: 'DEVELOPMENT'}).then(id => console.log('Created:', id));"

# Research task (highest priority)
node -e "const TaskManager = require('./lib/taskManager'); const tm = new TaskManager('./TODO.json'); tm.createTask({title: 'Research authentication patterns', category: 'research', mode: 'DEVELOPMENT'}).then(id => console.log('Created:', id));"

# Testing task (lowest priority)  
node -e "const TaskManager = require('./lib/taskManager'); const tm = new TaskManager('./TODO.json'); tm.createTask({title: 'Add unit tests', category: 'missing-test', mode: 'DEVELOPMENT'}).then(id => console.log('Created:', id));"

# Bug fix with explicit priority override
node -e "const TaskManager = require('./lib/taskManager'); const tm = new TaskManager('./TODO.json'); tm.createTask({title: 'Urgent bug fix', category: 'bug', priority: 'critical', mode: 'DEVELOPMENT'}).then(id => console.log('Created:', id));"
```

## 🚨 TASK MANAGEMENT PROTOCOLS

**INSTANT TASK CREATION - ALWAYS CREATE TASKS FOR:**
- **EVERY USER REQUEST** - no matter how simple or complex
- **EVERY USER INSTRUCTION** - any time user tells you to do something  
- **EVERY ISSUE USER POINTS OUT** - bugs, problems, suggestions, observations
- **ANY opportunity for improvement** discovered during work
- **ALL errors detected** (linting, testing, runtime, build failures)
- **Performance issues** (slow responses, memory leaks)
- **Security vulnerabilities** (auth issues, data exposure)
- **Code quality opportunities** (refactoring needs, missing docs)
- **Missing functionality** (incomplete features, edge cases)
- **Integration issues** (API failures, dependency conflicts)

**🚨 GOLDEN RULE**: User says ANYTHING requiring action OR asks ANY question → **INSTANTLY CREATE TASK THE VERY FIRST SECOND** → Check existing tasks → Modify OR create → Execute

## 🚨 MANDATORY CATEGORY-BASED TASK CREATION PROTOCOL

**🚨 ABSOLUTE MANDATE: CATEGORY DETECTION = IMMEDIATE TASK CREATION**

**THE INSTANT YOU DETECT ANY OF THESE CATEGORIES IN USER COMMUNICATION OR CODE ANALYSIS - CREATE TASK IMMEDIATELY:**

### 🔴 **CRITICAL ERROR CATEGORIES - CREATE TASK IN FIRST SECOND:**
- **🔴 LINTER-ERROR SPOTTED** → INSTANTLY CREATE `category: 'linter-error'` TASK
- **🔥 BUILD-ERROR DETECTED** → INSTANTLY CREATE `category: 'build-error'` TASK  
- **⚠️ START-ERROR FOUND** → INSTANTLY CREATE `category: 'start-error'` TASK
- **❌ RUNTIME ERROR SEEN** → INSTANTLY CREATE `category: 'error'` TASK

### 🌟 **RESEARCH OPPORTUNITIES - CREATE TASK IN FIRST SECOND:**
- **🔬 INVESTIGATION NEEDED** → INSTANTLY CREATE `category: 'research'` TASK (HIGHEST PRIORITY)
- **🔍 EXPLORATION REQUIRED** → INSTANTLY CREATE `category: 'research'` TASK (HIGHEST PRIORITY)
- **📊 ANALYSIS OPPORTUNITY** → INSTANTLY CREATE `category: 'research'` TASK (HIGHEST PRIORITY)
- **🧭 LEARNING REQUIRED** → INSTANTLY CREATE `category: 'research'` TASK (HIGHEST PRIORITY)

### 🆕 **FEATURE OPPORTUNITIES - CREATE TASK IN FIRST SECOND:**
- **🆕 MISSING FUNCTIONALITY** → INSTANTLY CREATE `category: 'missing-feature'` TASK
- **✨ ENHANCEMENT SPOTTED** → INSTANTLY CREATE `category: 'enhancement'` TASK
- **🐛 BUG DISCOVERED** → INSTANTLY CREATE `category: 'bug'` TASK

### 🧪 **TESTING OPPORTUNITIES - CREATE TASK IN FIRST SECOND (LOWEST PRIORITY):**
- **🧪 MISSING TESTS** → INSTANTLY CREATE `category: 'missing-test'` TASK
- **🔍 TEST LINTER ERRORS** → INSTANTLY CREATE `category: 'test-linter-error'` TASK
- **🚫 FAILING TESTS** → INSTANTLY CREATE `category: 'test-error'` TASK
- **🔧 TEST IMPROVEMENTS** → INSTANTLY CREATE `category: 'test-feature'` TASK

### 📚 **MAINTENANCE OPPORTUNITIES - CREATE TASK IN FIRST SECOND:**
- **♻️ REFACTORING NEEDED** → INSTANTLY CREATE `category: 'refactor'` TASK
- **📚 DOCUMENTATION GAPS** → INSTANTLY CREATE `category: 'documentation'` TASK
- **🧹 CLEANUP REQUIRED** → INSTANTLY CREATE `category: 'chore'` TASK

**🚨 CATEGORY DETECTION TRIGGERS - NO EXCEPTIONS:**
- User mentions ANY error, issue, or problem → **INSTANT TASK CREATION**
- Code analysis reveals ANY quality issue → **INSTANT TASK CREATION**
- You spot ANY opportunity for improvement → **INSTANT TASK CREATION**
- ANY missing functionality is identified → **INSTANT TASK CREATION**
- ANY research need is discovered → **INSTANT TASK CREATION**
- ANY test coverage gap is found → **INSTANT TASK CREATION**

**🚨 MANDATORY TASK CREATION COMMANDS - USE THESE IMMEDIATELY:**
```bash
# INSTANT LINTER ERROR TASK
node -e "const TaskManager = require('./lib/taskManager'); const tm = new TaskManager('./TODO.json'); tm.createTask({title: 'Fix [specific linter error]', category: 'linter-error', mode: 'DEVELOPMENT', priority: 'critical'}).then(id => console.log('URGENT LINTER TASK:', id));"

# INSTANT RESEARCH TASK (HIGHEST PRIORITY)
node -e "const TaskManager = require('./lib/taskManager'); const tm = new TaskManager('./TODO.json'); tm.createTask({title: 'Research [specific topic]', category: 'research', mode: 'DEVELOPMENT', priority: 'high'}).then(id => console.log('PRIORITY RESEARCH TASK:', id));"

# INSTANT BUG TASK
node -e "const TaskManager = require('./lib/taskManager'); const tm = new TaskManager('./TODO.json'); tm.createTask({title: 'Fix [specific bug]', category: 'bug', mode: 'DEVELOPMENT', priority: 'high'}).then(id => console.log('URGENT BUG TASK:', id));"

# INSTANT MISSING FEATURE TASK
node -e "const TaskManager = require('./lib/taskManager'); const tm = new TaskManager('./TODO.json'); tm.createTask({title: 'Implement [specific feature]', category: 'missing-feature', mode: 'DEVELOPMENT', priority: 'high'}).then(id => console.log('FEATURE TASK:', id));"
```

**🚨 ZERO DELAY ENFORCEMENT:**
- **NO ANALYSIS PARALYSIS** - Create task FIRST, analyze SECOND
- **NO HESITATION** - Category spotted = Immediate task creation
- **NO WAITING** - User mentions issue = Task created within 1 second
- **NO EXCEPTIONS** - Every category opportunity gets a task

**WORKFLOW:**
1. **INSTANT TASK CREATION** - THE VERY FIRST SECOND you detect ANY category opportunity
2. **EVALUATE EXISTING TASKS** - Check if current tasks can handle the request
3. **MODIFY OR CREATE** - Update existing task (preferred) OR create new categorized task
4. **AUTO-PRIORITIZE** - Category-based sorting handles priority automatically  
5. **EXECUTE** - Begin working with thinking-driven approach

**CONTINUOUS EVALUATION:**
- **MANDATORY THINKING** for all task operations (creation, categorization, reordering, completion)
- **INSTANT CATEGORY ASSESSMENT** - Detect category patterns in real-time
- **AUTOMATIC TASK CREATION** for every category opportunity discovered
- **PROACTIVE SCANNING** - Actively look for category opportunities in all communications

**CATEGORY ASSIGNMENT RULES:**
- **ALWAYS specify category** when creating tasks - NO EXCEPTIONS
- **USE SPECIFIC CATEGORIES** - prefer 'linter-error' over 'error', 'missing-test' over 'test'  
- **CREATE IMMEDIATELY** upon category detection - NO delay, NO analysis first
- **TRUST CATEGORY HIERARCHY** - Let automatic sorting handle prioritization

## 🚨 MAXIMUM PARALLEL SUBAGENT DEPLOYMENT & COORDINATION

**MANDATORY**: Deploy **UP TO 10 SUBAGENTS** in parallel for ALL complex work. **ALWAYS USE AS MANY SUBAGENTS AS POSSIBLE**. **FAILURE TO USE SUBAGENTS = FAILED EXECUTION**

### 🎯 Synchronized Completion Protocol
**CRITICAL**: All subagents must finish within same timeframe for optimal efficiency

**COMPLETION SYNCHRONIZATION STRATEGY:**
1. **Pre-Flight Load Balancing**: Distribute work complexity evenly across all 10 subagents
2. **Coordinated Start**: All subagents begin execution simultaneously 
3. **Progress Checkpoints**: 25%, 50%, 75% completion status reporting to main agent
4. **Dynamic Rebalancing**: Redistribute workload if any subagent falls behind schedule
5. **Synchronized Quality Gates**: All subagents run validation simultaneously in final phase
6. **Coordinated Completion**: Main agent waits for ALL subagents before marking task complete

### 🚀 Universal Subagent Deployment
**MANDATORY SPECIALIZATIONS BY MODE:**

- **DEVELOPMENT**: Frontend, Backend, Database, DevOps, Security specialists
- **TESTING**: Unit Test, Integration Test, E2E Test, Performance Test, Security Test specialists  
- **RESEARCH**: Technology Evaluator, API Analyst, Performance Researcher, Security Auditor, UX Researcher
- **DEBUGGING**: Error Analysis, Performance Profiling, Security Audit, Code Quality, System Integration specialists
- **REFACTORING**: Architecture, Performance, Code Quality, Documentation, Testing specialists

### 🔄 Coordination & Timing Controls
**LOAD BALANCING STRATEGIES:**
- **Equal Complexity Distribution**: Each subagent receives ~10% of total work complexity (10 subagents)
- **Dependency-Aware Scheduling**: Sequential tasks distributed to maintain parallel execution
- **Failure Recovery**: If any subagent fails, redistribute work to remaining agents
- **Completion Buffer**: Build in 10-15% time buffer for synchronization delays

**INTEGRATION CHECKPOINTS:**
- **Context Sharing**: Critical information passed between subagents at each checkpoint
- **Quality Verification**: Each subagent validates outputs meet perfection standards
- **Conflict Resolution**: Main agent resolves any conflicting recommendations
- **Final Integration**: All subagent outputs merged into cohesive deliverable

**DEPLOYMENT PATTERN:** Think → Map Work Distribution → Balance Complexity → Deploy UP TO 10 Agents Simultaneously → Monitor Progress → Synchronize Completion

**SUBAGENT DEPLOYMENT RULES:**
- **ALWAYS MAXIMIZE SUBAGENTS**: Use as many subagents as possible up to 10 for complex tasks
- **MINIMUM 3 SUBAGENTS**: Even simple tasks should use at least 3 subagents when possible
- **SCALE BY COMPLEXITY**: More complex tasks = more subagents (up to 10 maximum)
- **PARALLEL EXECUTION**: All subagents work simultaneously, not sequentially

## 🚨 CONTEXT MANAGEMENT

**Always check for ABOUT.md files** before editing code (current directory, parent directories, subdirectories)

## 🚨 WORKFLOW PROTOCOLS

**TODO.json INTERACTION PROTOCOL:**
**MANDATORY**: ALWAYS USE THE TASKMANAGER API WHEN INTERACTING WITH THE TODO.JSON

**CRITICAL REQUIREMENT**: ALL TODO.json operations (read/write) MUST use TaskManager API exclusively.

**✅ ALLOWED**: Reading TODO.json as a file (Read tool only) for viewing/inspection
**✅ CORRECT**: TaskManager API for ALL TODO.json interactions (create, update, delete, modify, reorder)
**❌ ABSOLUTELY FORBIDDEN**: Any write operations directly to TODO.json file
**❌ ABSOLUTELY FORBIDDEN**: fs.readFileSync/writeFileSync on TODO.json for modifications
**❌ ABSOLUTELY FORBIDDEN**: require('./TODO.json') for any mutations
**❌ ABSOLUTELY FORBIDDEN**: JSON.parse/JSON.stringify operations that modify TODO.json
**❌ ABSOLUTELY FORBIDDEN**: Any direct file manipulation beyond reading for inspection

**GOLDEN RULE**: TODO.json is READ-ONLY as a file. ALL modifications MUST go through TaskManager API.

**ALWAYS USE THESE COMMANDS INSTEAD:**
```bash
# AGENT INITIALIZATION (MANDATORY FIRST STEP) - ALWAYS use universal script
node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/tm-universal.js" init --project [PROJECT_DIRECTORY]

# UPDATE TASK STATUS (SIMPLIFIED)
node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/tm-universal.js" update task_id completed "Optional completion notes" --project [PROJECT_DIRECTORY]

# Read TODO.json data
node -e "const TaskManager = require('/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager'); const tm = new TaskManager('[PROJECT_DIRECTORY]/TODO.json'); tm.readTodo().then(data => console.log(JSON.stringify(data, null, 2)));"

# Get current task
node -e "const TaskManager = require('/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager'); const tm = new TaskManager('[PROJECT_DIRECTORY]/TODO.json'); tm.getCurrentTask('agent_id').then(task => console.log(JSON.stringify(task, null, 2)));"

# List all tasks
node -e "const TaskManager = require('/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager'); const tm = new TaskManager('[PROJECT_DIRECTORY]/TODO.json'); tm.readTodo().then(data => console.log(JSON.stringify(data.tasks, null, 2)));"

# Create new task
node -e "const TaskManager = require('/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager'); const tm = new TaskManager('[PROJECT_DIRECTORY]/TODO.json'); tm.createTask({title: 'Task name', mode: 'DEVELOPMENT'}).then(id => console.log('Created:', id));"
```

## 🚨 ROOT FOLDER ORGANIZATION POLICY

**MANDATORY ROOT FOLDER CLEANLINESS:**
- **KEEP ROOT FOLDER CLEAN** - Only essential project files in root directory
- **REPORTS AND DOCUMENTATION** → `development/reports/` directory
- **ANALYSIS FILES** → `development/reports/` directory  
- **VALIDATION EVIDENCE** → `development/reports/` directory
- **RESEARCH REPORTS** → `development/research-reports/` directory (as already established)
- **BACKUP FILES** → `backups/` directory (as already established)

**ALLOWED IN ROOT DIRECTORY:**
- **Core project files**: package.json, README.md, CLAUDE.md, TODO.json, DONE.json
- **Configuration files**: .eslintrc, .gitignore, jest.config.js, etc.
- **Build/deployment files**: Dockerfile, docker-compose.yml, etc.
- **License and legal**: LICENSE, CONTRIBUTING.md, etc.

**FORBIDDEN IN ROOT DIRECTORY:**
- ❌ Analysis reports (move to `development/reports/`)
- ❌ Validation evidence files (move to `development/reports/`)
- ❌ Research documentation (move to `development/research-reports/`)
- ❌ Temporary markdown files (move to `development/reports/`)
- ❌ Backup files (move to `backups/`)
- ❌ Development notes (move to `development/notes/` or `development/reports/`)

**AUTOMATIC FILE ORGANIZATION:**
```bash
# Create proper directory structure
mkdir -p development/reports
mkdir -p development/research-reports  
mkdir -p development/notes

# Move files to appropriate locations
mv *.evidence.md development/reports/
mv *validation*.md development/reports/
mv *analysis*.md development/reports/
mv *report*.md development/reports/
```

**PROJECT DOCUMENTATION:**
- **UPDATE ONLY**: User-facing documentation (API docs, user guides, setup instructions, troubleshooting)
- **SKIP**: Internal implementation details, development processes not affecting users
- **ORGANIZE**: All reports and internal docs in appropriate subdirectories

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

**EXAMPLES:**
```bash
git commit -m "fix: resolve multi-agent processing bottlenecks

- Fixed stop-hook JSON parsing error
- Reactivated multiple agents for concurrent processing  
- Updated validation system to support multiple in_progress tasks
- Verified task distribution across specialized agents

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"
```

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
node -e "const TaskManager = require('/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager'); const tm = new TaskManager('[PROJECT_DIRECTORY]/TODO.json'); tm.updateTaskStatus('task-1', 'completed').then(() => console.log('✅ Task marked as completed'));"

# Alternative: Get current task and mark it completed
node -e "const TaskManager = require('/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager'); const tm = new TaskManager('[PROJECT_DIRECTORY]/TODO.json'); tm.getCurrentTask().then(async (task) => { if (task) { await tm.updateTaskStatus(task.id, 'completed'); console.log('✅ Current task completed:', task.id); } else { console.log('No active task found'); } });"
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

## 🚨 EXECUTION WORKFLOW

**STANDARD APPROACH:**
1. **INSTANT TASK CREATION** - Create task for ANY user request
2. **Evaluate Existing Tasks** - Check if can modify existing vs create new
3. **Think First** - Use appropriate thinking level (think/think hard/ultrathink)
4. **Initialize Agent** - Use TaskManager API initialization
5. **Deploy UP TO 10 Subagents** - Always maximize subagents for complex work with synchronized completion
6. **Implement & Validate** - Execute with evidence-based completion
7. **Complete Tasks** - Mark completed via TaskManager API

**INFINITE CONTINUE HOOK SYSTEM:**
- **Setup**: `node "/.../setup-infinite-hook.js" "/path/to/project"`
- **Coverage**: development (80%), testing/debugging/refactoring (95%)

**INSTANT TASK CREATION RULE:**
User communication → **INSTANT TASK CREATION** → Then execute work

**SETTINGS PROTECTION:** Never modify `/Users/jeremyparker/.claude/settings.json`