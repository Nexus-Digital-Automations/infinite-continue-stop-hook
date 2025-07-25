#!/usr/bin/env node

// =============================================================================
// demonstrate-hook.js - Interactive Demonstration of Hook System
// 
// This script demonstrates how the infinite continue hook system works
// by simulating different project states and showing mode transitions.
// =============================================================================

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('=== Infinite Continue Hook System Demonstration ===\n');

/**
 * Simulate running the hook and show the results
 */
function runHookDemo() {
    console.log('1. Setting up demo project with TODO.json...\n');
    
    // Run setup script
    try {
        execSync('node "../setup-infinite-hook.js" "." --no-interactive --task "Build calculator module" --mode "DEVELOPMENT"', {
            stdio: 'inherit',
            cwd: __dirname
        });
    } catch (error) {
        console.log(`Setup may have completed with warnings: ${error.message}\n`);
    }

    console.log('\n2. Current TODO.json contents:');
    const todoPath = path.join(__dirname, 'TODO.json');
    if (fs.existsSync(todoPath)) {
        const todo = JSON.parse(fs.readFileSync(todoPath, 'utf8'));
        console.log(`   - Project: ${todo.project}`);
        console.log(`   - Total tasks: ${todo.tasks.length}`);
        console.log(`   - Current mode: ${todo.last_mode || 'Not set'}`);
        console.log(`   - Review strikes: ${todo.review_strikes}/3\n`);
    }

    console.log('3. Simulating different scenarios:\n');

    console.log('   Scenario A: Low Test Coverage');
    console.log('   - Current coverage: ~40% (only 2 of 5 methods tested)');
    console.log('   - Expected mode switch: TESTING mode\n');

    console.log('   Scenario B: Code with Bugs');
    console.log('   - Division by zero not handled');
    console.log('   - Type coercion issues in multiply()');
    console.log('   - Expected mode switch: DEBUGGING mode\n');

    console.log('   Scenario C: Task Creation');
    console.log('   - Hook alternates to TASK_CREATION mode');
    console.log('   - Analyzes TODO.json and creates new tasks\n');

    console.log('4. How the Hook Works:');
    console.log('   a) When you stop Claude Code, the hook intercepts');
    console.log('   b) It analyzes project state (tests, coverage, linting)');
    console.log('   c) Selects appropriate mode based on priorities');
    console.log('   d) Provides mode-specific guidance');
    console.log('   e) Updates task status in TODO.json\n');

    console.log('5. Mode Alternation:');
    console.log('   - First stop: Uses task mode (e.g., DEVELOPMENT)');
    console.log('   - Second stop: Switches to TASK_CREATION');
    console.log('   - Third stop: Back to task mode');
    console.log('   - This ensures regular task decomposition\n');

    console.log('6. Directory Structure After Setup:');
    console.log('   demo/');
    console.log('   ├── TODO.json                # Task tracking');
    console.log('   ├── development/             # Project guidelines');
    console.log('   │   └── modes/              # Mode-specific files');
    console.log('   │       ├── development.md');
    console.log('   │       ├── testing.md');
    console.log('   │       └── ...');
    console.log('   └── calculator.js           # Your code\n');

    console.log('=== Try It Yourself ===');
    console.log('1. In Claude Code, navigate to this demo directory');
    console.log('2. Try to stop Claude Code - the hook will activate');
    console.log('3. Watch as it provides guidance based on project state');
    console.log('4. Complete tasks and see mode transitions\n');
}

// Run the demonstration
runHookDemo();

// =============================================================================
// End of demonstrate-hook.js
// =============================================================================