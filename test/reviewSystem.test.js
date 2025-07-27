// =============================================================================
// reviewSystem.test.js - Comprehensive Test Suite for ReviewSystem Class
// 
// This test suite provides comprehensive coverage of the ReviewSystem class including
// quality checks, strike logic, task creation, and integration scenarios.
// =============================================================================

const ReviewSystem = require('../lib/reviewSystem');
const fs = require('fs');
const { execSync } = require('child_process');

// Mock dependencies
jest.mock('fs');
jest.mock('child_process');

describe('ReviewSystem', () => {
    let reviewSystem;
    let mockWorkingDir;

    beforeEach(() => {
        reviewSystem = new ReviewSystem();
        mockWorkingDir = '/test/project';
        
        // Reset all mocks
        jest.clearAllMocks();
    });

    describe('Constructor', () => {
        test('should initialize with default review criteria', () => {
            const system = new ReviewSystem();
            expect(system.reviewCriteria).toBeDefined();
            expect(system.reviewCriteria[1]).toEqual({
                name: 'Build Verification',
                tasks: [
                    'Run clean build from scratch',
                    'Verify zero build errors',
                    'Check all dependencies installed',
                    'Ensure build artifacts generated'
                ]
            });
            expect(system.reviewCriteria[2]).toEqual({
                name: 'Lint and Code Quality',
                tasks: [
                    'Run all linters',
                    'Ensure zero lint errors',
                    'Check for console.log statements',
                    'Verify code style consistency'
                ]
            });
            expect(system.reviewCriteria[3]).toEqual({
                name: 'Test Coverage and Success',
                tasks: [
                    'Run all tests',
                    'Verify 100% coverage on critical modules',
                    'Check 90%+ coverage on other modules',
                    'Ensure no skipped or failing tests'
                ]
            });
        });
    });

    describe('checkStrikeQuality', () => {
        const mockPackageJson = {
            scripts: {
                build: 'webpack --mode production',
                test: 'jest',
                'test:coverage': 'jest --coverage'
            },
            devDependencies: {
                jest: '^29.0.0'
            }
        };

        beforeEach(() => {
            fs.existsSync.mockReturnValue(false);
            fs.readFileSync.mockReturnValue('{}');
            execSync.mockReturnValue('');
        });

        test('should return perfect quality when all checks pass', async () => {
            // Setup successful scenario
            fs.existsSync.mockImplementation((filePath) => {
                if (filePath.includes('package.json')) return true;
                if (filePath.includes('node_modules')) return true;
                if (filePath.includes('eslint.config.js')) return true;
                return false;
            });
            
            fs.readFileSync.mockReturnValue(JSON.stringify(mockPackageJson));
            execSync.mockReturnValue('');

            const result = await reviewSystem.checkStrikeQuality(mockWorkingDir);

            expect(result.strike1.quality).toBe(100);
            expect(result.strike2.quality).toBe(100);
            expect(result.strike3.quality).toBe(100);
            expect(result.overallReady).toBe(true);
            expect(result.strike1.issues).toHaveLength(0);
            expect(result.strike2.issues).toHaveLength(0);
            expect(result.strike3.issues).toHaveLength(0);
        });

        test('should detect missing build script', async () => {
            const packageWithoutBuild = { scripts: { test: 'jest' } };
            
            fs.existsSync.mockImplementation((filePath) => {
                return filePath.includes('package.json');
            });
            fs.readFileSync.mockReturnValue(JSON.stringify(packageWithoutBuild));

            const result = await reviewSystem.checkStrikeQuality(mockWorkingDir);

            expect(result.strike1.quality).toBe(80);
            expect(result.strike1.issues).toContain('No build script defined in package.json');
            expect(result.overallReady).toBe(false);
        });

        test('should detect missing node_modules', async () => {
            fs.existsSync.mockImplementation((filePath) => {
                if (filePath.includes('package.json')) return true;
                if (filePath.includes('node_modules')) return false;
                return false;
            });
            fs.readFileSync.mockReturnValue(JSON.stringify(mockPackageJson));

            const result = await reviewSystem.checkStrikeQuality(mockWorkingDir);

            expect(result.strike1.quality).toBe(60);
            expect(result.strike1.issues).toContain('node_modules not found - dependencies not installed');
        });

        test('should detect build failures', async () => {
            fs.existsSync.mockImplementation((filePath) => {
                if (filePath.includes('package.json')) return true;
                if (filePath.includes('node_modules')) return true;
                return false;
            });
            fs.readFileSync.mockReturnValue(JSON.stringify(mockPackageJson));
            execSync.mockImplementation((command) => {
                if (command.includes('npm run build')) {
                    throw new Error('Build failed');
                }
                return '';
            });

            const result = await reviewSystem.checkStrikeQuality(mockWorkingDir);

            expect(result.strike1.quality).toBe(50);
            expect(result.strike1.issues).toContain('Build command fails');
        });

        test('should detect missing ESLint configuration', async () => {
            fs.existsSync.mockImplementation((filePath) => {
                if (filePath.includes('package.json')) return true;
                if (filePath.includes('node_modules')) return true;
                return false; // No eslint config files
            });
            fs.readFileSync.mockReturnValue(JSON.stringify(mockPackageJson));

            const result = await reviewSystem.checkStrikeQuality(mockWorkingDir);

            expect(result.strike2.quality).toBe(70);
            expect(result.strike2.issues).toContain('No ESLint configuration found');
        });

        test('should detect and count lint errors', async () => {
            const lintOutput = JSON.stringify([
                {
                    filePath: '/test/file1.js',
                    errorCount: 3,
                    warningCount: 2
                },
                {
                    filePath: '/test/file2.js',
                    errorCount: 2,
                    warningCount: 1
                }
            ]);

            fs.existsSync.mockImplementation((filePath) => {
                if (filePath.includes('package.json')) return true;
                if (filePath.includes('eslint.config.js')) return true;
                return false;
            });
            fs.readFileSync.mockReturnValue(JSON.stringify(mockPackageJson));
            
            const mockError = new Error('ESLint found errors');
            mockError.stdout = lintOutput;
            execSync.mockImplementation((command) => {
                if (command.includes('npx eslint')) {
                    throw mockError;
                }
                return '';
            });

            const result = await reviewSystem.checkStrikeQuality(mockWorkingDir);

            expect(result.strike2.quality).toBe(75); // 100 - 5*5 (errors) 
            expect(result.strike2.issues).toContain('5 lint errors found');
            expect(result.strike2.issues).toContain('3 lint warnings found');
        });

        test('should detect missing test script', async () => {
            const packageWithoutTest = { scripts: { build: 'webpack' } };
            
            fs.existsSync.mockImplementation((filePath) => {
                return filePath.includes('package.json');
            });
            fs.readFileSync.mockReturnValue(JSON.stringify(packageWithoutTest));

            const result = await reviewSystem.checkStrikeQuality(mockWorkingDir);

            expect(result.strike3.quality).toBe(40);
            expect(result.strike3.issues).toContain('No test script defined');
        });

        test('should detect failing tests', async () => {
            fs.existsSync.mockImplementation((filePath) => {
                return filePath.includes('package.json');
            });
            fs.readFileSync.mockReturnValue(JSON.stringify(mockPackageJson));
            execSync.mockImplementation((command) => {
                if (command.includes('npm test')) {
                    throw new Error('Tests failed');
                }
                return '';
            });

            const result = await reviewSystem.checkStrikeQuality(mockWorkingDir);

            expect(result.strike3.quality).toBe(30);
            expect(result.strike3.issues).toContain('Tests are failing');
        });

        test('should detect missing coverage script', async () => {
            const packageWithoutCoverage = { 
                scripts: { 
                    build: 'webpack',
                    test: 'jest'
                } 
            };
            
            fs.existsSync.mockImplementation((filePath) => {
                return filePath.includes('package.json');
            });
            fs.readFileSync.mockReturnValue(JSON.stringify(packageWithoutCoverage));

            const result = await reviewSystem.checkStrikeQuality(mockWorkingDir);

            expect(result.strike3.quality).toBe(80);
            expect(result.strike3.issues).toContain('No coverage script defined');
        });

        test('should handle coverage check failures', async () => {
            fs.existsSync.mockImplementation((filePath) => {
                return filePath.includes('package.json');
            });
            fs.readFileSync.mockReturnValue(JSON.stringify(mockPackageJson));
            execSync.mockImplementation((command) => {
                if (command.includes('test:coverage')) {
                    throw new Error('Coverage check failed');
                }
                return '';
            });

            const result = await reviewSystem.checkStrikeQuality(mockWorkingDir);

            expect(result.strike3.quality).toBe(70);
            expect(result.strike3.issues).toContain('Coverage check failed');
        });

        test('should handle filesystem errors gracefully', async () => {
            fs.existsSync.mockImplementation(() => {
                throw new Error('Filesystem error');
            });

            const result = await reviewSystem.checkStrikeQuality(mockWorkingDir);

            expect(result.overallReady).toBe(false);
            expect(result.strike1.issues).toContain('Build check error: Filesystem error');
        });

        test('should handle JSON parsing errors', async () => {
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue('invalid json{');

            const result = await reviewSystem.checkStrikeQuality(mockWorkingDir);

            expect(result.overallReady).toBe(false);
            // Should handle the error gracefully and not crash
        });

        test('should handle command execution timeouts', async () => {
            fs.existsSync.mockImplementation((filePath) => {
                return filePath.includes('package.json');
            });
            fs.readFileSync.mockReturnValue(JSON.stringify(mockPackageJson));
            execSync.mockImplementation((command, options) => {
                if (options.timeout && command.includes('npm run build')) {
                    const error = new Error('Command timed out');
                    error.signal = 'SIGTERM';
                    throw error;
                }
                return '';
            });

            const result = await reviewSystem.checkStrikeQuality(mockWorkingDir);

            expect(result.strike1.quality).toBe(50);
            expect(result.strike1.issues).toContain('Build command fails');
        });
    });

    describe('createQualityImprovementTask', () => {
        test('should create task with quality issues analysis', () => {
            const qualityResults = {
                strike1: {
                    name: 'Build Verification',
                    quality: 80,
                    issues: ['No build script defined', 'Dependencies missing']
                },
                strike2: {
                    name: 'Lint and Code Quality',
                    quality: 60,
                    issues: ['5 lint errors found']
                },
                strike3: {
                    name: 'Test Coverage and Success',
                    quality: 100,
                    issues: []
                }
            };

            const task = reviewSystem.createQualityImprovementTask(qualityResults, 'test-project');

            expect(task.id).toMatch(/^quality-improvement-\d+$/);
            expect(task.title).toBe('Create Quality Improvement Tasks');
            expect(task.mode).toBe('TASK-CREATION');
            expect(task.priority).toBe('high');
            expect(task.status).toBe('pending');
            expect(task.is_quality_improvement_task).toBe(true);
            expect(task.quality_analysis).toEqual(qualityResults);
            
            expect(task.prompt).toContain('Strike 1 (Build): 80%');
            expect(task.prompt).toContain('Strike 2 (Lint): 60%');
            expect(task.prompt).toContain('Strike 3 (Tests): 100%');
            expect(task.prompt).toContain('- Build Verification: No build script defined');
            expect(task.prompt).toContain('- Lint and Code Quality: 5 lint errors found');
            
            expect(task.success_criteria).toContain('All quality issues identified and analyzed');
            expect(task.important_files).toContain('package.json');
        });

        test('should handle empty quality results', () => {
            const qualityResults = {};

            const task = reviewSystem.createQualityImprovementTask(qualityResults, 'test-project');

            expect(task.title).toBe('Create Quality Improvement Tasks');
            expect(task.prompt).toContain('Strike 1 (Build): 0%');
            expect(task.prompt).toContain('Strike 2 (Lint): 0%');
            expect(task.prompt).toContain('Strike 3 (Tests): 0%');
        });

        test('should filter out strikes with 100% quality from issues', () => {
            const qualityResults = {
                strike1: {
                    name: 'Build Verification',
                    quality: 100,
                    issues: []
                },
                strike2: {
                    name: 'Lint and Code Quality',
                    quality: 80,
                    issues: ['2 lint errors found']
                }
            };

            const task = reviewSystem.createQualityImprovementTask(qualityResults, 'test-project');

            expect(task.prompt).toContain('- Lint and Code Quality: 2 lint errors found');
            expect(task.prompt).not.toContain('Build Verification:');
        });
    });

    describe('insertTasksBeforeStrikes', () => {
        test('should insert new tasks before review tasks', () => {
            const todoData = {
                tasks: [
                    { id: 'task-1', title: 'Regular Task 1' },
                    { id: 'task-2', title: 'Regular Task 2' },
                    { id: 'review-1', title: 'Review Task 1', is_review_task: true },
                    { id: 'review-2', title: 'Review Task 2', is_review_task: true }
                ]
            };

            const newTasks = [
                { id: 'new-1', title: 'New Task 1' },
                { id: 'new-2', title: 'New Task 2' }
            ];

            const result = reviewSystem.insertTasksBeforeStrikes(todoData, newTasks);

            expect(result.tasks).toHaveLength(6);
            expect(result.tasks[0].id).toBe('task-1');
            expect(result.tasks[1].id).toBe('task-2');
            expect(result.tasks[2].id).toBe('new-1');
            expect(result.tasks[3].id).toBe('new-2');
            expect(result.tasks[4].id).toBe('review-1');
            expect(result.tasks[5].id).toBe('review-2');
        });

        test('should handle todoData with no review tasks', () => {
            const todoData = {
                tasks: [
                    { id: 'task-1', title: 'Regular Task 1' },
                    { id: 'task-2', title: 'Regular Task 2' }
                ]
            };

            const newTasks = [{ id: 'new-1', title: 'New Task 1' }];

            const result = reviewSystem.insertTasksBeforeStrikes(todoData, newTasks);

            expect(result.tasks).toHaveLength(3);
            expect(result.tasks[2].id).toBe('new-1');
        });

        test('should handle empty new tasks array', () => {
            const todoData = {
                tasks: [
                    { id: 'task-1', title: 'Regular Task 1' },
                    { id: 'review-1', title: 'Review Task 1', is_review_task: true }
                ]
            };

            const result = reviewSystem.insertTasksBeforeStrikes(todoData, []);

            expect(result.tasks).toHaveLength(2);
            expect(result.tasks[0].id).toBe('task-1');
            expect(result.tasks[1].id).toBe('review-1');
        });
    });

    describe('injectQualityImprovementTask', () => {
        test('should inject quality improvement task before strikes', () => {
            const todoData = {
                tasks: [
                    { id: 'task-1', title: 'Regular Task' },
                    { id: 'review-1', title: 'Review Task', is_review_task: true }
                ]
            };

            const qualityResults = {
                strike1: { name: 'Build', quality: 80, issues: ['Missing build script'] }
            };

            const result = reviewSystem.injectQualityImprovementTask(todoData, qualityResults, 'test-project');

            expect(result.tasks).toHaveLength(3);
            expect(result.tasks[0].id).toBe('task-1');
            expect(result.tasks[1].title).toBe('Create Quality Improvement Tasks');
            expect(result.tasks[2].id).toBe('review-1');
        });
    });

    describe('createReviewTask', () => {
        test('should create review task for valid strike number', () => {
            const task = reviewSystem.createReviewTask(1, 'test-project');

            expect(task.id).toBe('review-strike-1');
            expect(task.mode).toBe('REVIEWER');
            expect(task.description).toBe('Review Strike 1: Build Verification');
            expect(task.status).toBe('pending');
            expect(task.is_review_task).toBe(true);
            expect(task.strike_number).toBe(1);
            expect(task.requires_research).toBe(false);
            expect(task.subtasks).toEqual([]);
            
            expect(task.dependencies).toContain('**/*.js');
            expect(task.dependencies).toContain('package.json');
            expect(task.important_files).toContain('package.json');
            expect(task.important_files).toContain('.eslintrc');
        });

        test('should throw error for invalid strike number', () => {
            expect(() => {
                reviewSystem.createReviewTask(4, 'test-project');
            }).toThrow('Invalid strike number: 4');

            expect(() => {
                reviewSystem.createReviewTask(0, 'test-project');
            }).toThrow('Invalid strike number: 0');
        });

        test('should create different tasks for each strike', () => {
            const task1 = reviewSystem.createReviewTask(1, 'test-project');
            const task2 = reviewSystem.createReviewTask(2, 'test-project');
            const task3 = reviewSystem.createReviewTask(3, 'test-project');

            expect(task1.description).toContain('Build Verification');
            expect(task2.description).toContain('Lint and Code Quality');
            expect(task3.description).toContain('Test Coverage and Success');
            
            expect(task1.id).toBe('review-strike-1');
            expect(task2.id).toBe('review-strike-2');
            expect(task3.id).toBe('review-strike-3');
        });
    });

    describe('buildReviewPrompt', () => {
        test('should build comprehensive review prompt', () => {
            const criteria = {
                name: 'Build Verification',
                tasks: [
                    'Run clean build from scratch',
                    'Verify zero build errors',
                    'Check all dependencies installed'
                ]
            };

            const prompt = reviewSystem.buildReviewPrompt(1, criteria);

            expect(prompt).toContain('Perform a comprehensive code review for Strike 1: Build Verification');
            expect(prompt).toContain('Review Checklist:');
            expect(prompt).toContain('1. Run clean build from scratch');
            expect(prompt).toContain('2. Verify zero build errors');
            expect(prompt).toContain('3. Check all dependencies installed');
            expect(prompt).toContain('Provide a detailed review report with:');
            expect(prompt).toContain('- Clear PASS/FAIL status for each criterion');
            expect(prompt).toContain('- Specific issues found with file locations');
            expect(prompt).toContain('If the review fails, create specific tasks');
        });

        test('should handle criteria with different number of tasks', () => {
            const criteria = {
                name: 'Test Coverage',
                tasks: [
                    'Run all tests',
                    'Verify coverage',
                    'Check for failures',
                    'Validate test quality',
                    'Review test documentation'
                ]
            };

            const prompt = reviewSystem.buildReviewPrompt(3, criteria);

            expect(prompt).toContain('1. Run all tests');
            expect(prompt).toContain('5. Review test documentation');
            expect(prompt).toContain('Strike 3: Test Coverage');
        });
    });

    describe('shouldInjectReviewTask', () => {
        test('should inject review task after 5 completed non-review tasks', () => {
            const todoData = {
                tasks: [
                    { id: 'task-1', status: 'completed' },
                    { id: 'task-2', status: 'completed' },
                    { id: 'task-3', status: 'completed' },
                    { id: 'task-4', status: 'completed' },
                    { id: 'task-5', status: 'completed' }
                ]
            };

            const result = reviewSystem.shouldInjectReviewTask(todoData);
            expect(result).toBe(true);
        });

        test('should not inject if review task already pending', () => {
            const todoData = {
                tasks: [
                    { id: 'task-1', status: 'completed' },
                    { id: 'task-2', status: 'completed' },
                    { id: 'task-3', status: 'completed' },
                    { id: 'task-4', status: 'completed' },
                    { id: 'task-5', status: 'completed' },
                    { id: 'review-1', status: 'pending', is_review_task: true }
                ]
            };

            const result = reviewSystem.shouldInjectReviewTask(todoData);
            expect(result).toBe(false);
        });

        test('should not inject if not enough completed tasks', () => {
            const todoData = {
                tasks: [
                    { id: 'task-1', status: 'completed' },
                    { id: 'task-2', status: 'completed' },
                    { id: 'task-3', status: 'pending' }
                ]
            };

            const result = reviewSystem.shouldInjectReviewTask(todoData);
            expect(result).toBe(false);
        });

        test('should ignore completed review tasks in count', () => {
            const todoData = {
                tasks: [
                    { id: 'task-1', status: 'completed' },
                    { id: 'task-2', status: 'completed' },
                    { id: 'task-3', status: 'completed' },
                    { id: 'task-4', status: 'completed' },
                    { id: 'task-5', status: 'completed' },
                    { id: 'review-1', status: 'completed', is_review_task: true }
                ]
            };

            const result = reviewSystem.shouldInjectReviewTask(todoData);
            expect(result).toBe(true);
        });

        test('should inject after next 5 completed tasks', () => {
            const todoData = {
                tasks: [
                    ...Array(10).fill(null).map((_, i) => ({ 
                        id: `task-${i}`, 
                        status: 'completed' 
                    }))
                ]
            };

            const result = reviewSystem.shouldInjectReviewTask(todoData);
            expect(result).toBe(true);
        });
    });

    describe('getNextStrikeNumber', () => {
        test('should return 1 for first strike', () => {
            const todoData = { tasks: [] };
            const result = reviewSystem.getNextStrikeNumber(todoData);
            expect(result).toBe(1);
        });

        test('should return 2 after first strike completed', () => {
            const todoData = {
                tasks: [
                    { id: 'review-1', status: 'completed', is_review_task: true }
                ]
            };
            const result = reviewSystem.getNextStrikeNumber(todoData);
            expect(result).toBe(2);
        });

        test('should return 3 after second strike completed', () => {
            const todoData = {
                tasks: [
                    { id: 'review-1', status: 'completed', is_review_task: true },
                    { id: 'review-2', status: 'completed', is_review_task: true }
                ]
            };
            const result = reviewSystem.getNextStrikeNumber(todoData);
            expect(result).toBe(3);
        });

        test('should cycle back to 1 after all three strikes', () => {
            const todoData = {
                tasks: [
                    { id: 'review-1', status: 'completed', is_review_task: true },
                    { id: 'review-2', status: 'completed', is_review_task: true },
                    { id: 'review-3', status: 'completed', is_review_task: true }
                ]
            };
            const result = reviewSystem.getNextStrikeNumber(todoData);
            expect(result).toBe(1);
        });

        test('should ignore pending review tasks', () => {
            const todoData = {
                tasks: [
                    { id: 'review-1', status: 'completed', is_review_task: true },
                    { id: 'review-2', status: 'pending', is_review_task: true }
                ]
            };
            const result = reviewSystem.getNextStrikeNumber(todoData);
            expect(result).toBe(2);
        });
    });

    describe('handleReviewResult', () => {
        test('should increment strikes and continue for passed review', () => {
            const todoData = { review_strikes: 0 };
            const result = reviewSystem.handleReviewResult(todoData, true);

            expect(todoData.review_strikes).toBe(1);
            expect(result.action).toBe('continue');
            expect(result.message).toBe('Strike 1 passed. 2 strikes remaining.');
        });

        test('should handle second strike pass', () => {
            const todoData = { review_strikes: 1 };
            const result = reviewSystem.handleReviewResult(todoData, true);

            expect(todoData.review_strikes).toBe(2);
            expect(result.action).toBe('continue');
            expect(result.message).toBe('Strike 2 passed. 1 strikes remaining.');
        });

        test('should complete strikes after third pass', () => {
            const todoData = { review_strikes: 2 };
            const result = reviewSystem.handleReviewResult(todoData, true);

            expect(todoData.review_strikes).toBe(3);
            expect(result.action).toBe('strikes_complete');
            expect(result.message).toBe('All three review strikes passed! Project meets quality standards.');
        });

        test('should handle failed review without incrementing strikes', () => {
            const todoData = { review_strikes: 1 };
            const result = reviewSystem.handleReviewResult(todoData, false);

            expect(todoData.review_strikes).toBe(1); // No increment on failure
            expect(result.action).toBe('remediation_needed');
            expect(result.message).toBe('Review failed. Remediation tasks have been created.');
        });
    });

    describe('createRemediationTasks', () => {
        test('should create build error remediation tasks', () => {
            const failures = {
                build_errors: [
                    {
                        file: 'src/main.js',
                        error: 'Syntax error: Unexpected token',
                        fix: 'Check syntax on line 15'
                    },
                    {
                        file: 'src/utils.js',
                        error: 'Module not found',
                        fix: 'Install missing dependency'
                    }
                ]
            };

            const tasks = reviewSystem.createRemediationTasks(failures);

            expect(tasks).toHaveLength(2);
            expect(tasks[0].mode).toBe('DEBUGGING');
            expect(tasks[0].description).toContain('Fix build error: Syntax error');
            expect(tasks[0].dependencies).toContain('src/main.js');
            expect(tasks[0].priority).toBe('high');
            expect(tasks[1].description).toContain('Fix build error: Module not found');
            expect(tasks[1].dependencies).toContain('src/utils.js');
        });

        test('should create lint error remediation task', () => {
            const failures = {
                lint_errors: [
                    'Unexpected semicolon at line 10',
                    'Unused variable at line 25'
                ],
                lint_files: ['src/app.js', 'src/component.js']
            };

            const tasks = reviewSystem.createRemediationTasks(failures);

            expect(tasks).toHaveLength(1);
            expect(tasks[0].mode).toBe('REFACTORING');
            expect(tasks[0].description).toBe('Fix all lint errors');
            expect(tasks[0].dependencies).toEqual(['src/app.js', 'src/component.js']);
            expect(tasks[0].important_files).toContain('.eslintrc');
            expect(tasks[0].prompt).toContain('Unexpected semicolon at line 10');
        });

        test('should create test failure remediation tasks', () => {
            const failures = {
                test_failures: [
                    {
                        name: 'User authentication test',
                        file: 'test/auth.test.js',
                        error: 'AssertionError: Expected true, got false',
                        related_files: ['src/auth.js']
                    }
                ]
            };

            const tasks = reviewSystem.createRemediationTasks(failures);

            expect(tasks).toHaveLength(1);
            expect(tasks[0].mode).toBe('DEBUGGING');
            expect(tasks[0].description).toContain('Fix failing test: User authentication test');
            expect(tasks[0].dependencies).toContain('test/auth.test.js');
            expect(tasks[0].important_files).toContain('src/auth.js');
        });

        test('should create coverage gap remediation tasks', () => {
            const failures = {
                coverage_gaps: [
                    {
                        file: 'src/critical.js',
                        current: 60,
                        required: 100,
                        uncovered_lines: 'Lines 45-60, 80-90',
                        is_critical: true,
                        test_files: ['test/critical.test.js']
                    },
                    {
                        file: 'src/utils.js',
                        current: 75,
                        required: 90,
                        uncovered_lines: 'Lines 20-25',
                        is_critical: false
                    }
                ]
            };

            const tasks = reviewSystem.createRemediationTasks(failures);

            expect(tasks).toHaveLength(2);
            expect(tasks[0].mode).toBe('TESTING');
            expect(tasks[0].description).toContain('Improve test coverage for src/critical.js');
            expect(tasks[0].priority).toBe('high'); // Critical file
            expect(tasks[0].prompt).toContain('from 60% to 100%');
            expect(tasks[0].important_files).toContain('test/critical.test.js');
            
            expect(tasks[1].priority).toBe('medium'); // Non-critical file
            expect(tasks[1].prompt).toContain('from 75% to 90%');
        });

        test('should handle empty failures object', () => {
            const tasks = reviewSystem.createRemediationTasks({});
            expect(tasks).toHaveLength(0);
        });

        test('should create unique task IDs', () => {
            const failures = {
                build_errors: [
                    { file: 'file1.js', error: 'Error 1', fix: 'Fix 1' },
                    { file: 'file2.js', error: 'Error 2', fix: 'Fix 2' }
                ]
            };

            const tasks = reviewSystem.createRemediationTasks(failures);
            
            expect(tasks[0].id).not.toBe(tasks[1].id);
            expect(tasks[0].id).toMatch(/^fix-build-\d+-[a-z0-9]+$/);
            expect(tasks[1].id).toMatch(/^fix-build-\d+-[a-z0-9]+$/);
        });

        test('should handle all failure types together', () => {
            const failures = {
                build_errors: [{ file: 'build.js', error: 'Build error', fix: 'Fix build' }],
                lint_errors: ['Lint error'],
                test_failures: [{ name: 'Test', file: 'test.js', error: 'Test error' }],
                coverage_gaps: [{ file: 'coverage.js', current: 50, required: 90, is_critical: false }]
            };

            const tasks = reviewSystem.createRemediationTasks(failures);
            
            expect(tasks).toHaveLength(4);
            expect(tasks.map(t => t.mode)).toEqual(['DEBUGGING', 'REFACTORING', 'DEBUGGING', 'TESTING']);
        });
    });

    describe('Edge Cases and Error Handling', () => {
        test('should handle malformed package.json gracefully', async () => {
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue('invalid json{');

            const result = await reviewSystem.checkStrikeQuality(mockWorkingDir);
            
            // Should not crash and return some result
            expect(result).toBeDefined();
            expect(result.overallReady).toBe(false);
        });

        test('should handle missing strike criteria', () => {
            expect(() => {
                reviewSystem.createReviewTask(999, 'test-project');
            }).toThrow('Invalid strike number: 999');
        });

        test('should handle null todoData in review operations', () => {
            const todoData = { tasks: null };
            
            expect(() => {
                reviewSystem.shouldInjectReviewTask(todoData);
            }).not.toThrow();
        });

        test('should handle extremely large number of completed tasks', () => {
            const todoData = {
                tasks: Array(1000).fill(null).map((_, i) => ({ 
                    id: `task-${i}`, 
                    status: 'completed' 
                }))
            };

            const result = reviewSystem.shouldInjectReviewTask(todoData);
            expect(result).toBe(true); // 1000 % 5 === 0
        });

        test('should handle command execution with various error types', async () => {
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue(JSON.stringify({ scripts: { build: 'build' } }));
            
            // Test different error scenarios
            const errorTypes = [
                new Error('ENOENT: command not found'),
                new Error('EACCES: permission denied'),
                { signal: 'SIGKILL', killed: true },
                { code: 1, stdout: 'Build failed' }
            ];

            for (const error of errorTypes) {
                execSync.mockImplementation(() => { throw error; });
                
                const result = await reviewSystem.checkStrikeQuality(mockWorkingDir);
                expect(result.strike1.quality).toBeLessThan(100);
            }
        });
    });

    describe('Integration Tests', () => {
        test('should handle complete quality improvement workflow', async () => {
            // Setup failing quality scenario
            fs.existsSync.mockImplementation((filePath) => {
                if (filePath.includes('package.json')) return true;
                return false; // No eslint config, no node_modules
            });
            
            fs.readFileSync.mockReturnValue(JSON.stringify({ scripts: { test: 'jest' } })); // No build script
            execSync.mockImplementation(() => { throw new Error('Tests failing'); });

            // Check quality
            const qualityResults = await reviewSystem.checkStrikeQuality(mockWorkingDir);
            expect(qualityResults.overallReady).toBe(false);

            // Create improvement task
            const improvementTask = reviewSystem.createQualityImprovementTask(qualityResults, 'test');
            expect(improvementTask.mode).toBe('TASK-CREATION');

            // Inject into todo data
            const todoData = { tasks: [] };
            const updatedTodoData = reviewSystem.injectQualityImprovementTask(todoData, qualityResults, 'test');
            
            expect(updatedTodoData.tasks).toHaveLength(1);
            expect(updatedTodoData.tasks[0].is_quality_improvement_task).toBe(true);
        });

        test('should handle complete review strike workflow', () => {
            let todoData = { tasks: [], review_strikes: 0 };

            // Add 5 completed tasks
            for (let i = 0; i < 5; i++) {
                todoData.tasks.push({ id: `task-${i}`, status: 'completed' });
            }

            // Should inject review task
            expect(reviewSystem.shouldInjectReviewTask(todoData)).toBe(true);

            // Get next strike number
            const strikeNumber = reviewSystem.getNextStrikeNumber(todoData);
            expect(strikeNumber).toBe(1);

            // Create review task
            const reviewTask = reviewSystem.createReviewTask(strikeNumber, 'test');
            todoData.tasks.push(reviewTask);

            // Handle successful review
            const result = reviewSystem.handleReviewResult(todoData, true);
            expect(result.action).toBe('continue');
            expect(todoData.review_strikes).toBe(1);

            // Should not inject another review task immediately
            expect(reviewSystem.shouldInjectReviewTask(todoData)).toBe(false);
        });

        test('should handle review failure with remediation', () => {
            const todoData = { tasks: [], review_strikes: 1 };
            
            // Handle failed review
            const result = reviewSystem.handleReviewResult(todoData, false);
            expect(result.action).toBe('remediation_needed');
            expect(todoData.review_strikes).toBe(1); // No increment on failure

            // Create remediation tasks
            const failures = {
                lint_errors: ['Error 1', 'Error 2'],
                test_failures: [{ name: 'Test', file: 'test.js', error: 'Failed' }]
            };

            const remediationTasks = reviewSystem.createRemediationTasks(failures);
            expect(remediationTasks).toHaveLength(2);
            expect(remediationTasks[0].mode).toBe('REFACTORING');
            expect(remediationTasks[1].mode).toBe('DEBUGGING');
        });
    });
});

// =============================================================================
// End of reviewSystem.test.js
// =============================================================================