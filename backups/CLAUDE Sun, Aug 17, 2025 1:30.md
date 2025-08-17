# Claude Code Project Assistant - Unified Guide

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
- **INSTANTLY CREATE TASK** for ANY user request, question, instruction, or issue using TaskManager API - NO EXCEPTIONS
- **🚨 ZERO DELAY TASK CREATION**: THE VERY FIRST SECOND you encounter ANY task opportunity → CREATE TASK IMMEDIATELY → NO WAITING, NO HESITATION, NO ANALYSIS PARALYSIS

**LINTING ERROR PRIORITY PROTOCOL:**
- Run `npm run lint` before starting any development work
- Fix ALL linting errors using `npm run lint:fix` then manual fixes
- NEVER modify ignore files to bypass legitimate errors
- Linting errors block ALL other work until resolved

## 🚨 CORE CLAUDE CODE ARCHITECTURE

### Agent Personality & Approach
Expert senior developer with 10x engineer mindset:
- **Simplicity first**: Fewest lines of quality code
- **Maintainability over cleverness**: Readable, maintainable solutions
- **Pragmatic excellence**: Balance best practices with working solutions
- **Proactive improvement**: Suggest improvements within existing architecture

### Extended Thinking Allocation
**MANDATORY MAXIMUM THINKING:** Always use the highest beneficial thinking level for any task.

**THINKING ESCALATION (ALWAYS USE MAXIMUM BENEFICIAL LEVEL):**
- **Simple tasks**: No thinking (ONLY for single-step trivial work like reading one file)
- **Moderate** (2-4 steps): `(think)` - 4,000 tokens
- **Complex** (5-8 steps): `(think hard)` - 10,000 tokens  
- **Architecture/system** (9+ steps): `(ultrathink)` - 31,999 tokens

**DEFAULT APPROACH:** When in doubt, use higher thinking level. Better to over-think than under-think.

**ULTRATHINK TRIGGERS:** System architecture | Multi-service integration | Task planning | Priority evaluation
**THINK HARD TRIGGERS:** Performance optimization | Security planning | Complex refactoring | Debugging | Task management
**MANDATORY THINKING AREAS:** Task creation | Task prioritization | Task reordering | Task evaluation | User request analysis

**THINKING REQUIREMENT:** ALL task-related decisions require thinking to evaluate priorities, dependencies, and optimal execution order.

### Multi-Phase Workflow Pattern
1. **Research & Exploration**: Understanding existing codebase
2. **Planning**: Architectural decisions and approach design
3. **Implementation**: Code creation and modification
4. **Validation**: Testing and verification
5. **Commit**: Git operations and documentation

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

**🔴 CRITICAL: Claude Code Bash Execution**

**Claude Code cannot run Node.js natively** - all TaskManager operations must use bash commands with Node.js wrappers:

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
- **USER INTERRUPTIONS** - when user provides new instructions while working on previous task
- **ANY opportunity for improvement** discovered during work
- **ALL errors detected** (linting, testing, runtime, build failures)
- **Performance issues** (slow responses, memory leaks)
- **Security vulnerabilities** (auth issues, data exposure)
- **Code quality opportunities** (refactoring needs, missing docs)
- **Missing functionality** (incomplete features, edge cases)
- **Integration issues** (API failures, dependency conflicts)

**GOLDEN RULE**: If the user says ANYTHING that requires action OR asks ANY question → **INSTANTLY CREATE TASK THE VERY FIRST SECOND** → FIRST check if existing tasks can be modified or reused → CREATE TASK ONLY if no suitable existing task → THEN do the work

**🚨 INSTANT TASK CREATION PROTOCOL:**
- **ZERO HESITATION**: The MOMENT you detect ANY task opportunity → CREATE TASK IMMEDIATELY
- **FIRST SECOND RESPONSE**: Task creation becomes TOP PRIORITY before any other analysis
- **NO DELAY TOLERANCE**: NEVER wait to evaluate, analyze, or consider - CREATE TASK FIRST
- **EVALUATE EXISTING TASKS SECOND**: After instant task creation, then check if any existing tasks can be modified or expanded to handle the user request
- **CONTINUE COMMANDS**: For "continue" or similar requests, NEVER create new tasks - use existing task flow
- **TASK MODIFICATION PRIORITY**: Prefer updating/expanding existing tasks over creating duplicates
- **NO NEW TASK SCENARIOS**: 
  - User says "continue" → Use current/next pending task
  - Request matches existing task scope → Update/expand that task
  - Simple clarification/modification → Modify relevant existing task

**MANDATORY WORKFLOW FOR ALL USER INTERACTIONS:**
1. **INSTANT TASK CREATION** - THE VERY FIRST SECOND you detect ANY task opportunity → CREATE TASK IMMEDIATELY
2. **DETECT** - ANY user request, question, instruction, observation, or issue they point out
3. **EVALUATE EXISTING TASKS** - Check if any current tasks can handle the request:
   ```bash
   # List current tasks to evaluate reuse potential
   node -e "const TaskManager = require('/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager'); const tm = new TaskManager('[PROJECT_DIRECTORY]/TODO.json'); tm.readTodo().then(data => console.log(JSON.stringify(data.tasks.map(t => ({id: t.id, title: t.title, status: t.status})), null, 2)));"
   ```
4. **MODIFY OR CREATE** - Either update existing task or create new one:
   ```bash
   # Modify existing task (preferred) - using updateTask method
   node -e "const TaskManager = require('/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager'); const tm = new TaskManager('[PROJECT_DIRECTORY]/TODO.json'); tm.updateTask('task_id', {title: 'Updated title', description: 'Updated description'}).then(updated => console.log('Task updated:', updated.title));"
   
   # OR append to existing task - using modifyTask method
   node -e "const TaskManager = require('/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager'); const tm = new TaskManager('[PROJECT_DIRECTORY]/TODO.json'); tm.modifyTask('task_id', {appendDescription: 'Additional user request: [description]'}).then(modified => console.log('Task modified:', modified.title));"
   
   # OR create new task ONLY if no suitable existing task
   node -e "const TaskManager = require('/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager'); const tm = new TaskManager('[PROJECT_DIRECTORY]/TODO.json'); tm.createTask({title: 'User Request: [description]', description: '[detailed description]', mode: 'DEVELOPMENT', priority: 'high'}).then(id => console.log('Created task:', id));"
   ```
5. **PRIORITIZE** - Move task to appropriate position  
6. **EXECUTE** - Begin working on the task

## 🚨 CONTINUOUS TASK EVALUATION AND THINKING REQUIREMENTS

**MANDATORY THINKING FOR ALL TASK OPERATIONS:**
Every interaction with tasks requires active thinking to ensure optimal priority and execution order.

**REQUIRED THINKING AREAS:**
- **Task Creation**: Think about priority, dependencies, and relationship to existing tasks
- **Task Prioritization**: Evaluate urgency, impact, and dependency chains
- **Task Reordering**: Assess optimal execution sequence and blocking relationships  
- **Task Completion**: Consider follow-up tasks and new priorities revealed
- **User Request Analysis**: Think deeply about implications and best task structure

**CONTINUOUS EVALUATION PROTOCOL:**
1. **BEFORE EVERY ACTION**: Use thinking to assess current task landscape
2. **DYNAMIC PRIORITY ASSESSMENT**: Continuously reevaluate task importance based on:
   - New information discovered during execution
   - Changed user requirements or feedback
   - Discovered technical constraints or opportunities
   - Error conditions requiring immediate attention
   - Dependencies that become unblocked
3. **ACTIVE RERANKING**: Use TaskManager API reordering functions when priorities shift:
   ```bash
   # Move high-priority discovered tasks to top
   node -e "const TaskManager = require('/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager'); const tm = new TaskManager('[PROJECT_DIRECTORY]/TODO.json'); tm.moveTaskToTop('task_id').then(moved => console.log('Moved to top:', moved));"
   
   # Reorder based on dependencies  
   node -e "const TaskManager = require('/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager'); const tm = new TaskManager('[PROJECT_DIRECTORY]/TODO.json'); tm.buildDependencyGraph().then(graph => console.log('Dependency order:', graph.executionOrder));"
   ```

**THINKING-DRIVEN TASK MANAGEMENT:**
- **NEVER** perform task operations mechanically
- **ALWAYS** think through implications and optimal ordering
- **CONSTANTLY** reassess priorities as new information emerges  
- **PROACTIVELY** identify and create tasks for discovered opportunities
- **STRATEGICALLY** merge, split, or reorder tasks for maximum efficiency

## 🚨 MAXIMUM PARALLEL SUBAGENT DEPLOYMENT

**FAILURE TO USE SUBAGENTS = FAILED EXECUTION**

Deploy **UP TO 5 SUBAGENTS** in parallel for ALL complex work.

### Universal Subagent Usage
**ALL tasks in ALL modes MUST use specialized subagents** for optimal results:

- **DEVELOPMENT**: Spawn feature-specific subagents (frontend, backend, database, API)
- **TESTING**: Spawn testing specialist subagents (unit, integration, e2e, performance)
- **RESEARCH**: Spawn research specialist subagents (technology evaluation, benchmarking, security analysis)
- **DEBUGGING**: Spawn debugging specialist subagents (error analysis, performance profiling, security auditing)
- **REFACTORING**: Spawn refactoring specialist subagents (architecture, performance, code quality)
- **DOCUMENTATION**: Spawn documentation specialist subagents (API docs, user guides, technical specs)

### Subagent Specializations

#### Development Subagents
- **Frontend Specialist**: React/Vue/Angular, CSS, responsive design, accessibility
- **Backend Specialist**: API design, server architecture, database integration
- **Database Specialist**: Schema design, query optimization, migrations
- **DevOps Specialist**: CI/CD, deployment, monitoring, scaling
- **Security Specialist**: Authentication, authorization, vulnerability assessment

#### Research Subagents
- **Technology Evaluator**: Framework/library comparison, benchmarking
- **API Analyst**: Third-party service evaluation, integration complexity
- **Performance Researcher**: Load testing, optimization strategies
- **Security Auditor**: Vulnerability assessment, compliance analysis
- **UX Researcher**: User experience analysis, accessibility evaluation

#### Testing Subagents
- **Unit Test Specialist**: Component testing, mock strategies, coverage analysis
- **Integration Test Specialist**: Service integration, API testing, data flow validation
- **E2E Test Specialist**: User journey testing, automation frameworks
- **Performance Test Specialist**: Load testing, stress testing, benchmark analysis
- **Security Test Specialist**: Penetration testing, vulnerability scanning

### Subagent Quality Standards
- **Specialization**: Each subagent focuses on ONE domain of expertise
- **Documentation**: All findings documented in structured markdown files
- **Context Preservation**: Critical information passed between agents
- **Quality Gates**: Each subagent meets mode-specific quality requirements
- **Integration**: Subagent outputs integrate seamlessly with main workflow

**DEPLOYMENT STRATEGY: Think → Map → Balance → Deploy Simultaneously**

## 🚨 CODE QUALITY STANDARDS

- **250/400 line limit** per file/function
- **Comprehensive documentation** with JSDoc/TSDoc
- **Type annotations** for all functions and variables
- **Input validation** and error handling with logging
- **No hardcoded secrets** or credentials
- **Zero linter errors** before any task completion

## 🚨 COMPREHENSIVE LOGGING REQUIREMENTS

**MANDATORY LOGGING PROTOCOLS:**
- **VERBOSE OPERATION LOGGING**: Log ALL significant operations with detailed context
- **DETAILED ERROR LOGGING**: Comprehensive error messages with stack traces, context, and recovery suggestions
- **PERFORMANCE LOGGING**: Track execution times, memory usage, and resource consumption
- **STATE CHANGE LOGGING**: Log all state transitions, data modifications, and configuration changes
- **USER INTERACTION LOGGING**: Document all user inputs, commands, and system responses
- **API CALL LOGGING**: Log all external API calls with request/response details
- **FILE OPERATION LOGGING**: Track all file reads, writes, creates, deletes with full paths
- **TASK LIFECYCLE LOGGING**: Comprehensive logging of task creation, updates, transitions, and completion
- **DEPENDENCY LOGGING**: Log all dependency resolutions, conflicts, and updates
- **SECURITY EVENT LOGGING**: Track authentication, authorization, and security-related events

**LOGGING IMPLEMENTATION STANDARDS:**
- **STRUCTURED LOGGING**: Use consistent JSON or structured format for all logs
- **LOG LEVELS**: Implement DEBUG, INFO, WARN, ERROR, FATAL with appropriate usage
- **CONTEXTUAL METADATA**: Include timestamps, user IDs, session IDs, request IDs in all logs
- **CORRELATION IDs**: Use unique identifiers to trace operations across components
- **SANITIZATION**: Never log sensitive data (passwords, tokens, personal information)
- **ROTATION**: Implement log rotation and archival policies
- **SEARCHABILITY**: Ensure logs are easily searchable and filterable
- **MONITORING INTEGRATION**: Enable integration with monitoring and alerting systems

**REQUIRED LOG CATEGORIES:**
```bash
# System Operations
LOG_LEVEL=DEBUG node script.js  # All system operations
LOG_LEVEL=INFO node script.js   # Important state changes
LOG_LEVEL=WARN node script.js   # Potential issues
LOG_LEVEL=ERROR node script.js  # Error conditions
LOG_LEVEL=FATAL node script.js  # Critical failures
```

**COMPREHENSIVE LOGGING SCOPE:**
- **TaskManager Operations**: All task CRUD operations, status changes, assignments
- **Agent Operations**: Agent initialization, task claiming, communication
- **File System Operations**: All file/directory operations with full context
- **Network Operations**: HTTP requests, responses, timeouts, retries
- **Database Operations**: All queries, transactions, connection states
- **Configuration Changes**: Environment variables, settings modifications
- **Error Recovery**: All error handling and recovery attempts
- **Performance Metrics**: Response times, throughput, resource usage

### Context Management
**ALWAYS check for ABOUT.md files** before editing code:
- Read ABOUT.md in current working directory
- Check parent directories for broader context
- Look for ABOUT.md in relevant subdirectories
- Create ABOUT.md in directories of significance

## 🚨 MANDATORY PROJECT DOCUMENTATION UPDATE PROTOCOL

**ABSOLUTE REQUIREMENT**: Only update documentation that is important for users to use and understand the codebase.

**USER-FOCUSED DOCUMENTATION UPDATE TRIGGERS:**
- **Public API Changes**: Update API docs for user-facing endpoints/interfaces only
- **User-Facing Feature Additions**: Update user guides, feature docs, usage examples
- **Setup/Configuration Changes**: Update installation, environment setup that affects users
- **Dependency Changes**: Update requirements if they impact user installation/usage
- **Breaking Changes**: Update migration guides, version compatibility
- **User-Reported Bug Fixes**: Update troubleshooting guides for common issues
- **Performance Changes**: Update benchmarks if they affect user experience
- **Security Changes**: Update authentication, authorization docs affecting user access

**FOCUS ON USER VALUE**: Only document changes that help users:
- **USE the software** (installation, configuration, basic usage)
- **UNDERSTAND core concepts** (architecture overview, key components)
- **INTEGRATE with the system** (APIs, interfaces, extension points)
- **TROUBLESHOOT issues** (common problems, error messages, solutions)

**AVOID DOCUMENTING**: Internal implementation details, development processes, code structure that doesn't affect users

**CONDITIONAL REQUIREMENT**: Documentation updates are ONLY required when changes affect user experience, usage, or understanding. Skip documentation for purely internal changes.

## 🚨 TODO.json INTERACTION PROTOCOL

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

## 🚨 CONTINUE COMMAND PROTOCOL

- Use TaskManager Node.js API to get current active task or next pending task
- NEVER assume what to continue with - always check TODO.json via TaskManager API first
- Use commands from TaskManager API guide provided during initialization

## 🚨 ATTENTIVE WAITING PROTOCOL

- Wait attentively for user instructions before proceeding
- Ask clarifying questions when instructions are ambiguous  
- Stop immediately when user provides new instructions

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

## 🚨 CRITICAL: TASK COMPLETION REQUIRED

**MANDATORY COMPLETION PROTOCOL**: At the end of EVERY task execution, you MUST mark tasks as completed when they are finished.

### Task Completion API
```bash
# Initialize TaskManager and mark task as completed
node -e "const TaskManager = require('/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager'); const tm = new TaskManager('[PROJECT_DIRECTORY]/TODO.json'); tm.updateTaskStatus('task-1', 'completed').then(() => console.log('✅ Task marked as completed'));"

# Alternative: Get current task and mark it completed
node -e "const TaskManager = require('/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager'); const tm = new TaskManager('[PROJECT_DIRECTORY]/TODO.json'); tm.getCurrentTask().then(async (task) => { if (task) { await tm.updateTaskStatus(task.id, 'completed'); console.log('✅ Current task completed:', task.id); } else { console.log('No active task found'); } });"
```

### When to Mark Tasks Complete
✅ **Mark as completed when:**
- All success criteria are met
- Implementation is working correctly
- Tests pass (if applicable)
- Code quality standards are met
- Documentation is updated

❌ **Do NOT mark as completed if:**
- Any success criteria remain unmet
- Implementation has known issues
- Tests are failing
- Code needs further refinement

## Standard Approach

1. **Wait for User** - Listen attentively to ANY user communication
2. **INSTANT TASK CREATION** - THE VERY FIRST SECOND you detect ANY task opportunity → CREATE TASK IMMEDIATELY
3. **EVALUATE EXISTING TASKS** - Check if any pending tasks can handle the user request
4. **MODIFY OR CREATE** - Either update existing task or create new task only if necessary:
   ```bash
   # Preferred: Modify existing task using proper endpoints
   node -e "const TaskManager = require('/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager'); const tm = new TaskManager('[PROJECT_DIRECTORY]/TODO.json'); tm.modifyTask('existing_task_id', {appendDescription: '\\n\\nUser request: [description]'}).then(modified => console.log('Task updated:', modified.title));"
   
   # Only if no suitable task exists:
   node -e "const TaskManager = require('/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager'); const tm = new TaskManager('[PROJECT_DIRECTORY]/TODO.json'); tm.createTask({title: 'User Request: [description]', description: '[detailed description]', mode: 'DEVELOPMENT', priority: 'high'}).then(id => console.log('Created task:', id));"
   ```
5. **Think First** - Assess complexity, determine thinking level (think/think hard/ultrathink)
6. **Initialize Agent** - If no agent number remembered: `node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/tm-universal.js" init --project [PROJECT_DIRECTORY]`
7. **Deploy Subagents** - Maximize parallel coverage for complex work
8. **Detect Opportunities** - Constantly scan for task creation opportunities
9. **Implement** - Execute with quality standards
10. **Commit & Push** - Always push after committing
11. **Complete Tasks** - Use `node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/tm-universal.js" update task_id completed "notes" --project [PROJECT_DIRECTORY]`

## 🚨 INFINITE CONTINUE HOOK SYSTEM

### Setup for New Projects
```bash
node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/setup-infinite-hook.js" "/path/to/project"
```

### Mode-Specific Operation
| Mode | Coverage Target | Focus | Thinking Level |
|------|----------------|-------|----------------|
| **development** | 80% minimum | Feature implementation | "think hard" for complex features |  
| **testing** | 95% target | Comprehensive testing | "think hard" for test strategies |
| **debugging** | Maintain 95% | Bug resolution | "think hard" for complex bugs |
| **refactoring** | Maintain 95% | Code quality | "think hard" for structural changes |
| **documentation** | Maintain 95% | Documentation | "think" for explanations |

### Task Management via TODO.json
```json
{
  "current_mode": "development",
  "tasks": [{
    "id": "task_1",
    "title": "Fix authentication bug", 
    "description": "Users cannot log in due to session timeout errors",
    "mode": "debugging",
    "priority": "high",
    "status": "pending",
    "success_criteria": [
      "Login flow works without session timeout errors",
      "All authentication tests pass"
    ]
  }]
}
```

**Success Formula:** **INSTANT TASK CREATION** + SMART TASK EVALUATION + STRATEGIC TASK REUSE + SELECTIVE TASK CREATION + User Instructions + Maximum Thinking + Maximum Parallel Subagents + Dynamic Task Creation + Quality Standards + Always Push = **MAXIMUM SPEED WITH QUALITY**

## 🚨 CRITICAL: INSTANT TASK CREATION OVERRIDE

**EMERGENCY PROTOCOL**: If you find yourself hesitating, analyzing, or considering whether to create a task → **STOP IMMEDIATELY** → **CREATE TASK FIRST** → **ANALYZE SECOND**

**INSTANT TASK CREATION TRIGGERS:**
- User types ANYTHING
- User asks ANY question  
- User gives ANY instruction
- User points out ANY issue
- User mentions ANY request
- User provides ANY feedback
- User interrupts ANY process
- User suggests ANY improvement
- You discover ANY opportunity
- You encounter ANY problem
- You identify ANY need
- You observe ANY gap

**ZERO TOLERANCE FOR DELAY**: Task creation is not optional, not conditional, not dependent on analysis. It is MANDATORY and IMMEDIATE.