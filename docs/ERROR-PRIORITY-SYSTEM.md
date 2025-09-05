# Error Priority System Documentation

## Overview

The Infinite Continue Stop Hook implements a **three-section priority system** that ensures critical errors are handled before feature work, maintaining code quality and system stability.

## Three-Section Architecture

### Section 1: ERROR TASKS (Highest Priority)
Error tasks have **absolute priority** and bypass all other ordering:

- `linter-error` - Code style and linting violations
- `build-error` - Compilation and build failures  
- `start-error` - Application startup failures
- `error` - Generic critical errors
- `test-error` - Test execution failures
- `test-linter-error` - Test code linting issues

### Section 2: FEATURE TASKS (Middle Priority)
Development work that implements new functionality:

- `enhancement` - New features and improvements
- `missing-feature` - Required functionality gaps
- `documentation` - Project documentation
- `refactor` - Code quality improvements
- `research` - Research and analysis tasks

### Section 3: REVIEW TASKS (Lowest Priority)
Testing, validation, and quality assurance:

- `missing-test` - Required test coverage
- `test-setup` - Test framework configuration
- `test-refactor` - Test code improvements
- `test-performance` - Performance testing
- `test-feature` - Feature validation tests

## Priority Behavior

### Error Task Priority Rules
1. **Instant Execution** - Error tasks can be claimed immediately without feature order validation
2. **Blocking Behavior** - Feature work is blocked until all error tasks are resolved  
3. **Override Everything** - Error tasks always come first regardless of dependencies
4. **Auto-categorization** - Tasks are automatically placed in correct sections

### Workflow Sequence
```
Error Detected → Create Error Task → Execute Immediately → Return to Feature Work
```

## API Commands

### Creating Error Tasks

#### Linter Error
```bash
timeout 10s node "taskmanager-api.js" create-error '{
  "title": "Fix ESLint error in auth.js", 
  "description": "Resolve linting violations in authentication module",
  "category": "linter-error",
  "priority": "critical",
  "important_files": ["src/auth.js"]
}'
```

#### Build Error  
```bash
timeout 10s node "taskmanager-api.js" create-error '{
  "title": "Fix TypeScript compilation error",
  "category": "build-error", 
  "important_files": ["src/types.ts"]
}'
```

#### Test Error
```bash
timeout 10s node "taskmanager-api.js" create-error '{
  "title": "Fix failing unit test in utils.test.js",
  "category": "test-error",
  "important_files": ["test/utils.test.js"]
}'
```

### Creating Feature Tasks

#### Enhancement
```bash
timeout 10s node -e 'const TaskManager = require("./lib/taskManager"); 
const tm = new TaskManager("./TODO.json"); 
tm.createTask({
  title: "Add search functionality", 
  description: "Implement full-text search with filters",
  category: "enhancement", 
  mode: "DEVELOPMENT"
}).then(id => console.log("Created:", id));'
```

#### Documentation
```bash
timeout 10s node -e 'const TaskManager = require("./lib/taskManager");
const tm = new TaskManager("./TODO.json");
tm.createTask({
  title: "Document API endpoints",
  category: "documentation",
  mode: "DEVELOPMENT"  
}).then(id => console.log("Created:", id));'
```

### Creating Review Tasks

Review tasks are **automatically categorized** and placed in the review section:

```bash
timeout 10s node -e 'const TaskManager = require("./lib/taskManager");
const tm = new TaskManager("./TODO.json");
tm.createTask({
  title: "Add unit tests for search feature",
  category: "missing-test",
  mode: "DEVELOPMENT"
}).then(id => console.log("Created:", id));'
```

## Integration Guide for Other Projects

### Step 1: Copy Core Files
Copy these essential files to your project:
```
lib/taskManager.js              # Core task management
taskmanager-api.js             # API interface
utilities/autoFixer.js         # Error detection
utilities/taskCategories.js    # Category definitions
```

### Step 2: Configure TODO.json Structure
Initialize your project with the three-section structure:
```json
{
  "project": "your-project-name",
  "tasks": [],
  "features": [],
  "agents": {}
}
```

### Step 3: Setup Hook Integration
Configure Claude Code hooks in your project settings:
```bash
node setup-infinite-hook.js "/path/to/your/project"
```

### Step 4: Customize Categories
Modify `utilities/taskCategories.js` to add project-specific categories:
```javascript
const errorCategories = [
  'linter-error', 'build-error', 'start-error', 
  'your-custom-error'  // Add your error types
];

const reviewCategories = [
  'missing-test', 'test-setup', 'test-performance',
  'your-custom-review'  // Add your review types  
];
```

## Usage Examples

### Typical Development Workflow

1. **Start Development Session:**
```bash
# Initialize agent
node taskmanager-api.js init --project-root "/path/to/project"

# Check for pending work
node taskmanager-api.js list '{"status": "pending"}'
```

2. **Handle Critical Errors First:**
```bash
# If linter errors exist, they appear first
node taskmanager-api.js claim task_linter_123 agent_id
```

3. **Work on Features After Errors Clear:**
```bash
# Features only available after errors resolved
node taskmanager-api.js claim task_feature_456 agent_id  
```

4. **Complete with Testing:**
```bash
# Review tasks come last
node taskmanager-api.js claim task_test_789 agent_id
```

### Multi-Agent Coordination
```bash
# Agent 1 handles errors
node taskmanager-api.js claim-priority error agent_1

# Agent 2 handles features  
node taskmanager-api.js claim-priority feature agent_2

# Agent 3 handles testing
node taskmanager-api.js claim-priority review agent_3
```

## Benefits

### Code Quality Assurance
- **Immediate Error Resolution** - Critical issues fixed before feature work
- **Consistent Quality Gates** - Every error must be resolved properly
- **No Issue Masking** - Root cause fixes required, not workarounds

### Development Efficiency  
- **Clear Prioritization** - Developers know what to work on first
- **Reduced Context Switching** - Related work grouped together
- **Automated Organization** - No manual task prioritization needed

### Team Coordination
- **Conflict Prevention** - Clear priority rules prevent disputes
- **Scalable Workflow** - Works for solo developers and large teams
- **Tool Integration** - Compatible with existing development tools

## Advanced Configuration

### Custom Priority Rules
Override default behavior by modifying `_insertTaskInCorrectSection()` in TaskManager:

```javascript
// Example: Add security category to error section
const errorCategories = [
  'linter-error', 'build-error', 'start-error', 
  'security-vulnerability'  // Custom critical category
];
```

### Hook Customization  
Configure automatic error detection in your development environment:

```javascript
// post-tool-linter-hook.js
if (linterErrors.length > 0) {
  // Auto-create linter error tasks
  createErrorTask({
    title: `Fix ${linterErrors.length} linting errors`,
    category: 'linter-error',
    important_files: affectedFiles
  });
}
```

## Troubleshooting

### Common Issues

**Error tasks not appearing first:**
- Check that task category is in `errorCategories` array
- Verify `_insertTaskInCorrectSection()` is being called

**Tasks appearing in wrong section:**
- Review category mappings in task creation
- Check for title/description keyword matching

**Agent conflicts:**
- Use distributed locking for multi-agent scenarios
- Initialize agents properly with unique IDs

### Debug Commands
```bash
# Check task order
node -e 'const fs = require("fs"); const todo = JSON.parse(fs.readFileSync("TODO.json", "utf8")); todo.tasks.forEach((t, i) => console.log(`${i+1}. [${t.category}] ${t.title}`));'

# Verify agent status  
node taskmanager-api.js agent-status

# Check system health
node taskmanager-api.js validate
```

## Migration Guide

### From Legacy Systems
If migrating from older task management systems:

1. **Backup existing tasks** to prevent data loss
2. **Categorize existing tasks** into three sections  
3. **Update task creation calls** to use new API
4. **Test error handling** with sample error tasks
5. **Train team** on new priority system

### Version Compatibility
- Compatible with Claude Code v1.5+
- Requires Node.js 14+ for async/await support
- Uses ES6+ features in TaskManager implementation

---

*For additional support or questions about the Error Priority System, please refer to the project documentation or create an issue in the repository.*