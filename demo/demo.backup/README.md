# Hook System Demo

This demo project showcases how the infinite continue hook system works.

## Features Demonstrated

1. **Mode Switching**: The hook detects project state and switches modes automatically
2. **Task Management**: Shows how TODO.json tracks tasks
3. **Code Quality Checks**: Demonstrates lint errors and test coverage detection

## Intentional Issues

This demo includes intentional issues to trigger different modes:

- **Low Test Coverage**: Only ~40% coverage to trigger testing mode
- **Code Bugs**: Division by zero, type coercion issues
- **Missing Documentation**: Some functions lack proper docs

## Setup

1. Run the setup script from the demo directory:
   ```bash
   node "../setup-infinite-hook.js" "."
   ```

2. Try stopping Claude Code to see the hook in action

## Project Structure

```
demo/
├── calculator.js       # Main module with intentional bugs
├── calculator.test.js  # Incomplete test suite
├── package.json        # Project configuration
└── README.md          # This file
```