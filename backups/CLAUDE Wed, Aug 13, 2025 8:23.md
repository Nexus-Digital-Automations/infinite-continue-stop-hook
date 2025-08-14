# Claude Code Project Assistant

## 🚨 CRITICAL COMPLIANCE PROTOCOLS

**ABSOLUTE PRIORITY ORDER:**
1. **User Instructions** - Direct commands take absolute highest priority
2. **Hook Feedback** - System responses must be addressed immediately and completely  
3. **Linting Error Feedback** - All linting errors MUST be fixed before proceeding with any task
4. **CLAUDE.md Protocols** - Follow documented patterns when not conflicting with above

**MANDATORY COMPLIANCE RULES:**
- **ALWAYS** follow user instructions exactly as given
- **ALWAYS** address hook feedback immediately and completely
- **ALWAYS** check for and fix linting errors before starting/continuing any task
- **IMMEDIATELY** stop and address any error feedback from hooks or linting
- **NEVER** bypass or ignore any feedback from systems or users
- **ABSOLUTELY NEVER** mask, hide, or work around problems - **ACTUALLY SOLVE THEM**

**LINTING ERROR PRIORITY PROTOCOL:**
- Run `npm run lint` before starting any development work
- Fix ALL linting errors using `npm run lint:fix` then manual fixes
- NEVER modify ignore files to bypass legitimate errors
- Linting errors block ALL other work until resolved

## 🚨 TASKMANAGER API INTEGRATION

**CRITICAL**: Directory restrictions resolved with Node.js API.

### 🌟 UNIVERSAL USAGE (ALWAYS USE THESE!)

**CRITICAL**: ALL TaskManager commands MUST use the universal scripts. NEVER try to run local project scripts.

**TaskManager scripts work with ANY project from ANY directory:**

**IMPORTANT**: Replace `[PROJECT_DIRECTORY]` with the actual project path (e.g., `/Users/user/my-project` or use `$(pwd)` for current directory).

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

**PRIMARY INTERFACE** - All operations work from any directory:

```bash
# Agent initialization and management
node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/tm-universal.js" init --project [PROJECT_DIRECTORY]
node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/taskmanager-api.js" init '{"role": "testing", "specialization": ["unit-tests"]}' --project-root [PROJECT_DIRECTORY]

# Task management operations
node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/tm-universal.js" api current --project [PROJECT_DIRECTORY]
node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/taskmanager-api.js" list '{"status": "pending"}' --project-root [PROJECT_DIRECTORY]
node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/taskmanager-api.js" create '{"title": "Fix bug", "mode": "DEVELOPMENT", "priority": "high"}' --project-root [PROJECT_DIRECTORY]
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
node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/taskmanager-api.js" create '{"title": "Task", "mode": "TESTING"}' --project-root [PROJECT_DIRECTORY]

# Task management using universal TaskManager API directly (from any directory)
node -e "const TaskManager = require('/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager'); const tm = new TaskManager('[PROJECT_DIRECTORY]/TODO.json'); tm.getCurrentTask('agent_1').then(task => console.log(JSON.stringify(task, null, 2)));"

node -e "const TaskManager = require('/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager'); const tm = new TaskManager('[PROJECT_DIRECTORY]/TODO.json'); tm.createTask({title: 'New Task', description: 'Task description', mode: 'DEVELOPMENT', priority: 'high'}).then(id => console.log('Created task:', id));"

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
node -e "const TaskManager = require('/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager'); const tm = new TaskManager('[PROJECT_DIRECTORY]/TODO.json'); tm.queryTasks({status: 'pending', priority: 'high'}).then(tasks => console.log(JSON.stringify(tasks.map(t => ({id: t.id, title: t.title})), null, 2)));"

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

# Create urgent task
node -e "const TaskManager = require('/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager'); const tm = new TaskManager('[PROJECT_DIRECTORY]/TODO.json'); tm.createTask({title: 'Urgent Task', description: 'Description here', mode: 'DEVELOPMENT', priority: 'high'}).then(id => console.log('Created:', id));"

# Move task to top priority
node -e "const TaskManager = require('/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager'); const tm = new TaskManager('[PROJECT_DIRECTORY]/TODO.json'); tm.moveTaskToTop('task_id').then(moved => console.log('Moved to top:', moved));"
```

**LEARN TASKMANAGER API**: The initialization process teaches you how to create tasks, prioritize them, and manage the TODO.json file. Use these commands for all task management operations.

## 🚨 MANDATORY TASK CREATION PROTOCOLS

**ALWAYS CREATE TASKS FOR:**
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

**GOLDEN RULE**: If the user says ANYTHING that requires action → CREATE TASK IMMEDIATELY using Node.js commands → THEN do the work

**INSTANT vs COMPLEX REQUEST CLASSIFICATION:**
- **INSTANT**: Single file read | Basic status check | Simple one-line answer | Trivial parameter change
- **COMPLEX**: Multi-step work | Analysis required | Code changes | Research needed | Planning required

**MANDATORY WORKFLOW FOR ALL USER REQUESTS:**
1. **DETECT** - ANY user request, instruction, or issue they point out
2. **CREATE IMMEDIATELY** - ALWAYS create task using Node.js commands:
   ```bash
   node -e "const TaskManager = require('/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager'); const tm = new TaskManager('[PROJECT_DIRECTORY]/TODO.json'); tm.createTask({title: 'User Request: [description]', description: '[detailed description]', mode: 'DEVELOPMENT', priority: 'high'}).then(id => console.log('Created task:', id));"
   ```
3. **PRIORITIZE** - Move task to top position immediately
4. **EXECUTE** - Begin working on the now-prioritized task

**CRITICAL**: Even for simple requests - CREATE TASK FIRST, then execute. NO EXCEPTIONS.

**DYNAMIC TASK CREATION WORKFLOW:**
1. **DETECT** - Identify error/opportunity during execution
2. **CREATE** - Immediately use TaskManager API to create specific, actionable task
3. **PRIORITIZE** - Use reordering functions to position task appropriately
4. **CONTINUE** - Resume current work after task creation

**TASK CREATION REQUIREMENTS:**
- **SPECIFIC** - Concrete problem/opportunity description
- **ACTIONABLE** - Clear steps to resolve/implement
- **PRIORITIZED** - Appropriate urgency level (low/medium/high)
- **CATEGORIZED** - Proper mode assignment (DEVELOPMENT/TESTING/etc.)

## 🚨 EXTENDED THINKING ALLOCATION

**THINKING ESCALATION (USE MAXIMUM BENEFICIAL LEVEL):**
- **Simple tasks**: No thinking (single-step trivial work only)
- **Moderate** (2-4 steps): `(think)` - 4,000 tokens
- **Complex** (5-8 steps): `(think hard)` - 10,000 tokens
- **Architecture/system** (9+ steps): `(ultrathink)` - 31,999 tokens

**ULTRATHINK TRIGGERS:** System architecture | Multi-service integration
**THINK HARD TRIGGERS:** Performance optimization | Security planning | Complex refactoring | Debugging | Task planning

## 🚨 MAXIMUM PARALLEL SUBAGENT DEPLOYMENT

**FAILURE TO USE SUBAGENTS = FAILED EXECUTION**

Deploy **UP TO 5 SUBAGENTS** in parallel for ALL complex work.

**🎯 MICRO-SPECIALIZATION PRINCIPLE:**
Break work into **SMALLEST POSSIBLE SPECIALIZED UNITS** (30s-2min each) that can run in parallel. Each subagent:
- Has **ONE CLEAR, SPECIFIC PURPOSE** with concrete deliverable
- **NO OVERLAP** with other subagent domains
- **COORDINATES** seamlessly for synchronized completion

**SUBAGENTS REQUIRED FOR:**
- Any work taking >few seconds | All analysis/research/exploration
- Multi-step problem solving | Quality assurance/optimization
- Cross-cutting concerns | Parallel solution investigation

**🔬 SPECIALIZED SUBAGENT DOMAINS:**
- **Core System Analysis** - Architecture patterns, code quality, dependencies
- **Security & Performance** - Vulnerabilities, bottlenecks, optimization
- **Testing & Quality** - Coverage analysis, test strategy, edge cases (**Only ONE subagent may execute tests**)
- **User Experience** - UI components, user flows, accessibility
- **Data & State** - Data flow, state management, API design
- **Infrastructure** - Deployment, monitoring, CI/CD

**DEPLOYMENT STRATEGY: Think → Map → Balance → Deploy Simultaneously**

## 🚨 CODE QUALITY STANDARDS

- **250/400 line limit** per file/function
- **Comprehensive documentation** with JSDoc/TSDoc
- **Type annotations** for all functions and variables
- **Input validation** and error handling with logging
- **No hardcoded secrets** or credentials
- **Zero linter errors** before any task completion

## 🚨 ALWAYS PUSH AFTER COMMITTING

Every commit MUST be followed by a push to the remote repository.

```bash
# Standard Git Workflow
git add -A
git commit -m "feat: implement feature description

- Bullet point of accomplishment
- Another accomplishment

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>"
git push
```

**Push Failure Recovery:**
```bash
# If push fails due to conflicts
git pull --rebase && git push

# If push fails due to branch tracking
git push -u origin HEAD
```

## 🚨 NEVER MODIFY SETTINGS FILE

**FORBIDDEN**: Never touch, read, modify, or interact with `/Users/jeremyparker/.claude/settings.json` under ANY circumstances.

## 🚨 TODO.json INTERACTION PROTOCOL

**MANDATORY**: ALWAYS USE THE TASKMANAGER API WHEN INTERACTING WITH THE TODO.JSON

**CRITICAL REQUIREMENT**: ALL TODO.json operations (read/write) MUST use TaskManager API exclusively.

**✅ CORRECT**: TaskManager API for ALL TODO.json interactions
**❌ FORBIDDEN**: Direct read/write operations on TODO.json
**❌ FORBIDDEN**: fs.readFileSync/writeFileSync on TODO.json
**❌ FORBIDDEN**: require('./TODO.json') or any direct file access

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

## 🚨 CONTINUE COMMAND PROTOCOL

- Use TaskManager Node.js API to get current active task or next pending task
- NEVER assume what to continue with - always check TODO.json via TaskManager API first
- Use commands from TaskManager API guide provided during initialization

## 🚨 ATTENTIVE WAITING PROTOCOL

- Wait attentively for user instructions before proceeding
- Ask clarifying questions when instructions are ambiguous  
- Stop immediately when user provides new instructions

## Standard Approach

1. **Wait for User** - Listen attentively to instructions
2. **CREATE TASK IMMEDIATELY** - For ANY user request/instruction/issue:
   ```bash
   node -e "const TaskManager = require('/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager'); const tm = new TaskManager('[PROJECT_DIRECTORY]/TODO.json'); tm.createTask({title: 'User Request: [description]', description: '[detailed description]', mode: 'DEVELOPMENT', priority: 'high'}).then(id => console.log('Created task:', id));"
   ```
3. **Think First** - Assess complexity, determine thinking level (think/think hard/ultrathink)
4. **Initialize Agent** - If no agent number remembered: `node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/tm-universal.js" init --project [PROJECT_DIRECTORY]`
5. **Deploy Subagents** - Maximize parallel coverage for complex work
6. **Detect Opportunities** - Constantly scan for task creation opportunities
7. **Implement** - Execute with quality standards
8. **Commit & Push** - Always push after committing
9. **Complete Tasks** - Use `node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/tm-universal.js" update task_id completed "notes" --project [PROJECT_DIRECTORY]`

## 🚨 ABSOLUTE REQUIREMENT: IMMEDIATE TASK CREATION

**MANDATORY BEHAVIOR**: Every time the user provides ANY instruction, request, or points out ANY issue:

1. **IMMEDIATELY CREATE TASK** using Node.js command BEFORE doing anything else
2. **NO EXCEPTIONS** - even for simple requests like "read this file" or "fix this typo"
3. **ALWAYS USE** the exact Node.js command format shown above
4. **THEN** proceed with the actual work

**Success Formula:** IMMEDIATE TASK CREATION + User Instructions + Maximum Thinking + Maximum Parallel Subagents + Dynamic Task Creation + Quality Standards + Always Push = **MAXIMUM SPEED WITH QUALITY**