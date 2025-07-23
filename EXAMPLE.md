# Example: Using the Infinite Continue Stop Hook

This example demonstrates how to set up and use the infinite continue stop hook system.

## Step 1: Initial Setup

```bash
# Navigate to your project
cd ~/my-awesome-project

# Run the setup script
node ~/Desktop/Claude\ Coding\ Projects/infinite-continue-stop-hook/setup.js
```

### Setup Prompts:
```
=== Infinite Continue Stop Hook Setup ===

Enter project name: my-awesome-project
Enter project path (leave empty for current directory): 
Create initial task:
Task description: Build a REST API for user management
Task mode (DEVELOPMENT/REFACTORING/TESTING/RESEARCH): DEVELOPMENT
Detailed task prompt: Create a REST API with endpoints for user CRUD operations, including authentication
Dependencies (comma-separated, e.g., config.js,lib/): src/config.js, src/database/
Important files to read (comma-separated): package.json, src/app.js
Requires research? (y/n): n
```

## Step 2: Generated TODO.json

After setup, your project will have a `TODO.json`:

```json
{
  "project": "my-awesome-project",
  "tasks": [
    {
      "id": "task-1",
      "mode": "DEVELOPMENT",
      "description": "Build a REST API for user management",
      "prompt": "Create a REST API with endpoints for user CRUD operations, including authentication",
      "dependencies": ["src/config.js", "src/database/"],
      "important_files": ["package.json", "src/app.js"],
      "status": "pending",
      "requires_research": false,
      "subtasks": []
    },
    {
      "id": "review-strike-1",
      "mode": "REVIEWER",
      "description": "Review Strike 1: Ensure the project builds completely without errors",
      "prompt": "Perform a comprehensive code review with focus on: Ensure the project builds completely without errors...",
      "dependencies": ["**/*.js", "**/*.ts", "**/*.json"],
      "important_files": ["package.json", "tsconfig.json", ".eslintrc"],
      "status": "pending",
      "requires_research": false,
      "subtasks": [],
      "is_review_task": true,
      "strike_number": 1
    },
    {
      "id": "review-strike-2",
      "mode": "REVIEWER",
      "description": "Review Strike 2: Verify no lint errors exist in the codebase",
      "prompt": "Perform a comprehensive code review with focus on: Verify no lint errors exist in the codebase...",
      "dependencies": ["**/*.js", "**/*.ts", "**/*.json"],
      "important_files": ["package.json", "tsconfig.json", ".eslintrc"],
      "status": "pending",
      "requires_research": false,
      "subtasks": [],
      "is_review_task": true,
      "strike_number": 2
    },
    {
      "id": "review-strike-3",
      "mode": "REVIEWER",
      "description": "Review Strike 3: Confirm test coverage is 100% on important modules and 90%+ on others, with all tests passing",
      "prompt": "Perform a comprehensive code review with focus on: Confirm test coverage...",
      "dependencies": ["**/*.js", "**/*.ts", "**/*.json"],
      "important_files": ["package.json", "tsconfig.json", ".eslintrc"],
      "status": "pending",
      "requires_research": false,
      "subtasks": [],
      "is_review_task": true,
      "strike_number": 3
    }
  ],
  "review_strikes": 0,
  "strikes_completed_last_run": false,
  "current_task_index": 0,
  "last_mode": null
}
```

## Step 3: How the Hook Works

When Claude Code stops, the hook will:

### First Stop - TASK_CREATION Mode
The agent receives the ADDER+ PROTOCOL (general.md) + task-creation.md + task context:

```
You are in TASK_CREATION mode...

Task ID: task-1
Description: Build a REST API for user management
Mode: DEVELOPMENT

Please analyze this task and create appropriate subtasks using the Task tool.
```

The agent might create subtasks like:
1. Research and design API structure
2. Set up Express server and middleware
3. Create user model and database schema
4. Implement authentication middleware
5. Create CRUD endpoints
6. Add input validation
7. Write API tests

### Second Stop - Task Execution Mode
The agent receives guidance for the specific task mode (e.g., DEVELOPMENT):

```
You are in DEVELOPMENT mode...

Current Task:
ID: task-1
Mode: DEVELOPMENT
Description: Build a REST API for user management

Task Prompt:
Create a REST API with endpoints for user CRUD operations, including authentication

Dependencies to consider: src/config.js, src/database/
Important files to read first: package.json, src/app.js
```

## Step 4: Task Progression

As tasks complete, the system:
1. Updates task status to "completed"
2. Moves to the next pending task
3. Alternates between TASK_CREATION and execution
4. Injects review tasks every 5 completions

## Step 5: Review Strikes

When reaching review tasks:

### Strike 1 Example Output
```
STRIKE 1 REVIEW - PASSED ✅
========================
Build: ✅ Clean build, no errors
Dependencies: ✅ All installed correctly
Artifacts: ✅ Generated as expected

Ready to proceed to next phase.
```

### Strike 2 with Failures
```
STRIKE 2 REVIEW - FAILED ❌
========================
Build: ✅ Success
Lint: ❌ 3 errors found
  - src/auth.js:45 - Unused variable 'token'
  - src/api.js:12 - Missing semicolon
  - tests/user.test.js:78 - Console.log present

Creating remediation tasks...
```

## Step 6: Continuous Operation

The system continues until:
- All tasks are completed
- Three strikes pass successfully
- Manual intervention stops the process

## Example Workflow

1. **Initial Task**: "Build user management API"
2. **TASK_CREATION**: Creates 7 subtasks
3. **DEVELOPMENT**: Implements first subtask
4. **TASK_CREATION**: Reviews progress, adjusts subtasks
5. **DEVELOPMENT**: Continues implementation
6. ...(continues alternating)...
7. **REVIEWER Strike 1**: Verifies build
8. **REVIEWER Strike 2**: Checks code quality
9. **REVIEWER Strike 3**: Validates tests
10. **Complete**: All strikes passed!

## Tips for Success

1. **Write Clear Task Prompts**: The more specific, the better
2. **Use Appropriate Modes**: Match the mode to the work type
3. **Let TASK_CREATION Break Down Complex Work**: Don't create huge monolithic tasks
4. **Trust the Review System**: It ensures quality standards
5. **Check TODO.json**: Monitor progress and adjust as needed

## Customization

Edit mode files to customize behavior:
- `modes/general.md`: Core instructions (ADDER+ PROTOCOL)
- `modes/development.md`: How to implement features
- `modes/testing.md`: Testing strategies
- etc.

The system adapts to your project's needs while maintaining quality standards!