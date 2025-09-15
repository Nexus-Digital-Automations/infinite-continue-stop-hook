# TaskManager API Usage Guide - Error Prevention

## 🚨 CRITICAL REQUIREMENTS

### Required Fields for Task Creation
**MANDATORY**: All task creation MUST include these fields:
- `title` (string) - Task name/summary
- `description` (string) - Detailed task description  
- `category` (string) - Task classification

### Valid Category Values
**ONLY THESE VALUES ARE ACCEPTED:**
- `error` - System errors, linter violations, build failures (Priority 1)
- `feature` - New functionality, enhancements, refactoring (Priority 2)  
- `subtask` - Implementation of specific subtasks (Priority 3)
- `test` - Test coverage, test creation (Priority 4)

## ✅ CORRECT API USAGE PATTERNS

### Task Creation Template
```bash
# ALWAYS use this exact format:
timeout 10s node /Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js create '{"title":"[Task Name]", "description":"[Detailed Description]", "category":"[error|feature|subtask|test]"}'
```

### Real Examples
```bash
# Error task (highest priority)
timeout 10s node /Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js create '{"title":"Fix ESLint violations in auth.js", "description":"Resolve 5 linting errors: unused imports, missing semicolons", "category":"error"}'

# Feature task
timeout 10s node /Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js create '{"title":"Add dark mode toggle", "description":"Implement theme switching functionality with localStorage persistence", "category":"feature"}'

# Subtask
timeout 10s node /Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js create '{"title":"Implement login form validation", "description":"Add client-side validation for email format and password strength", "category":"subtask"}'

# Test task
timeout 10s node /Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js create '{"title":"Add UserService unit tests", "description":"Create comprehensive test coverage for authentication methods", "category":"test"}'
```

## ❌ COMMON ERRORS TO AVOID

### Error #1: Missing Category Field
```bash
# ❌ WRONG - Will fail with "Required field 'category' is missing"
timeout 10s node /Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js create '{"title":"Fix UI", "description":"Modern design"}'

# ✅ CORRECT - Include category field
timeout 10s node /Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js create '{"title":"Fix UI", "description":"Modern design", "category":"feature"}'
```

### Error #2: Using Old task_type Field
```bash
# ❌ WRONG - Old API used task_type (no longer valid)
timeout 10s node /Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js create '{"title":"Task", "task_type":"feature"}'

# ✅ CORRECT - Current API uses category
timeout 10s node /Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js create '{"title":"Task", "description":"Details", "category":"feature"}'
```

### Error #3: Invalid Category Values
```bash
# ❌ WRONG - Invalid category values
"category":"bug"        # Use "error" instead
"category":"enhancement" # Use "feature" instead
"category":"task"       # Use "feature", "subtask", or appropriate category

# ✅ CORRECT - Valid categories only
"category":"error"      # For bugs, linter errors, build failures
"category":"feature"    # For new functionality, enhancements
"category":"subtask"    # For implementation components
"category":"test"       # For testing tasks
```

### Error #4: Using Non-existent Commands
```bash
# ❌ WRONG - Delete command doesn't exist in CLI interface
timeout 10s node /Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js delete task_123

# ✅ CORRECT - Use completion instead of deletion
timeout 10s node /Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js complete task_123
```

## 🔧 AVAILABLE CLI COMMANDS

### Core Commands
```bash
# Get API guide and documentation
timeout 10s node /Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js guide

# Initialize agent (required first step)
timeout 10s node /Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js init

# List all tasks
timeout 10s node /Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js list

# Create task (with required fields)
timeout 10s node /Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js create '{"title":"...", "description":"...", "category":"..."}'

# Claim task (requires agent ID)
timeout 10s node /Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js claim <taskId> <agentId>

# Complete task
timeout 10s node /Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js complete <taskId>

# Get agent status
timeout 10s node /Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js status <agentId>
```

### Commands NOT Available in CLI
- `delete` - No delete functionality in CLI interface
- `remove` - Not available
- `destroy` - Not available

## 📋 PRE-TASK VALIDATION CHECKLIST

Before creating any task, verify:
- [ ] Task has meaningful `title`
- [ ] Task has detailed `description`
- [ ] Task has valid `category` (error/feature/subtask/test)
- [ ] Category matches task purpose and priority
- [ ] JSON syntax is valid (use single quotes around JSON string)
- [ ] Command includes proper timeout (10 seconds for TaskManager API)

## 🚨 EMERGENCY ERROR RECOVERY

### If Task Creation Fails
1. **Check error message** - Look for specific validation failures
2. **Verify JSON format** - Ensure proper quoting and syntax
3. **Confirm required fields** - title, description, category all present
4. **Validate category value** - Must be error/feature/subtask/test
5. **Retry with corrected format**

### If Command Not Found Error
1. **Check available commands** - Run `guide` command for valid options
2. **Verify command exists** - No delete/remove commands available
3. **Use alternative approach** - Complete tasks instead of deleting

## 🎯 CATEGORY SELECTION GUIDE

**Choose `error` for:**
- Linter violations (ESLint, Prettier, etc.)
- Build failures and compilation errors
- Runtime exceptions and bugs
- Security vulnerabilities
- System startup failures

**Choose `feature` for:**
- New functionality implementation
- User interface enhancements
- Code refactoring and optimization
- Documentation updates
- Configuration improvements

**Choose `subtask` for:**
- Specific components of larger features
- Implementation details of approved features
- Step-by-step feature breakdowns

**Choose `test` for:**
- Unit test creation
- Integration test setup
- End-to-end test implementation
- Test coverage improvements
- Performance testing

## 📝 COMPLETION FORMAT GUIDELINES

### Safe Completion Formats
```bash
# Simple string format (recommended)
timeout 10s node /Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js complete task_123 '"Task completed successfully"'

# JSON format (for detailed status)
timeout 10s node /Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js complete task_123 '{"message":"Build successful", "status":"All tests passed"}'
```

### Avoid These Completion Formats
```bash
# ❌ Special characters and emojis
timeout 10s node /Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js complete task_123 "Task completed! ✅"

# ❌ Unquoted strings
timeout 10s node /Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js complete task_123 Task completed

# ❌ Complex nested JSON
timeout 10s node /Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js complete task_123 '{"result":{"data":{"nested":"value"}}}'
```

This guide prevents the two critical errors encountered:
1. **Non-existent delete command usage**
2. **Missing required category field in task creation**

Always consult this guide before TaskManager API operations to ensure error-free execution.