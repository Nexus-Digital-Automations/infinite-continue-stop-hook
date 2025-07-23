#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('Testing Infinite Continue Stop Hook...\n');

// Create test input
const testInput = {
    session_id: "test-session-123",
    transcript_path: path.join(__dirname, "test-transcript.jsonl"),
    hook_event_name: "Stop",
    stop_hook_active: false
};

// Check if TODO.json exists in current directory
const todoPath = path.join(process.cwd(), 'TODO.json');
if (!fs.existsSync(todoPath)) {
    console.error('❌ No TODO.json found in current directory.');
    console.log('\nPlease run the setup script first:');
    console.log(`node ${path.join(__dirname, 'setup-infinite-hook.js')}\n`);
    process.exit(1);
}

console.log('✅ TODO.json found\n');
console.log('Current TODO.json contents:');
const todoData = JSON.parse(fs.readFileSync(todoPath, 'utf8'));
console.log(`- Project: ${todoData.project}`);
console.log(`- Total tasks: ${todoData.tasks.length}`);
console.log(`- Pending tasks: ${todoData.tasks.filter(t => t.status === 'pending').length}`);
console.log(`- Current mode: ${todoData.last_mode || 'Not set'}`);
console.log(`- Review strikes: ${todoData.review_strikes}/3\n`);

// Run the stop hook
console.log('Running stop hook...\n');
const hookPath = path.join(__dirname, 'stop-hook.js');
const hookProcess = spawn('node', [hookPath]);

// Send input to hook
hookProcess.stdin.write(JSON.stringify(testInput));
hookProcess.stdin.end();

// Capture output
let stdout = '';
let stderr = '';

hookProcess.stdout.on('data', (data) => {
    stdout += data.toString();
});

hookProcess.stderr.on('data', (data) => {
    stderr += data.toString();
});

hookProcess.on('close', (code) => {
    console.log(`\nStop hook exited with code: ${code}`);
    
    if (stdout) {
        console.log('\n--- STDOUT (Normal output) ---');
        console.log(stdout);
    }
    
    if (stderr) {
        console.log('\n--- STDERR (Prompt for Claude) ---');
        console.log(stderr);
    }
    
    console.log('\n--- Exit Code Meaning ---');
    switch(code) {
        case 0:
            console.log('✅ Success - Claude should stop (all tasks complete or other stop condition)');
            break;
        case 2:
            console.log('🔄 Continue - Claude should continue with the provided prompt');
            break;
        default:
            console.log('❌ Error - Something went wrong');
    }
    
    // Check if TODO.json was updated
    console.log('\n--- TODO.json Changes ---');
    const newTodoData = JSON.parse(fs.readFileSync(todoPath, 'utf8'));
    
    if (newTodoData.last_mode !== todoData.last_mode) {
        console.log(`Mode changed: ${todoData.last_mode || 'None'} → ${newTodoData.last_mode}`);
    }
    
    const oldInProgress = todoData.tasks.filter(t => t.status === 'in_progress').length;
    const newInProgress = newTodoData.tasks.filter(t => t.status === 'in_progress').length;
    if (newInProgress > oldInProgress) {
        console.log('✅ A task was marked as in_progress');
    }
    
    if (newTodoData.tasks.length > todoData.tasks.length) {
        console.log(`✅ ${newTodoData.tasks.length - todoData.tasks.length} new task(s) added`);
    }
    
    // Check if log file was created
    const logPath = path.join(process.cwd(), 'infinite-continue-hook.log');
    if (fs.existsSync(logPath)) {
        console.log('\n--- Log File ---');
        console.log(`✅ Log file created: ${logPath}`);
        const logData = JSON.parse(fs.readFileSync(logPath, 'utf8'));
        console.log(`Execution duration: ${logData.execution.durationMs}ms`);
        console.log(`Total decisions made: ${logData.decisions.length}`);
        console.log(`Execution flow steps: ${logData.flow.length}`);
        if (logData.errors.length > 0) {
            console.log(`❌ Errors encountered: ${logData.errors.length}`);
        }
    }
});