# Quick Reference Guide

## Setup Commands

```bash
# Initial setup for a project
cd /your/project
node /path/to/infinite-continue-stop-hook/setup.js

# Test the hook manually
node /path/to/infinite-continue-stop-hook/test-hook.js
```

## TODO.json Task Structure

```json
{
  "id": "unique-id",
  "mode": "DEVELOPMENT|REFACTORING|TESTING|RESEARCH|TASK_CREATION|REVIEWER",
  "description": "Brief description",
  "prompt": "Detailed instructions for the agent",
  "dependencies": ["file1.js", "dir/"],
  "important_files": ["config.js"],
  "status": "pending|in_progress|completed",
  "requires_research": false,
  "subtasks": []
}
```

## Mode Quick Guide

| Mode | When to Use | Focus |
|------|-------------|-------|
| **DEVELOPMENT** | New features | Implementation |
| **REFACTORING** | Code improvement | Quality without changing behavior |
| **TESTING** | Test creation | Coverage and reliability |
| **RESEARCH** | External APIs | Information gathering |
| **TASK_CREATION** | Complex tasks | Breaking down into subtasks |
| **REVIEWER** | Quality checks | Three-strike review |

## Mode Alternation Pattern

```
Task 1 (DEVELOPMENT) → TASK_CREATION → Execute subtasks → TASK_CREATION → ...
```

## Review Strike Criteria

1. **Strike 1**: Build without errors
2. **Strike 2**: Zero lint errors  
3. **Strike 3**: Test coverage (100% critical, 90%+ other)

## Common Task Patterns

### API Integration
```json
{
  "mode": "RESEARCH",
  "description": "Research Stripe API",
  "requires_research": true
}
→
{
  "mode": "DEVELOPMENT",
  "description": "Implement Stripe integration"
}
→
{
  "mode": "TESTING",
  "description": "Test Stripe integration"
}
```

### Feature Development
```json
{
  "mode": "DEVELOPMENT",
  "description": "Create user dashboard"
}
→
{
  "mode": "TESTING", 
  "description": "Test user dashboard"
}
→
{
  "mode": "REFACTORING",
  "description": "Optimize dashboard performance"
}
```

## Exit Codes

- **0**: Stop (tasks complete or error)
- **2**: Continue with prompt
- **Other**: Non-blocking error

## File Locations

```
infinite-continue-stop-hook/
├── stop-hook.js         # Main hook
├── setup.js            # Setup script
├── test-hook.js        # Test utility
├── modes/              # Mode prompts
│   ├── general.md      # ADDER+ PROTOCOL (always included)
│   ├── development.md
│   ├── refactoring.md
│   ├── testing.md
│   ├── research.md
│   ├── task-creation.md
│   └── reviewer.md
└── lib/                # Core modules
    ├── taskManager.js
    ├── agentExecutor.js
    └── reviewSystem.js

your-project/
├── TODO.json           # Task list
└── .claude/
    └── settings.json   # Hook config
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Hook not running | Check `.claude/settings.json` |
| Mode file error | Verify all files in `modes/` |
| Task not progressing | Check task status in TODO.json |
| Infinite loop | Check `stop_hook_active` handling |

## Manual TODO.json Operations

```bash
# Backup before editing
cp TODO.json TODO.json.backup

# Validate JSON
python -m json.tool TODO.json

# Reset task status
# Edit TODO.json: change "in_progress" → "pending"

# Add new task
# Edit TODO.json: add to tasks array

# Skip task
# Edit TODO.json: change status to "completed"
```

## Best Practices

1. **Clear Task Descriptions**: Be specific about what needs to be done
2. **Appropriate Modes**: Match mode to work type
3. **Dependencies**: List all files the task needs
4. **Success Criteria**: Make them measurable
5. **Research First**: For unknown APIs/libraries
6. **Trust the System**: Let it alternate modes
7. **Review Feedback**: Address all issues found

## Quick Task Creation

```javascript
// In your code, when you need to create a task:
// Add a TODO comment that can be parsed later
// TODO: [DEVELOPMENT] Implement caching layer for API responses
// TODO: [TESTING] Add edge case tests for user validation
// TODO: [RESEARCH] Investigate WebSocket libraries for real-time updates
```

Then manually add to TODO.json or create a parser.