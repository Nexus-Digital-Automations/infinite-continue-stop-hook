# Setting Up Infinite Continue Hook System

**IMPORTANT**: When asked to set up the infinite continue hook system for a project, you MUST use this setup script.

## Prerequisites

The global hook must already be configured in `~/.claude/settings.json`. This script only creates TODO.json for projects.

**Expected global configuration:**
```json
{
  "hooks": {
    "Stop": [{
      "matcher": "",
      "hooks": [{
        "type": "command",
        "command": "node /Users/jeremyparker/Desktop/Claude\\ Coding\\ Projects/infinite-continue-stop-hook/stop-hook.js"
      }]
    }]
  }
}
```

## Primary Setup Command

```bash
node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/setup-infinite-hook.js" "/path/to/target/project"
```

## Instructions for Claude Code

### When to Use This Script
Use this script when the user asks you to:
- "Set up infinite continue hook"
- "Enable infinite hook for this project"
- "Install the stop hook system"
- "Configure automatic task continuation"
- Any similar request for the infinite continue system

### Basic Usage

1. **For current directory:**
   ```bash
   node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/setup-infinite-hook.js" "."
   ```

2. **For specific project path:**
   ```bash
   node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/setup-infinite-hook.js" "/Users/username/my-project"
   ```

### Interactive Mode (Default)

The script will prompt for:
- Project name (auto-detected from package.json or directory name)
- Task description
- Task mode (DEVELOPMENT/REFACTORING/TESTING/RESEARCH)
- Detailed task prompt
- Dependencies (optional)
- Important files (optional)
- Whether research is required

### Non-Interactive Mode

For automated setup without prompts:

```bash
node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/setup-infinite-hook.js" "/path/to/project" \
  --no-interactive \
  --project-name "my-app" \
  --task "Implement user authentication" \
  --mode "DEVELOPMENT" \
  --prompt "Build a complete user authentication system with login, logout, and registration" \
  --dependencies "src/models/,src/controllers/" \
  --important-files "package.json,src/app.js"
```

### What the Script Does

1. **Creates Project Directories**
   - Creates `/development` directory for project-specific guidelines
   - Creates `/development/modes` subdirectory
   - Copies all mode files (development.md, testing.md, etc.) from the hook system to the project

2. **Creates TODO.json** in the specified project
   - Adds the initial task based on user input
   - Includes three review strike tasks automatically
   - Sets up the task management structure

3. **Tests the Setup**
   - Runs test-hook.js to verify configuration
   - Shows current TODO.json status

**Note**: This script assumes the global hook is already configured. It does NOT modify `~/.claude/settings.json`.

### Project Directory Structure

After running the setup script, your project will have:

```
your-project/
├── TODO.json                    # Task management file
├── development/                 # Project-specific guidelines
│   └── modes/                   # Mode-specific guidance
│       ├── development.md       # Development mode instructions
│       ├── testing.md           # Testing mode instructions
│       ├── debugging.md         # Debugging mode instructions
│       ├── refactoring.md       # Refactoring mode instructions
│       ├── documentation.md     # Documentation mode instructions
│       ├── task-creation.md     # Task creation mode instructions
│       └── general.md           # General instructions
└── ... (your project files)
```

### Customizing Mode Files

After setup, you can customize the mode files in `/development/modes/` to fit your project's specific needs:

1. Edit any `.md` file in `/development/modes/` to add project-specific guidance
2. The hook will read these customized files instead of the default ones
3. This allows each project to have its own development standards and workflows

### Command Line Options

| Option | Description | Example |
|--------|-------------|---------|
| `--no-interactive` | Run without prompts | `--no-interactive` |
| `--project-name` | Set project name | `--project-name "my-app"` |
| `--task` | Initial task description | `--task "Build REST API"` |
| `--mode` | Task mode | `--mode "DEVELOPMENT"` |
| `--prompt` | Detailed task instructions | `--prompt "Create CRUD endpoints"` |
| `--dependencies` | Comma-separated dependencies | `--dependencies "src/,lib/"` |
| `--important-files` | Files to read first | `--important-files "README.md,package.json"` |
| `--requires-research` | Flag for research tasks | `--requires-research` |

### Examples for Different Scenarios

#### New Node.js Project
```bash
node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/setup-infinite-hook.js" "." \
  --no-interactive \
  --task "Set up Express.js API with TypeScript" \
  --mode "DEVELOPMENT"
```

#### Python Project
```bash
node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/setup-infinite-hook.js" "/path/to/python-project" \
  --no-interactive \
  --project-name "flask-app" \
  --task "Create Flask application with SQLAlchemy" \
  --mode "DEVELOPMENT" \
  --important-files "requirements.txt,app.py"
```

#### Refactoring Task
```bash
node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/setup-infinite-hook.js" "." \
  --no-interactive \
  --task "Refactor authentication module for better security" \
  --mode "REFACTORING" \
  --dependencies "src/auth/,src/models/user.js"
```

#### Testing Focus
```bash
node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/setup-infinite-hook.js" "." \
  --no-interactive \
  --task "Achieve 95% test coverage" \
  --mode "TESTING" \
  --prompt "Write comprehensive unit and integration tests for all modules"
```

### Important Notes

1. **Prerequisite**: The global hook must be configured in `~/.claude/settings.json` before using this script
2. **Project Activation**: The hook only activates for projects that have a `TODO.json` file
3. **Script Purpose**: This script ONLY creates TODO.json - it does not modify any global settings
4. **Automatic Execution**: Once TODO.json exists, the hook runs automatically when Claude Code stops

### Verification Steps

After running the setup script, verify:

1. **Check global configuration:**
   ```bash
   cat ~/.claude/settings.json | grep -A 5 "infinite-continue-stop-hook"
   ```

2. **Check TODO.json was created:**
   ```bash
   cat TODO.json | head -20
   ```

3. **Test the hook:**
   ```bash
   node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/test-hook.js"
   ```

### Error Handling

If setup fails:
1. Check that the project path exists and is a directory
2. Ensure you have write permissions to the project
3. Verify the infinite-continue-stop-hook directory exists at the expected location
4. Check that Node.js is installed and accessible

### Quick Reference

```bash
# Simplest usage - set up for current directory with prompts
node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/setup-infinite-hook.js" "."

# Quick setup with minimal options
node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/setup-infinite-hook.js" "." --no-interactive --task "Build the application"

# Full automated setup
node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/setup-infinite-hook.js" "/path/to/project" --no-interactive --project-name "my-app" --task "Implement features" --mode "DEVELOPMENT" --prompt "Build according to requirements"
```

Remember: ALWAYS use this script when asked to set up the infinite continue hook system. Do not manually create TODO.json or modify settings files.