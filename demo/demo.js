#!/usr/bin/env node
/**
 * Hook Activation Demo Script
 * 
 * Interactive demonstration of the infinite continue hook system showing:
 * - Automatic hook activation when Claude stops mid-task
 * - Mode-specific guidance generation
 * - Task management flow
 * - TODO.json updates
 */

const fs = require('fs');
const path = require('path');

class HookActivationDemo {
    constructor() {
        this.scenarios = {
            1: {
                name: 'Development Mode Hook',
                description: 'Shows hook activation during feature development',
                mode: 'DEVELOPMENT',
                setup: this.setupDevelopmentScenario.bind(this)
            },
            2: {
                name: 'Testing Mode Hook',
                description: 'Demonstrates hook activation when tests are failing',
                mode: 'TESTING', 
                setup: this.setupTestingScenario.bind(this)
            },
            3: {
                name: 'Debugging Mode Hook',
                description: 'Shows hook activation during error investigation',
                mode: 'DEBUGGING',
                setup: this.setupDebuggingScenario.bind(this)
            },
            4: {
                name: 'Task Creation Mode Hook',
                description: 'Demonstrates automatic task decomposition',
                mode: 'TASK_CREATION',
                setup: this.setupTaskCreationScenario.bind(this)
            },
            5: {
                name: 'Reviewer Mode Hook',
                description: 'Shows quality review process activation',
                mode: 'REVIEWER',
                setup: this.setupReviewerScenario.bind(this)
            }
        };
        
        this.demoDir = path.join(__dirname, 'demo-workspace');
        this.setupDemoEnvironment();
    }

    setupDemoEnvironment() {
        // Create demo workspace
        if (!fs.existsSync(this.demoDir)) {
            fs.mkdirSync(this.demoDir, { recursive: true });
        }

        // Create development directories
        const devDir = path.join(this.demoDir, 'development');
        const modesDir = path.join(devDir, 'modes');
        
        if (!fs.existsSync(modesDir)) {
            fs.mkdirSync(modesDir, { recursive: true });
        }

        // Copy mode files for demonstration
        this.copyModeFiles(modesDir);
    }

    copyModeFiles(targetDir) {
        const sourceDir = path.join(__dirname, '..', 'development', 'modes');
        const modeFiles = ['development.md', 'testing.md', 'debugging.md', 'task-creation.md', 'reviewer.md'];
        
        modeFiles.forEach(file => {
            const sourcePath = path.join(sourceDir, file);
            const targetPath = path.join(targetDir, file);
            
            if (fs.existsSync(sourcePath)) {
                fs.copyFileSync(sourcePath, targetPath);
            }
        });
    }

    async runScenario(scenarioNumber) {
        const scenario = this.scenarios[scenarioNumber];
        if (!scenario) {
            console.log('❌ Invalid scenario number');
            return;
        }

        console.log(`\n🎬 Running Demo: ${scenario.name}`);
        console.log(`📝 Description: ${scenario.description}\n`);

        // Setup scenario-specific environment
        await scenario.setup();

        // Simulate Claude stopping and hook activation
        console.log('⏸️  Simulating Claude stopping mid-task...\n');
        await this.delay(1000);

        // Show hook activation
        await this.demonstrateHookActivation(scenario.mode);

        // Show guidance generation
        await this.showModeGuidance(scenario.mode);

        // Show TODO.json updates
        await this.showTaskUpdates();

        console.log('\n✅ Demo scenario completed!\n');
    }

    async setupDevelopmentScenario() {
        console.log('🔧 Setting up development scenario...');
        
        // Create a sample TODO.json for development
        const todoData = {
            current_mode: 'DEVELOPMENT',
            project: 'sample-app',
            tasks: [
                {
                    id: 'task_dev_001',
                    title: 'Implement user authentication',
                    description: 'Add login and registration functionality',
                    mode: 'DEVELOPMENT',
                    status: 'in_progress',
                    priority: 'high',
                    success_criteria: [
                        'Login form implemented',
                        'Registration form implemented',
                        'JWT token generation working',
                        'Password hashing implemented'
                    ]
                }
            ]
        };

        this.writeTodoFile(todoData);
        console.log('✅ Development environment configured');
    }

    async setupTestingScenario() {
        console.log('🧪 Setting up testing scenario...');
        
        const todoData = {
            current_mode: 'TESTING',
            project: 'sample-app',
            test_results: {
                passing: 12,
                failing: 3,
                coverage: 78
            },
            tasks: [
                {
                    id: 'task_test_001',
                    title: 'Fix failing authentication tests',
                    description: 'Resolve test failures in user login flow',
                    mode: 'TESTING',
                    status: 'in_progress',
                    priority: 'high',
                    success_criteria: [
                        'All authentication tests pass',
                        'Test coverage above 80%',
                        'No flaky tests remaining'
                    ]
                }
            ]
        };

        this.writeTodoFile(todoData);
        console.log('✅ Testing environment configured');
    }

    async setupDebuggingScenario() {
        console.log('🐛 Setting up debugging scenario...');
        
        const todoData = {
            current_mode: 'DEBUGGING',
            project: 'sample-app',
            error_context: {
                last_error: 'TypeError: Cannot read property \'id\' of undefined',
                frequency: 'intermittent',
                affected_users: 'premium subscribers'
            },
            tasks: [
                {
                    id: 'task_debug_001',
                    title: 'Fix subscription validation error',
                    description: 'Debug TypeError in premium user validation',
                    mode: 'DEBUGGING',
                    status: 'in_progress',
                    priority: 'critical',
                    success_criteria: [
                        'Root cause identified',
                        'Error reproduction steps documented',
                        'Fix implemented and tested',
                        'No regression in other user types'
                    ]
                }
            ]
        };

        this.writeTodoFile(todoData);
        console.log('✅ Debugging environment configured');
    }

    async setupTaskCreationScenario() {
        console.log('📋 Setting up task creation scenario...');
        
        const todoData = {
            current_mode: 'TASK_CREATION',
            project: 'sample-app',
            completion_percentage: 45,
            tasks: [
                {
                    id: 'task_create_001',
                    title: 'Decompose payment system implementation',
                    description: 'Break down payment system into manageable subtasks',
                    mode: 'TASK_CREATION',
                    status: 'in_progress',
                    priority: 'high',
                    success_criteria: [
                        'Payment system broken into 4-6 subtasks',
                        'Each subtask has clear success criteria',
                        'Dependencies between tasks identified',
                        'Effort estimates provided'
                    ]
                }
            ]
        };

        this.writeTodoFile(todoData);
        console.log('✅ Task creation environment configured');
    }

    async setupReviewerScenario() {
        console.log('👨‍💻 Setting up reviewer scenario...');
        
        const todoData = {
            current_mode: 'REVIEWER',
            project: 'sample-app',
            review_strikes: 1,
            quality_metrics: {
                build_status: 'passing',
                lint_errors: 0,
                test_coverage: 92,
                code_complexity: 'medium'
            },
            tasks: [
                {
                    id: 'task_review_001',
                    title: 'Quality review of authentication module',
                    description: 'Comprehensive review of auth implementation',
                    mode: 'REVIEWER',
                    status: 'in_progress',
                    priority: 'high',
                    success_criteria: [
                        'Code quality standards verified',
                        'Security best practices confirmed',
                        'Performance benchmarks met',
                        'Documentation complete'
                    ]
                }
            ]
        };

        this.writeTodoFile(todoData);
        console.log('✅ Reviewer environment configured');
    }

    writeTodoFile(data) {
        const todoPath = path.join(this.demoDir, 'TODO.json');
        fs.writeFileSync(todoPath, JSON.stringify(data, null, 2));
    }

    async demonstrateHookActivation(mode) {
        console.log('🎯 Hook Activation Process:');
        console.log('  1. Detecting Claude stopped state...');
        await this.delay(800);
        
        console.log('  2. Analyzing project context...');
        await this.delay(600);
        
        console.log('  3. Reading TODO.json for current tasks...');
        await this.delay(500);
        
        console.log(`  4. Mode selected: ${mode}`);
        await this.delay(400);
        
        console.log('  5. Generating mode-specific guidance...');
        await this.delay(700);
        
        console.log('✅ Hook activated successfully!\n');
    }

    async showModeGuidance(mode) {
        console.log('📖 Generated Guidance:');
        console.log('─'.repeat(50));
        
        const guidance = this.generateModeGuidance(mode);
        console.log(guidance);
        
        console.log('─'.repeat(50));
    }

    generateModeGuidance(mode) {
        const guidanceMap = {
            'DEVELOPMENT': `🔧 DEVELOPMENT MODE ACTIVE

Current Focus: Feature Implementation
Priority: Complete user authentication system

Next Steps:
• Implement JWT token generation logic
• Add password hashing with bcrypt
• Create login/logout endpoints
• Write integration tests for auth flow

Quality Gates:
• Code coverage: 80% minimum
• No linting errors
• All tests passing`,

            'TESTING': `🧪 TESTING MODE ACTIVE

Current Focus: Test Quality & Coverage
Priority: Fix failing authentication tests

Next Steps:
• Debug failing test cases in auth.test.js
• Increase test coverage to 80%+
• Add edge case testing for login flow
• Validate error handling scenarios

Quality Gates:
• All tests passing: ✅
• Coverage target: 80%+ (currently 78%)
• No flaky tests remaining`,

            'DEBUGGING': `🐛 DEBUGGING MODE ACTIVE

Current Focus: Error Investigation
Priority: Fix subscription validation TypeError

Next Steps:
• Set up error monitoring and logging
• Reproduce error with premium user data
• Trace execution path to identify null reference
• Implement defensive programming patterns

Quality Gates:
• Root cause identified and documented
• Fix implemented with regression tests
• Error monitoring alerts configured`,

            'TASK_CREATION': `📋 TASK_CREATION MODE ACTIVE

Current Focus: Task Decomposition
Priority: Break down payment system implementation

Next Steps:
• Analyze payment system requirements
• Create 4-6 focused subtasks
• Define success criteria for each task
• Map task dependencies and priorities

Quality Gates:
• Each subtask: 2-4 hours scope
• Clear acceptance criteria defined
• Dependencies explicitly mapped`,

            'REVIEWER': `👨‍💻 REVIEWER MODE ACTIVE

Current Focus: Quality Assurance
Priority: Review authentication module implementation

Current Strike: 2/3 (Lint & Code Quality Focus)

Next Steps:
• Run comprehensive linting checks
• Verify code style consistency
• Check for console.log statements
• Validate error handling patterns

Quality Gates:
• Zero linting errors
• Code style consistency maintained
• No debug statements in production code`
        };

        return guidanceMap[mode] || 'Mode guidance not available';
    }

    async showTaskUpdates() {
        console.log('\n📝 TODO.json Updates:');
        console.log('─'.repeat(30));
        
        console.log('Before Hook:');
        console.log('• task_dev_001: in_progress');
        
        await this.delay(500);
        
        console.log('\nAfter Hook Activation:');
        console.log('• task_dev_001: in_progress (updated timestamp)');
        console.log('• guidance_generated: true');
        console.log('• last_hook_activation: ' + new Date().toISOString());
        
        console.log('\n✅ Task state synchronized');
    }

    showMainMenu() {
        console.clear();
        console.log('🎯 Infinite Continue Hook - Demo System');
        console.log('═'.repeat(50));
        console.log('\nAvailable Demo Scenarios:');
        
        Object.entries(this.scenarios).forEach(([num, scenario]) => {
            console.log(`  ${num}. ${scenario.name}`);
            console.log(`     ${scenario.description}`);
        });
        
        console.log('\n  0. Exit Demo');
        console.log('\n═'.repeat(50));
    }

    async delay(ms) {
        return new Promise(resolve => global.setTimeout(resolve, ms));
    }

    async promptUser(question) {
        const readline = require('readline');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        return new Promise(resolve => {
            rl.question(question, answer => {
                rl.close();
                resolve(answer);
            });
        });
    }

    async run() {
        while (true) {
            this.showMainMenu();
            
            const choice = await this.promptUser('\nSelect scenario (0-5): ');
            const scenarioNum = parseInt(choice);

            if (scenarioNum === 0) {
                console.log('\n👋 Thanks for exploring the Hook Demo System!');
                break;
            }

            if (this.scenarios[scenarioNum]) {
                await this.runScenario(scenarioNum);
                await this.promptUser('\nPress Enter to continue...');
            } else {
                console.log('\n❌ Invalid choice. Please select 0-5.');
                await this.delay(1500);
            }
        }
    }
}

// Run demo if called directly
if (require.main === module) {
    const demo = new HookActivationDemo();
    demo.run().catch(console.error);
}

module.exports = HookActivationDemo;