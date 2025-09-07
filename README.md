# Simplified TaskManager API and Stop Hook System

A streamlined task management and infinite continue hook system designed for Claude Code AI agent workflows.

## ✅ System Status: Production Ready

- **🎭 Professional Validation**: Drama-reduced professional messaging system
- **🌍 Universal Compatibility**: Works on any project/codebase with absolute paths  
- **♾️ True Infinite Operation**: No timing-based stops, optimized for multi-agent processing
- **🔧 JSON Corruption Prevention**: Robust prevention of TODO.json corruption with automatic recovery

## Features

- **Three-Section Priority System**: ERROR → FEATURE → REVIEW task organization ensures critical issues are handled first
- **Intelligent Error Prioritization**: Linter errors, build failures, and critical issues bypass all other ordering
- **Simplified Autonomous Architecture**: Agents receive clear TaskManager API instructions without complex coordination
- **Multi-Agent Concurrency**: Multiple agents can work simultaneously using thread-safe task operations
- **Automatic Task Categorization**: Tasks are automatically organized into appropriate sections based on category and content
- **Intelligent Task Creation**: 3-attempt task creation cycle when no work is available
- **TaskManager API Integration**: Direct API commands for autonomous task management
- **True Infinite Operation**: Runs continuously while tasks exist, stops only when project is complete
- **Thread-Safe Operations**: Concurrent agents can claim and work on tasks without conflicts

## Error Priority System

The system implements a **three-section priority architecture** that automatically organizes tasks for optimal development workflow:

### 🚨 Section 1: ERROR TASKS (Highest Priority)
- `linter-error` - Code style and linting violations
- `build-error` - Compilation and build failures  
- `start-error` - Application startup failures
- `test-error` - Test execution failures

### 🎯 Section 2: FEATURE TASKS (Middle Priority)  
- `enhancement` - New features and improvements
- `missing-feature` - Required functionality gaps
- `documentation` - Project documentation
- `refactor` - Code quality improvements

### ✅ Section 3: REVIEW TASKS (Lowest Priority)
- `missing-test` - Required test coverage
- `test-setup` - Test framework configuration  
- `test-performance` - Performance testing
- `test-feature` - Feature validation tests

### Key Benefits
- **Quality First**: Critical errors are resolved before new development
- **Automatic Organization**: Tasks are placed in correct sections automatically
- **Clear Priorities**: Developers know exactly what to work on next
- **Multi-Agent Ready**: Multiple agents can work efficiently without conflicts

📚 **Error Priority System**: The system automatically sorts tasks by ID prefix (error_ > feature_ > subtask_ > test_) ensuring critical issues are resolved first.

## Installation

### Option 1: Global Configuration (Recommended)

1. Clone this repository to your local machine:
```bash
git clone <repository-url>
cd infinite-continue-stop-hook
```

2. Configure the hook for your project:
```bash
cd /path/to/your/project
node /path/to/infinite-continue-stop-hook/setup-infinite-hook.js /path/to/infinite-continue-stop-hook
```

### Manual Configuration

You can also manually configure the hook by:
```bash
# Initialize TaskManager for your project
cd /path/to/your/project  
node /path/to/infinite-continue-stop-hook/taskmanager-api.js init
```

## What Gets Configured

### Global Configuration (`~/.claude/settings.json`)
- Adds the stop hook to run for ALL Claude Code projects
- Hook triggers whenever Claude Code stops in any project
- Only runs if project has a TODO.json file

### Project Configuration (`<project>/.claude/settings.json`)
- Project-specific hook configuration (optional if globally configured)
- Can override or disable global hooks

### Project Files (`<project>/TODO.json`)
- Task list and progress tracking
- Task creation attempt tracking
- Must exist for hook to activate

## Quick Start: Error Priority System

### Creating Error Tasks (Highest Priority)
```bash
# Linter error - gets absolute priority
node taskmanager-api.js create-error '{"title": "Fix ESLint errors", "category": "linter-error"}'

# Build error - blocks all feature work  
node taskmanager-api.js create-error '{"title": "Fix TypeScript compilation", "category": "build-error"}'
```

### Creating Feature Tasks (Middle Priority)
```bash
# Enhancement task - runs after errors cleared
node -e 'const tm = require("./lib/taskManager"); new tm("./TODO.json").createTask({
  title: "Add search functionality", 
  category: "enhancement"
});'
```

### Creating Review Tasks (Lowest Priority)  
```bash
# Test task - automatically goes to review section
node -e 'const tm = require("./lib/taskManager"); new tm("./TODO.json").createTask({
  title: "Add unit tests for search", 
  category: "missing-test"
});'
```

### Task Claiming Priority Order
```bash
# 1. Agents first get ERROR tasks
node taskmanager-api.js claim [error-task-id] [agent-id]

# 2. Then FEATURE tasks (after errors clear)  
node taskmanager-api.js claim [feature-task-id] [agent-id]

# 3. Finally REVIEW tasks (after features complete)
node taskmanager-api.js claim [review-task-id] [agent-id]
```

## Usage

Once set up, the stop hook runs automatically when Claude Code finishes responding. The system will:

1. Check if TODO.json exists in the project
2. Analyze current task status (pending, in-progress, completed)
3. Provide appropriate instructions:
   - **Tasks Available**: TaskManager API commands for autonomous task management
   - **No Tasks**: Task creation mode (up to 3 attempts)
   - **3 Failed Attempts**: Allow stop (project complete)

### Autonomous Task Management Commands

The stop hook provides these ready-to-use bash commands:

```bash
# 1. CHECK YOUR CURRENT TASK:
node -e "const TaskManager = require('./lib/taskManager'); const tm = new TaskManager('./TODO.json'); tm.getCurrentTask().then(task => console.log(task ? JSON.stringify(task, null, 2) : 'No active task'));"

# 2. GET NEXT PENDING TASK:
node -e "const TaskManager = require('./lib/taskManager'); const tm = new TaskManager('./TODO.json'); tm.getNextPendingTask().then(task => console.log(task ? JSON.stringify(task, null, 2) : 'No pending tasks'));"

# 3. CHECK TASK STATUS OVERVIEW:
node -e "const TaskManager = require('./lib/taskManager'); const tm = new TaskManager('./TODO.json'); tm.getTaskStatus().then(status => console.log(JSON.stringify(status, null, 2)));"

# 4. UPDATE TASK STATUS (when completed):
node -e "const TaskManager = require('./lib/taskManager'); const tm = new TaskManager('./TODO.json'); tm.updateTaskStatus('[TASK_ID]', 'completed', 'Task completed successfully').then(() => console.log('Task marked as completed'));"

# 5. CREATE NEW TASK (if needed):
node -e "const TaskManager = require('./lib/taskManager'); const tm = new TaskManager('./TODO.json'); tm.createTask({title: '[TASK_TITLE]', description: '[DESCRIPTION]', mode: 'DEVELOPMENT', category: '[CATEGORY]'}).then(id => console.log('Created task:', id));"
```

### Autonomous Workflow

1. Run bash command #1 to check if you have an active task
2. If no active task, run bash command #2 to get next pending task  
3. Work on the task using your normal tools and processes
4. When complete, run bash command #4 to mark it as completed
5. Run bash command #3 to check overall status and see if more work is available

### TODO.json Structure

```json
{
  "project": "my-project",
  "tasks": [
    {
      "id": "task-1",
      "title": "Fix linter errors in taskManager.js",
      "description": "Resolve ESLint violations and code style issues",
      "mode": "DEVELOPMENT", 
      "category": "linter-error",
      "priority": "critical",
      "status": "pending",
      "dependencies": [],
      "important_files": ["lib/taskManager.js"],
      "success_criteria": ["All linting passes without errors"],
      "estimate": "30 minutes",
      "requires_research": false,
      "subtasks": [],
      "created_at": "2025-01-01T00:00:00.000Z"
    }
  ],
  "task_creation_attempts": {
    "count": 0,
    "last_attempt": null,
    "max_attempts": 3
  },
  "current_task_index": 0,
  "last_mode": null
}
```

### Task Fields

- `id`: Unique identifier for the task
- `title`: Brief title of the task
- `description`: Detailed description of what needs to be done
- `mode`: One of: DEVELOPMENT, TESTING, RESEARCH, etc.
- `category`: Task category for automatic prioritization (research, linter-error, bug, etc.)
- `priority`: Task priority (low, medium, high, critical)
- `status`: pending, in_progress, or completed
- `dependencies`: Files/directories the task depends on
- `important_files`: Files to read before starting
- `success_criteria`: Validation commands to run
- `estimate`: Time estimate for the task
- `requires_research`: Boolean indicating if research is needed first
- `subtasks`: Array of subtasks
- `created_at`: Timestamp when task was created

## Task Categories and Prioritization

Tasks are automatically sorted by category priority:

### Highest Priority
- **research** - Investigation, exploration, or learning tasks

### Critical Errors (Block All Work)
- **linter-error** - Code style, formatting, or quality issues
- **build-error** - Compilation, bundling, or build process failures  
- **start-error** - Application startup or runtime launch failures
- **error** - General runtime errors or system failures

### High Priority
- **missing-feature** - Required functionality that needs implementation

### Standard Priority
- **bug** - Incorrect behavior that needs fixing
- **enhancement** - Improvements to existing features
- **refactor** - Code restructuring or optimization
- **documentation** - Documentation updates or creation

### Low Priority
- **chore** - Maintenance tasks or administrative work

### Lowest Priority (All Testing Related)
- **missing-test** - Test coverage gaps
- **test-setup** - Test environment configuration
- **test-refactor** - Test code improvements
- **test-performance** - Performance testing
- **test-linter-error** - Linting issues in test files
- **test-error** - Failing tests or test framework issues
- **test-feature** - New testing features or tooling

## Multi-Agent Architecture

### Concurrent Processing
- Multiple agents can work simultaneously on different tasks
- Thread-safe task claiming prevents conflicts
- Each agent operates autonomously using TaskManager API commands

### Task Creation Mode
When no tasks are available:
1. **Attempt 1-3**: System enters task creation mode
2. **Analysis Instructions**: Agents receive guidance on what to analyze
3. **Task Creation**: Agents can create new tasks if work is identified
4. **Automatic Stop**: After 3 failed attempts, system concludes project is complete

### True Infinite Operation
- Runs continuously while tasks are available (pending or in_progress)
- Only stops when no tasks exist and 3 task creation attempts fail
- Designed for multi-agent concurrent processing

## Advanced Features

### Autonomous Task Methods
- `getCurrentTask()`: Find any in-progress task to continue
- `getNextPendingTask()`: Thread-safe claiming of next available task
- `getTaskStatus()`: Overview of project task pipeline

### Task Creation Guidance
When in task creation mode, agents receive instructions to analyze:
- Missing features or functionality
- Code quality improvements needed
- Documentation gaps
- Test coverage requirements
- Performance optimizations

### Quality Categories
Tasks are automatically categorized and prioritized to ensure:
- Critical errors are fixed first (linting, builds, runtime errors)
- Research tasks get highest priority for knowledge building
- Testing tasks are handled last to avoid blocking development

## Configuration Management

### To Disable Globally
Edit `~/.claude/settings.json` and remove the stop hook configuration.

### To Disable for Specific Project
Create/edit `<project>/.claude/settings.json` with an empty hooks configuration:
```json
{
  "hooks": {
    "Stop": []
  }
}
```

### To Check Current Configuration
```bash
# View global configuration
cat ~/.claude/settings.json

# View project configuration
cat .claude/settings.json

# Test the hook
node /path/to/infinite-continue-stop-hook/test-hook.js
```

## Troubleshooting

### Common Issues

1. **Hook not triggering**: 
   - Check `~/.claude/settings.json` for global configuration
   - Ensure TODO.json exists in project root
   - Verify hook path is correct in settings

2. **TODO.json not found**: Run the setup script in your project directory

3. **TaskManager API errors**: 
   - Ensure lib/taskManager.js exists and is accessible
   - Check that TODO.json has proper structure
   - Verify Node.js can require the TaskManager module

4. **Hook runs in unwanted projects**: 
   - Either remove global configuration
   - Or add project-specific override in `.claude/settings.json`

### Manual Hook Testing
```bash
echo '{"session_id":"test","transcript_path":"test.jsonl","hook_event_name":"Stop","stop_hook_active":false}' | node /path/to/stop-hook.js
```

### TaskManager API Testing
```bash
# Test task status
node -e "const TaskManager = require('./lib/taskManager'); const tm = new TaskManager('./TODO.json'); tm.getTaskStatus().then(status => console.log(JSON.stringify(status, null, 2)));"

# Test current task retrieval
node -e "const TaskManager = require('./lib/taskManager'); const tm = new TaskManager('./TODO.json'); tm.getCurrentTask().then(task => console.log(task ? JSON.stringify(task, null, 2) : 'No active task'));"
```

## JSON Corruption Prevention System

The system includes robust protection against TODO.json corruption:

### 🛡️ Prevention Mechanisms
- **Double-Encoding Detection**: Automatically detects and prevents JSON double-encoding
- **Atomic Write Operations**: Thread-safe file operations prevent corruption during writes
- **Validation Layers**: Multiple validation checks before any file modifications
- **Automatic Recovery**: Stop hook integration with autoFixer for corruption detection

### 🔧 AutoFixer Integration
- **Real-time Detection**: Identifies escaped JSON strings and formatting issues
- **Automatic Repair**: Fixes double-encoded content and malformed JSON
- **Backup Creation**: Maintains backups during repair operations
- **Validation**: Ensures repaired JSON is properly formatted

### ✅ Validation Results
The corruption prevention system has been tested with:
- ✅ TaskManager Write Operations (PASS)  
- ✅ Stop Hook Integration (PASS)
- ✅ Atomic Write Prevention (PASS)  
- ✅ AutoFixer Corruption Detection (PASS)

## Contributing

To extend the system:
1. Add new task categories to the priority system
2. Enhance TaskManager API with additional methods  
3. Improve task creation guidance and analysis
4. Add new validation criteria for task completion

## License

MIT License - See LICENSE file for details