#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Parse command line arguments
const args = process.argv.slice(2);
const projectPath = args[0];

// Check for command line flags
const flags = {
    noInteractive: args.includes('--no-interactive'),
    projectName: getArgValue('--project-name'),
    task: getArgValue('--task'),
    mode: getArgValue('--mode') || 'DEVELOPMENT',
    prompt: getArgValue('--prompt'),
    dependencies: getArgValue('--dependencies'),
    importantFiles: getArgValue('--important-files'),
    requiresResearch: args.includes('--requires-research')
};

function getArgValue(flag) {
    const index = args.indexOf(flag);
    if (index > -1 && index < args.length - 1) {
        return args[index + 1];
    }
    return null;
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(prompt) {
    return new Promise(resolve => rl.question(prompt, resolve));
}

async function getProjectInfo(targetPath) {
    // Try to detect project name from package.json or directory name
    let detectedName = path.basename(targetPath);
    
    const packageJsonPath = path.join(targetPath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
        try {
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
            if (packageJson.name) {
                detectedName = packageJson.name;
            }
        } catch {
            // Ignore and use directory name
        }
    }
    
    if (flags.noInteractive) {
        return {
            projectName: flags.projectName || detectedName,
            taskDescription: flags.task || 'Initial project setup',
            taskMode: flags.mode.toUpperCase(),
            taskPrompt: flags.prompt || flags.task || 'Set up the project according to requirements',
            dependencies: flags.dependencies ? flags.dependencies.split(',').map(d => d.trim()) : [],
            importantFiles: flags.importantFiles ? flags.importantFiles.split(',').map(f => f.trim()) : [],
            requiresResearch: flags.requiresResearch
        };
    }
    
    // Interactive mode
    console.log('\n=== Project Configuration ===');
    const projectName = await question(`Project name (${detectedName}): `) || detectedName;
    
    console.log('\n=== Initial Task Setup ===');
    const taskDescription = await question('Task description: ');
    const taskMode = await question('Task mode (DEVELOPMENT/REFACTORING/TESTING/RESEARCH) [DEVELOPMENT]: ') || 'DEVELOPMENT';
    const taskPrompt = await question('Detailed task prompt: ');
    const dependencies = await question('Dependencies (comma-separated files/dirs, or press Enter to skip): ');
    const importantFiles = await question('Important files to read first (comma-separated, or press Enter to skip): ');
    const requiresResearch = await question('Requires research? (y/n) [n]: ');
    
    return {
        projectName,
        taskDescription,
        taskMode: taskMode.toUpperCase(),
        taskPrompt,
        dependencies: dependencies ? dependencies.split(',').map(d => d.trim()) : [],
        importantFiles: importantFiles ? importantFiles.split(',').map(f => f.trim()) : [],
        requiresResearch: requiresResearch.toLowerCase() === 'y'
    };
}

async function createProjectDirectories(targetPath) {
    // Create /development directory
    const developmentPath = path.join(targetPath, 'development');
    if (!fs.existsSync(developmentPath)) {
        fs.mkdirSync(developmentPath, { recursive: true });
        console.log(`✓ Created /development directory`);
    }
    
    // Create /development/modes directory
    const modesPath = path.join(developmentPath, 'modes');
    if (!fs.existsSync(modesPath)) {
        fs.mkdirSync(modesPath, { recursive: true });
        console.log(`✓ Created /development/modes directory`);
    }
    
    // Create /development/tasks directory
    const tasksPath = path.join(developmentPath, 'tasks');
    if (!fs.existsSync(tasksPath)) {
        fs.mkdirSync(tasksPath, { recursive: true });
        console.log(`✓ Created /development/tasks directory`);
    }
    
    // Copy general.md from hook system to project development directory
    const sourceGeneralPath = path.join(__dirname, 'development', 'general.md');
    const destGeneralPath = path.join(developmentPath, 'general.md');
    if (fs.existsSync(sourceGeneralPath)) {
        fs.copyFileSync(sourceGeneralPath, destGeneralPath);
        console.log(`✓ Copied general.md to /development/`);
    }
    
    // Copy mode files from hook system to project
    const sourceModesPath = path.join(__dirname, 'modes');
    const modeFiles = fs.readdirSync(sourceModesPath).filter(file => file.endsWith('.md'));
    
    console.log(`\n=== Copying Mode Files ===`);
    modeFiles.forEach(file => {
        const sourcePath = path.join(sourceModesPath, file);
        const destPath = path.join(modesPath, file);
        fs.copyFileSync(sourcePath, destPath);
        console.log(`✓ Copied ${file}`);
    });
    
    return { developmentPath, modesPath };
}

async function createTodoJson(targetPath, projectInfo) {
    const todoPath = path.join(targetPath, 'TODO.json');
    
    // Check if TODO.json already exists
    if (fs.existsSync(todoPath)) {
        if (flags.noInteractive) {
            console.log('⚠️  TODO.json already exists. Use --force to overwrite.');
            return false;
        }
        
        const overwrite = await question('TODO.json already exists. Overwrite? (y/n): ');
        if (overwrite.toLowerCase() !== 'y') {
            console.log('Setup cancelled.');
            return false;
        }
    }
    
    // Create TODO structure
    const todoData = {
        project: projectInfo.projectName,
        tasks: [
            {
                id: 'task-1',
                mode: projectInfo.taskMode,
                description: projectInfo.taskDescription,
                prompt: projectInfo.taskPrompt,
                dependencies: projectInfo.dependencies,
                important_files: projectInfo.importantFiles,
                status: 'pending',
                requires_research: projectInfo.requiresResearch,
                subtasks: []
            }
        ],
        review_strikes: 0,
        strikes_completed_last_run: false,
        current_task_index: 0,
        last_mode: null
    };
    
    // Add three review tasks for the three-strike policy - language agnostic
    const reviewTasks = [
        {
            criteria: 'Ensure the project builds completely without errors',
            dependencies: [],
            important_files: [],
            failureInstructions: `IF BUILD FAILS: Create specific TASK CREATION tasks in TODO.json to fix build issues:
- Missing dependencies installation tasks
- Build configuration setup tasks  
- Compilation error resolution tasks
- Environment setup tasks
- Build script creation tasks

CRITICAL: Use TaskManager API to add these tasks immediately when build failures are detected.`
        },
        {
            criteria: 'Verify no lint errors exist in the codebase',
            dependencies: [],
            important_files: [],
            failureInstructions: `IF LINT ERRORS FOUND: Create specific TASK CREATION tasks in TODO.json to achieve zero lint errors:
- Linting tool setup and configuration tasks
- Code style correction tasks
- Import organization tasks
- Naming convention fixes tasks
- Dead code removal tasks

CRITICAL: Use TaskManager API to add these tasks immediately when lint errors are detected.`
        },
        {
            criteria: 'Confirm test coverage is 100% on important modules and 90%+ on others, with all tests passing',
            dependencies: [],
            important_files: [],
            failureInstructions: `IF TEST COVERAGE INSUFFICIENT: Create specific TASK CREATION tasks in TODO.json to achieve required coverage:
- Test framework setup tasks (Jest/Mocha/Vitest)
- Unit test creation tasks for all modules
- Integration test development tasks
- Test coverage reporting setup tasks
- CI/CD test integration tasks

CRITICAL: Use TaskManager API to add these tasks immediately when coverage is below requirements.`
        }
    ];
    
    reviewTasks.forEach((reviewTask, index) => {
        todoData.tasks.push({
            id: `review-strike-${index + 1}`,
            mode: 'REVIEWER',
            description: `Review Strike ${index + 1}: ${reviewTask.criteria}`,
            prompt: `Perform a comprehensive code review with focus on: ${reviewTask.criteria}

Check the entire codebase and ensure this criterion is met.

## CRITICAL FAILURE RESPONSE PROTOCOL

${reviewTask.failureInstructions}

## SUCCESS CRITERIA
- Mark this review task as completed ONLY if the criterion is fully met
- If criterion fails, you MUST create remediation tasks using TaskManager API before marking review as completed
- All new tasks should be actionable, specific, and include proper dependencies/important_files parameters

## TASK CREATION REQUIREMENT
When creating remediation tasks, ensure each task includes:
- Clear success criteria
- Appropriate mode (DEVELOPMENT/TESTING/REFACTORING)
- Specific file dependencies
- Realistic time estimates
- High priority for critical issues

Use the task-creation.md guidelines for optimal task structure.`,
            dependencies: reviewTask.dependencies,
            important_files: reviewTask.important_files,
            status: 'pending',
            requires_research: false,
            subtasks: [],
            is_review_task: true,
            strike_number: index + 1
        });
    });
    
    // Write TODO.json
    fs.writeFileSync(todoPath, JSON.stringify(todoData, null, 2));
    console.log(`\n✓ TODO.json created at: ${todoPath}`);
    
    return true;
}

async function main() {
    console.log('=== Infinite Continue Stop Hook - TODO.json Setup ===\n');
    
    // Validate project path argument
    if (!projectPath) {
        console.error('Error: Project path is required');
        console.error('Usage: node setup-infinite-hook.js /path/to/project [options]');
        console.error('\nOptions:');
        console.error('  --no-interactive        Run without prompts (requires other flags)');
        console.error('  --project-name NAME     Set project name');
        console.error('  --task DESCRIPTION      Set initial task description');
        console.error('  --mode MODE             Set task mode (DEVELOPMENT/REFACTORING/TESTING/RESEARCH)');
        console.error('  --prompt PROMPT         Set detailed task prompt');
        console.error('  --dependencies LIST     Comma-separated list of dependencies');
        console.error('  --important-files LIST  Comma-separated list of important files');
        console.error('  --requires-research     Flag task as requiring research');
        process.exit(1);
    }
    
    // Resolve project path
    const targetPath = path.resolve(projectPath);
    
    // Verify project path exists
    if (!fs.existsSync(targetPath)) {
        console.error(`Error: Project path does not exist: ${targetPath}`);
        process.exit(1);
    }
    
    // Verify it's a directory
    if (!fs.statSync(targetPath).isDirectory()) {
        console.error(`Error: Project path is not a directory: ${targetPath}`);
        process.exit(1);
    }
    
    console.log(`Setting up TODO.json for: ${targetPath}`);
    
    try {
        // Get project information
        const projectInfo = await getProjectInfo(targetPath);
        
        // Create project directories and copy mode files
        console.log('\n=== Creating Project Directories ===');
        await createProjectDirectories(targetPath);
        
        // Create TODO.json
        console.log('\n=== Creating TODO.json ===');
        const success = await createTodoJson(targetPath, projectInfo);
        
        if (success) {
            console.log('\n✅ Setup complete!');
            console.log('\nThe following has been created for this project:');
            console.log('- TODO.json with initial task and review tasks');
            console.log('- /development directory for project-specific guidelines');
            console.log('- /development/modes directory with all mode files');
            console.log('\n⚠️  Note: This script assumes the global hook is already configured.');
            console.log('If the hook is not working, ensure the following command is in ~/.claude/settings.json:');
            console.log('node /Users/jeremyparker/Desktop/Claude\\\\ Coding\\\\ Projects/infinite-continue-stop-hook/stop-hook.js');
            
            // Run test hook to verify
            console.log('\n=== Testing Hook Setup ===');
            const testHookPath = path.join(__dirname, 'test-hook.js');
            if (fs.existsSync(testHookPath)) {
                const { execSync } = require('child_process');
                try {
                    execSync(`node "${testHookPath}"`, { 
                        cwd: targetPath,
                        stdio: 'inherit'
                    });
                } catch {
                    console.error('⚠️  Test hook failed, but setup was completed successfully');
                }
            }
        }
        
    } catch (error) {
        console.error('\n❌ Setup error:', error.message);
        process.exit(1);
    } finally {
        rl.close();
    }
}

// Run main function
main();