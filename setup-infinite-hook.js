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
        } catch (error) {
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
    
    // Add three review tasks for the three-strike policy
    const reviewCriteria = [
        'Ensure the project builds completely without errors',
        'Verify no lint errors exist in the codebase',
        'Confirm test coverage is 100% on important modules and 90%+ on others, with all tests passing'
    ];
    
    reviewCriteria.forEach((criteria, index) => {
        todoData.tasks.push({
            id: `review-strike-${index + 1}`,
            mode: 'REVIEWER',
            description: `Review Strike ${index + 1}: ${criteria}`,
            prompt: `Perform a comprehensive code review with focus on: ${criteria}\n\nCheck the entire codebase and ensure this criterion is met. If not met, create specific tasks to address the issues found.`,
            dependencies: ['**/*.js', '**/*.ts', '**/*.jsx', '**/*.tsx', '**/*.py', '**/*.json'],
            important_files: ['package.json', 'tsconfig.json', '.eslintrc', 'pyproject.toml', 'requirements.txt'],
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
        
        // Create TODO.json
        console.log('\n=== Creating TODO.json ===');
        const success = await createTodoJson(targetPath, projectInfo);
        
        if (success) {
            console.log('\n✅ Setup complete!');
            console.log('\nTODO.json has been created for this project.');
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
                } catch (error) {
                    console.error('⚠️  Test hook failed, but TODO.json was created successfully');
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