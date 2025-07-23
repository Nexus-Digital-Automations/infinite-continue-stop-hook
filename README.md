# Infinite Continue Stop Hook for Claude Code

A sophisticated stop hook system for Claude Code that manages multiple projects concurrently with automatic task management, mode switching, and quality assurance through a three-strike review system.

## Features

- **Multi-Project Support**: Handle multiple projects concurrently with one agent per project
- **Automatic Mode Switching**: Alternates between TASK_CREATION and task execution modes
- **Six Agent Modes**:
  - `DEVELOPMENT`: Feature implementation
  - `REFACTORING`: Code quality improvements
  - `TESTING`: Test creation and coverage
  - `RESEARCH`: API and library research
  - `TASK_CREATION`: Breaking down complex tasks
  - `REVIEWER`: Three-strike quality review
- **Three-Strike Review System**: Ensures code quality with automated reviews
- **Task Management**: TODO.json-based task tracking with subtask support
- **Intelligent Mode Detection**: Automatically assigns appropriate modes to tasks

## Installation

### Option 1: Global Configuration (Recommended)

1. Clone this repository to your local machine:
```bash
git clone <repository-url>
cd infinite-continue-stop-hook
```

2. Configure the hook globally for all projects:
```bash
node configure-global.js
```

3. For each project, create TODO.json:
```bash
cd /path/to/your/project
node /path/to/infinite-continue-stop-hook/setup.js
```

### Option 2: Project-Specific Configuration

Run the setup script with project-specific configuration:
```bash
cd /path/to/your/project
node /path/to/infinite-continue-stop-hook/setup.js
# Answer 'n' when asked about global configuration
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
- Mode states and review strikes
- Must exist for hook to activate

## Usage

Once set up, the stop hook runs automatically when Claude Code finishes responding. The system will:

1. Read the current project's TODO.json
2. Determine the appropriate mode (alternating between TASK_CREATION and execution)
3. Provide mode-specific guidance from the general.md and mode files
4. Continue with the next task or create subtasks

### TODO.json Structure

```json
{
  "project": "my-project",
  "tasks": [
    {
      "id": "task-1",
      "mode": "DEVELOPMENT",
      "description": "Implement user authentication",
      "prompt": "Create a secure authentication system...",
      "dependencies": ["config.js", "database/"],
      "important_files": ["src/auth.js"],
      "status": "pending",
      "requires_research": false,
      "subtasks": []
    }
  ],
  "review_strikes": 0,
  "strikes_completed_last_run": false,
  "current_task_index": 0,
  "last_mode": null
}
```

### Task Fields

- `id`: Unique identifier for the task
- `mode`: One of: DEVELOPMENT, REFACTORING, TESTING, RESEARCH, TASK_CREATION, REVIEWER
- `description`: Brief description of what needs to be done
- `prompt`: Detailed instructions for the agent
- `dependencies`: Files/directories the task depends on
- `important_files`: Files to read before starting
- `status`: pending, in_progress, or completed
- `requires_research`: Boolean indicating if research is needed first
- `subtasks`: Array of subtasks created by TASK_CREATION mode

## Mode System

### Mode Alternation
The system alternates between:
1. **TASK_CREATION**: Analyzes current task and creates subtasks
2. **Task Execution**: Works on the task with its specified mode

### Mode-Specific Prompts
Each mode has its own prompt file in the `modes/` directory:
- `general.md`: Included with all tasks (ADDER+ PROTOCOL)
- `development.md`: Feature implementation guidance
- `refactoring.md`: Code improvement strategies
- `testing.md`: Test creation approaches
- `research.md`: API/library research methods
- `task-creation.md`: Task decomposition strategies
- `reviewer.md`: Review criteria and process

## Three-Strike Review System

After completing tasks, the system runs three review strikes:

1. **Strike 1**: Build Verification
   - Project builds without errors
   - All dependencies properly installed
   - Build artifacts generated correctly

2. **Strike 2**: Lint and Code Quality
   - Zero lint errors
   - Consistent code style
   - No console.log in production

3. **Strike 3**: Test Coverage
   - All tests passing
   - 100% coverage on critical modules
   - 90%+ coverage on other modules

### Strike Reset Logic
- If all 3 strikes completed: Approve and continue
- If 3 strikes already completed from previous run: Reset to 0 for new cycle

## Advanced Features

### Research Task Detection
Tasks requiring external API knowledge automatically trigger research tasks first.

### Subtask Management
TASK_CREATION mode breaks complex tasks into manageable subtasks (2-4 hours each).

### Review Task Injection
Review tasks are automatically injected every 5 completed tasks.

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

3. **Mode file not found**: Ensure all mode files exist in the `modes/` directory

4. **Hook runs in unwanted projects**: 
   - Either remove global configuration
   - Or add project-specific override in `.claude/settings.json`

### Manual Hook Testing
```bash
echo '{"session_id":"test","transcript_path":"test.jsonl","hook_event_name":"Stop","stop_hook_active":false}' | node /path/to/stop-hook.js
```

## Contributing

To add new modes:
1. Create a new `.md` file in `modes/`
2. Update the mode list in setup.js
3. Add mode-specific logic in AgentExecutor

## License

MIT License - See LICENSE file for details